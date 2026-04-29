import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

interface SignerStamp {
  name: string
  email: string
  cpf?: string | null
  signedAt: Date
  ipAddress?: string | null
  authMethod: string
  signatureImg?: string | null
}

export async function embedSignaturesInPDF(
  originalPdfBytes: Uint8Array,
  documentId: string,
  documentHash: string,
  signers: SignerStamp[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const pages = pdfDoc.getPages()

  const verificationUrl = `${APP_URL}/verificar/${documentId}`
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 80, margin: 1 })
  const qrBase64 = qrDataUrl.split(',')[1]
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'))

  // Rodapé em cada página
  for (const page of pages) {
    const { width } = page.getSize()
    const footerText = `Hash: ${documentHash.substring(0, 24)}... | Verificar: ${verificationUrl}`
    page.drawText(footerText, {
      x: 10,
      y: 8,
      size: 6.5,
      font,
      color: rgb(0.5, 0.5, 0.5),
      maxWidth: width - 20,
    })
  }

  // Página de assinaturas
  const sigPage = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = sigPage.getSize()
  let y = height - 40

  // Header da página
  sigPage.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: rgb(0.106, 0.231, 1) })
  sigPage.drawText('PÁGINA DE ASSINATURAS ELETRÔNICAS', {
    x: 20, y: height - 38, size: 14, font: fontBold, color: rgb(1, 1, 1),
  })
  sigPage.drawText('Documento com validade jurídica — Lei 14.063/2020 | MP 2.200-2/2001', {
    x: 20, y: height - 52, size: 8, font, color: rgb(0.9, 0.9, 0.9),
  })
  y = height - 80

  // Hash do documento
  sigPage.drawText('INTEGRIDADE DO DOCUMENTO', { x: 20, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
  y -= 16
  sigPage.drawText(`SHA-256: ${documentHash}`, { x: 20, y, size: 7.5, font, color: rgb(0.3, 0.3, 0.3), maxWidth: width - 120 })
  y -= 12
  sigPage.drawText(`URL de verificação: ${verificationUrl}`, { x: 20, y, size: 8, font, color: rgb(0.1, 0.4, 0.9) })

  // QR Code
  sigPage.drawImage(qrImage, { x: width - 100, y: height - 160, width: 80, height: 80 })
  sigPage.drawText('Escanear para verificar', { x: width - 105, y: height - 170, size: 7, font, color: rgb(0.5, 0.5, 0.5) })

  y -= 24
  sigPage.drawLine({ start: { x: 20, y }, end: { x: width - 20, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 20

  // Assinantes
  sigPage.drawText('SIGNATÁRIOS', { x: 20, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
  y -= 20

  for (const signer of signers) {
    if (y < 120) {
      // TODO: adicionar nova página se necessário
      break
    }

    // Card do signatário
    sigPage.drawRectangle({
      x: 16, y: y - 90, width: width - 32, height: 95,
      borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 0.5,
      color: rgb(0.98, 0.98, 0.98),
    })

    // Ícone de check
    sigPage.drawCircle({ x: 36, y: y - 20, size: 10, color: rgb(0.13, 0.77, 0.37) })
    sigPage.drawText('✓', { x: 31, y: y - 24, size: 10, font: fontBold, color: rgb(1, 1, 1) })

    sigPage.drawText(signer.name, { x: 52, y: y - 18, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
    sigPage.drawText(signer.email, { x: 52, y: y - 30, size: 8, font, color: rgb(0.4, 0.4, 0.4) })

    if (signer.cpf) {
      sigPage.drawText(`CPF: ${signer.cpf}`, { x: 52, y: y - 42, size: 8, font, color: rgb(0.4, 0.4, 0.4) })
    }

    const signedAtStr = format(signer.signedAt, "dd/MM/yyyy 'às' HH:mm:ss 'UTC'", { locale: ptBR })
    sigPage.drawText(`Assinado em: ${signedAtStr}`, { x: 20, y: y - 56, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
    sigPage.drawText(`IP: ${signer.ipAddress ?? 'não registrado'} | Método: ${signer.authMethod}`, {
      x: 20, y: y - 68, size: 7.5, font, color: rgb(0.5, 0.5, 0.5),
    })

    // Imagem da assinatura
    if (signer.signatureImg) {
      try {
        const imgData = signer.signatureImg.replace(/^data:image\/\w+;base64,/, '')
        const imgBytes = Buffer.from(imgData, 'base64')
        let embeddedImg
        if (signer.signatureImg.includes('png')) {
          embeddedImg = await pdfDoc.embedPng(imgBytes)
        } else {
          embeddedImg = await pdfDoc.embedJpg(imgBytes)
        }
        sigPage.drawImage(embeddedImg, { x: width - 160, y: y - 82, width: 130, height: 60 })
      } catch {
        // ignora erro de imagem
      }
    }

    y -= 110
  }

  // Footer da página de assinaturas
  sigPage.drawText(
    `Documento gerado por AssinarBR | ${format(new Date(), "dd/MM/yyyy HH:mm:ss")} UTC`,
    { x: 20, y: 20, size: 7, font, color: rgb(0.6, 0.6, 0.6) }
  )

  return pdfDoc.save()
}
