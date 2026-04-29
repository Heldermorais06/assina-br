import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getClientIp, getClientAgent } from '@/lib/audit-log'

const MAX_ATTEMPTS = 5
const BLOCK_MINUTES = 30

const schema = z.object({ otp: z.string().length(6) })

// In-memory attempt tracking (use Redis em produção)
const attempts: Record<string, { count: number; blockedUntil?: Date }> = {}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const ip = getClientIp(req)
  const key = `${params.token}:${ip}`

  const state = attempts[key] ?? { count: 0 }
  if (state.blockedUntil && state.blockedUntil > new Date()) {
    return NextResponse.json({
      error: `Bloqueado por excesso de tentativas. Tente novamente após ${state.blockedUntil.toLocaleTimeString('pt-BR')}.`,
      attemptsRemaining: 0,
    }, { status: 429 })
  }

  let body: { otp: string }
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Código inválido.' }, { status: 400 })
  }

  const signer = await prisma.signer.findUnique({ where: { signToken: params.token } })
  if (!signer) return NextResponse.json({ error: 'Token inválido.' }, { status: 404 })

  const authToken = await prisma.authToken.findFirst({
    where: {
      signerId: signer.id,
      token: body.otp,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!authToken) {
    state.count += 1
    if (state.count >= MAX_ATTEMPTS) {
      state.blockedUntil = new Date(Date.now() + BLOCK_MINUTES * 60 * 1000)
    }
    attempts[key] = state

    return NextResponse.json({
      valid: false,
      error: 'Código inválido ou expirado.',
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - state.count),
    }, { status: 400 })
  }

  await prisma.authToken.update({
    where: { id: authToken.id },
    data: { usedAt: new Date() },
  })

  delete attempts[key]

  await createAuditLog({
    documentId: signer.documentId,
    action: 'otp_verified',
    actorEmail: signer.email,
    actorIp: ip,
    actorAgent: getClientAgent(req),
  })

  return NextResponse.json({ valid: true })
}
