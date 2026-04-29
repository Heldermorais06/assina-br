import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP } from '@/lib/crypto'
import { sendOTPEmail } from '@/lib/email'
import { createAuditLog, getClientIp, getClientAgent } from '@/lib/audit-log'
import { addMinutes } from 'date-fns'

const RATE_LIMIT: Record<string, { count: number; blockedUntil?: Date }> = {}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const ip = getClientIp(req)
  const key = `${params.token}:${ip}`

  const rateState = RATE_LIMIT[key]
  if (rateState?.blockedUntil && rateState.blockedUntil > new Date()) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 })
  }

  const signer = await prisma.signer.findUnique({
    where: { signToken: params.token },
    include: { document: true },
  })

  if (!signer) return NextResponse.json({ error: 'Token inválido.' }, { status: 404 })
  if (signer.status === 'SIGNED') return NextResponse.json({ error: 'Já assinado.' }, { status: 409 })

  // Invalida tokens anteriores não usados
  await prisma.authToken.updateMany({
    where: { signerId: signer.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  const otp = generateOTP()
  const expiresAt = addMinutes(new Date(), 10)

  await prisma.authToken.create({
    data: {
      signerId: signer.id,
      token: otp,
      expiresAt,
    },
  })

  try {
    await sendOTPEmail({ to: signer.email, signerName: signer.name, otp })
  } catch (err) {
    console.error('Erro ao enviar OTP:', err)
    return NextResponse.json({ error: 'Erro ao enviar e-mail.' }, { status: 500 })
  }

  await createAuditLog({
    documentId: signer.documentId,
    action: 'otp_sent',
    actorEmail: signer.email,
    actorIp: ip,
    actorAgent: getClientAgent(req),
  })

  RATE_LIMIT[key] = { count: (rateState?.count ?? 0) + 1 }

  return NextResponse.json({ ok: true })
}
