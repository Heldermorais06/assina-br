export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { embedSignaturesInPDF } from '@/lib/pdf'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const signer = await prisma.signer.findUnique({
    where: { signToken: params.token },
    include: {
      document: {
        include: { signers: true },
      },
    },
  })

  if (!signer) return NextResponse.json({ error: 'Token inválido.' }, { status: 404 })
  if (signer.document.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Documento não concluído.' }, { status: 400 })
  }

  const doc = signer.document

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
