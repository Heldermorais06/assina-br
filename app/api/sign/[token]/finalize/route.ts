export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { embedSignaturesInPDF } from '@/lib/pdf'
import { hashFile } from '@/lib/crypto'
import { sendSignedConfirmation } from '@/lib/email'
import { createAuditLog, getClientIp, getClientAgent } from '@/lib/audit-log'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const ip = getClientIp(req)
  const agent = getClientAgent(req)

  const signer = await prisma.signer.findUnique({
    where: { signToken: params.token },
    include: {
      document: {
        include: {
          signers: true,
          owner: true,
        },
      },
    },
  })

  if (!signer) return NextResponse.json({ error: 'Token inválido.' }, { status: 404 })
  if (signer.status === 'SIGNED') return NextResponse.json({ error: 'Já assinado.' }, { status: 409 })

  const validToken = await prisma.authToken.findFirst({
    where: {
      signerId: signer.id,
      usedAt: { not: null },
      expiresAt: { gt: new Date(Date.now() - 30 * 60 * 1000) },
    },
    orderBy: { usedAt: 'desc' },
  })

  if (!validToken) {
    return NextResponse.json({ error: 'Autenticação necessária.' }, { status: 401 })
  }

  const signedAt = new Date()

  await prisma.signer.update({
    where: { id: signer.id },
    data: {
      status: 'SIGNED',
      signedAt,
      ipAddress: ip,
      userAgent: agent,
    },
  })

  await createAuditLog({
    documentId: signer.documentId,
    action: 'document_signed',
    actorEmail: signer.email,
    actorIp: ip,
    actorAgent: agent,
    metadata: { signedAt: signedAt.toISOString(), authMethod: signer.authMethod },
  })

  // Verificar se todos assinaram
  const updatedDoc = await prisma.document.findUnique({
    where: { id: signer.documentId },
    include: { signers: true },
  })

  if (!updatedDoc) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })

  const allSigned = updatedDoc.signers.every(s => s.status === 'SIGNED')
  const someSigned = updatedDoc.signers.some(s => s.status === 'SIGNED')

  if (allSigned) {
    // Gerar PDF assinado
    try {
      const pdfResponse = await fetch(updatedDoc.fileUrl)
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())

      const signedSigners = updatedDoc.signers.filter(s => s.status === 'SIGNED')
      const signedPdfBytes = await embedSignaturesInPDF(
        pdfBuffer,
        updatedDoc.id,
        updatedDoc.fileHash,
        signedSigners.map(s => ({
          name: s.name,
          email: s.email,
          cpf: s.cpf,
          signedAt: s.signedAt!,
          ipAddress: s.ipAddress,
          authMethod: s.authMethod,
          signatureImg: s.signatureImg,
        }))
      )

      const signedHash = await hashFile(Buffer.from(signedPdfBytes))

      // Em produção: salvar no storage (S3/Supabase)
      // Por ora, usamos data URL base64 como fallback
      const signedBase64 = Buffer.from(signedPdfBytes).toString('base64')
      const signedUrl = `data:application/pdf;base64,${signedBase64}`

      await prisma.document.update({
        where: { id: updatedDoc.id },
        data: {
          status: 'COMPLETED',
          signedUrl,
          signedHash,
        },
      })

      await createAuditLog({
        documentId: updatedDoc.id,
        action: 'document_completed',
        actorEmail: signer.email,
        actorIp: ip,
        actorAgent: agent,
        metadata: { signedHash, totalSigners: signedSigners.length },
      })

      // Enviar confirmações por e-mail
      for (const s of signedSigners) {
        await sendSignedConfirmation({
          to: s.email,
          signerName: s.name,
          documentTitle: updatedDoc.title,
          signedAt: s.signedAt!,
          ipAddress: s.ipAddress ?? 'desconhecido',
          verificationUrl: `${APP_URL}/verificar/${updatedDoc.id}`,
          downloadUrl: signedUrl.startsWith('data:') ? undefined : signedUrl,
        }).catch(console.error)
      }

      // Disparar webhook se configurado
      if (updatedDoc.webhookUrl) {
        fetch(updatedDoc.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: updatedDoc.id,
            documentHash: signedHash,
            signedAt: signedAt.toISOString(),
            signers: signedSigners.map(s => ({
              name: s.name, email: s.email,
              signedAt: s.signedAt?.toISOString(), ip: s.ipAddress,
            })),
            verificationUrl: `${APP_URL}/verificar/${updatedDoc.id}`,
          }),
        }).catch(console.error)
      }

    } catch (err) {
      console.error('Erro ao gerar PDF assinado:', err)
      await prisma.document.update({
        where: { id: updatedDoc.id },
        data: { status: 'COMPLETED' },
      })
    }
  } else if (someSigned) {
    await prisma.document.update({
      where: { id: updatedDoc.id },
      data: { status: 'PARTIAL' },
    })
  }

  return NextResponse.json({ ok: true, allSigned })
}
