import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const signer = await prisma.signer.findUnique({
    where: { signToken: params.token },
    include: {
      document: {
        include: { owner: { select: { name: true, email: true } } },
      },
    },
  })

  if (!signer) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 })
  }

  if (signer.document.expiresAt && signer.document.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Este link expirou.' }, { status: 410 })
  }

  if (signer.document.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Este documento foi cancelado.' }, { status: 410 })
  }

  return NextResponse.json(signer)
}
