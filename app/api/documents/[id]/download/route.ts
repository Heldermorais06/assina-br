export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { embedSignaturesInPDF } from '@/lib/pdf'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  const doc = await prisma.document.findFirst({
    where: { id: params.id, ownerId: user?.id },
    include: { signers: true },
  })

  if (!doc) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })
  if (doc.status !== 'COMPLETED') return NextResponse.json({ error: 'Documento não concluído.' }, { status: 400 })

  // Decodifica o PDF original
  let originalBuffer: Buffer
  if (doc.fileUrl.startsWith('data:')) {
    originalBuffer = Buffer.from(doc.fileUrl.split(',')[1], 'base64')
  } else {
    const res = await fetch(doc.fileUrl)
    originalBuffer = Buffer.from(await res.arrayBuffer())
  }

  const signedSigners = doc.signers.filter(s => s.status === 'SIGNED')

  let signedPdfBytes: Uint8Array
  try {
    signedPdfBytes = await embedSignaturesInPDF(
      originalBuffer,
      doc.id,
      doc.fileHash,
      signedSigners.map(s => ({
        name: s.name,
        email: s.email,
        cpf: s.cpf,
        signedAt: s.signedAt ? new Date(s.signedAt) : new Date(),
        ipAddress: s.ipAddress,
        authMethod: s.authMethod,
        signatureImg: s.signatureImg,
      }))
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Erro ao gerar PDF', detail: msg }, { status: 500 })
  }

  const fileName = doc.fileName.replace(/\.pdf$/i, '') + '-assinado.pdf'

  return new NextResponse(signedPdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': signedPdfBytes.length.toString(),
    },
  })
}
