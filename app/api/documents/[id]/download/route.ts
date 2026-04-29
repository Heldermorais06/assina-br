export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  const doc = await prisma.document.findFirst({
    where: { id: params.id, ownerId: user?.id },
    select: { signedUrl: true, fileName: true, status: true },
  })

  if (!doc) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })
  if (!doc.signedUrl) return NextResponse.json({ error: 'PDF assinado não disponível.' }, { status: 404 })

  let pdfBuffer: Buffer
  if (doc.signedUrl.startsWith('data:')) {
    const base64 = doc.signedUrl.split(',')[1]
    pdfBuffer = Buffer.from(base64, 'base64')
  } else {
    const res = await fetch(doc.signedUrl)
    pdfBuffer = Buffer.from(await res.arrayBuffer())
  }

  const fileName = doc.fileName.replace('.pdf', '') + '-assinado.pdf'

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  })
}
