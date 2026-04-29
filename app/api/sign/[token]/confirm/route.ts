import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validateCPF } from '@/lib/crypto'
import { createAuditLog, getClientIp, getClientAgent } from '@/lib/audit-log'

const schema = z.object({
  name: z.string().min(2).max(120),
  cpf: z.string().optional(),
  signatureImg: z.string().min(10),
})

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    if (data.cpf) {
      const clean = data.cpf.replace(/\D/g, '')
      if (!validateCPF(clean)) {
        return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
      }
    }

    const signer = await prisma.signer.findUnique({
      where: { signToken: params.token },
      include: { document: true },
    })

    if (!signer) return NextResponse.json({ error: 'Token inválido.' }, { status: 404 })
    if (signer.status === 'SIGNED') return NextResponse.json({ error: 'Já assinado.' }, { status: 409 })

    await prisma.signer.update({
      where: { id: signer.id },
      data: {
        name: data.name,
        cpf: data.cpf?.replace(/\D/g, '') ?? signer.cpf,
        signatureImg: data.signatureImg,
        ipAddress: getClientIp(req),
        userAgent: getClientAgent(req),
      },
    })

    await createAuditLog({
      documentId: signer.documentId,
      action: 'signer_confirmed_data',
      actorEmail: signer.email,
      actorIp: getClientIp(req),
      actorAgent: getClientAgent(req),
      metadata: { signerName: data.name },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
