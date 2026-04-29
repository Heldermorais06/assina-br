export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashFile, generateSignToken } from '@/lib/crypto'
import { sendSignInvite } from '@/lib/email'
import { createAuditLog } from '@/lib/audit-log'

const signerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  cpf: z.string().optional(),
  authMethod: z.enum(['EMAIL_TOKEN', 'SMS_TOKEN', 'WHATSAPP_TOKEN']).default('EMAIL_TOKEN'),
  order: z.number().int().min(0).default(0),
})

const documentSchema = z.object({
  title: z.string().min(3).max(200),
  fileUrl: z.string().min(10),
  fileBase64: z.string().optional(),
  fileName: z.string(),
  fileHash: z.string().min(10),
  signers: z.array(signerSchema).min(1).max(20),
  expiresAt: z.string().optional(),
  webhookUrl: z.string().url().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 10

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

  const where = {
    ownerId: user.id,
    ...(status ? { status: status as never } : {}),
  }

  const [docs, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: { signers: { select: { id: true, name: true, email: true, status: true, signedAt: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.document.count({ where }),
  ])

  return NextResponse.json({ documents: docs, total, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const body = await req.json()
    const data = documentSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const doc = await prisma.document.create({
      data: {
        title: data.title,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileHash: data.fileHash,
        status: 'PENDING',
        ownerId: user.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt + (data.expiresAt.includes('Z') ? '' : ':00Z')) : null,
        webhookUrl: data.webhookUrl ?? null,
        signers: {
          create: data.signers.map(s => ({
            name: s.name,
            email: s.email,
            cpf: s.cpf?.replace(/\D/g, '') ?? null,
            authMethod: s.authMethod,
            order: s.order,
            signToken: generateSignToken(),
          })),
        },
      },
      include: { signers: true },
    })

    await createAuditLog({
      documentId: doc.id,
      action: 'document_created',
      actorEmail: user.email,
      actorIp: req.headers.get('x-forwarded-for') ?? 'unknown',
      actorAgent: req.headers.get('user-agent') ?? 'unknown',
      metadata: { title: doc.title, signersCount: doc.signers.length },
    })

    // Enviar convites
    for (const signer of doc.signers) {
      await sendSignInvite({
        to: signer.email,
        signerName: signer.name,
        documentTitle: doc.title,
        ownerName: user.name,
        signToken: signer.signToken,
        expiresAt: doc.expiresAt,
      }).catch(console.error)

      await createAuditLog({
        documentId: doc.id,
        action: 'invite_sent',
        actorEmail: user.email,
        actorIp: req.headers.get('x-forwarded-for') ?? 'unknown',
        actorAgent: req.headers.get('user-agent') ?? 'unknown',
        metadata: { signerEmail: signer.email },
      })
    }

    return NextResponse.json(doc, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos.', details: err.errors }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
