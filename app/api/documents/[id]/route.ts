export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getClientIp, getClientAgent } from '@/lib/audit-log'
import { sendSignInvite } from '@/lib/email'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  const doc = await prisma.document.findFirst({
    where: { id: params.id, ownerId: user?.id },
    include: {
      signers: { orderBy: { order: 'asc' } },
      auditLogs: { orderBy: { createdAt: 'asc' } },
      owner: { select: { name: true, email: true } },
    },
  })

  if (!doc) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })
  return NextResponse.json(doc)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  const doc = await prisma.document.findFirst({ where: { id: params.id, ownerId: user?.id } })
  if (!doc) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })

  const body = await req.json()
  const { action } = body

  if (action === 'cancel') {
    await prisma.document.update({ where: { id: doc.id }, data: { status: 'CANCELLED' } })
    await createAuditLog({
      documentId: doc.id, action: 'document_cancelled',
      actorEmail: session.user.email, actorIp: getClientIp(req), actorAgent: getClientAgent(req),
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'resend' && body.signerId) {
    const signer = await prisma.signer.findFirst({ where: { id: body.signerId, documentId: doc.id } })
    if (!signer) return NextResponse.json({ error: 'Signatário não encontrado.' }, { status: 404 })
    await sendSignInvite({
      to: signer.email, signerName: signer.name, documentTitle: doc.title,
      ownerName: user!.name, signToken: signer.signToken, expiresAt: doc.expiresAt,
    })
    await createAuditLog({
      documentId: doc.id, action: 'invite_resent',
      actorEmail: session.user.email, actorIp: getClientIp(req), actorAgent: getClientAgent(req),
      metadata: { signerEmail: signer.email },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
}
