import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Helder Morais'
const FROM_EMAIL = `${APP_NAME} <onboarding@resend.dev>`

export async function sendSignInvite({
  to,
  signerName,
  documentTitle,
  ownerName,
  signToken,
  expiresAt,
}: {
  to: string
  signerName: string
  documentTitle: string
  ownerName: string
  signToken: string
  expiresAt?: Date | null
}) {
  const signUrl = `${APP_URL}/sign/${signToken}/review`
  const expiryText = expiresAt
    ? `Este link expira em ${new Date(expiresAt).toLocaleDateString('pt-BR')}.`
    : 'Este link não tem data de expiração definida.'

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${APP_NAME} - Você tem um documento para assinar: ${documentTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: Inter, Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1B3BFF; padding: 24px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 700;">${APP_NAME}</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Assinatura Eletrônica com Validade Jurídica</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #1a1a2e; font-size: 15px; margin: 0 0 8px;">Olá, <strong>${signerName}</strong></p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
        <strong>${ownerName}</strong> solicitou sua assinatura no documento:
      </p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 600; color: #1a1a2e; font-size: 15px;">📄 ${documentTitle}</p>
      </div>
      <a href="${signUrl}" style="display: block; background: #F5821F; color: #fff; text-align: center; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 15px; text-decoration: none; margin-bottom: 20px;">
        Assinar documento agora →
      </a>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0 0 8px;">${expiryText}</p>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        Se você não esperava este e-mail, pode ignorá-lo com segurança.
      </p>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0; text-align: center;">
        ${APP_NAME} | Assinatura eletrônica conforme Lei 14.063/2020 e MP 2.200-2/2001
      </p>
    </div>
  </div>
</body>
</html>`,
  })
}

export async function sendOTPEmail({
  to,
  signerName,
  otp,
}: {
  to: string
  signerName: string
  otp: string
}) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Seu código de autenticação: ${otp}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1B3BFF; padding: 20px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 18px; font-weight: 700;">${APP_NAME}</h1>
    </div>
    <div style="padding: 32px; text-align: center;">
      <div style="width: 56px; height: 56px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
        <span style="font-size: 28px;">🔒</span>
      </div>
      <p style="color: #1a1a2e; font-size: 15px; margin: 0 0 8px;">Olá, <strong>${signerName}</strong></p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Seu código de autenticação para assinar o documento é:</p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <p style="letter-spacing: 12px; font-size: 36px; font-weight: 700; color: #1B3BFF; margin: 0; font-family: monospace;">${otp}</p>
      </div>
      <p style="color: #ef4444; font-size: 13px; font-weight: 600; margin: 0 0 8px;">⏰ Este código expira em 10 minutos</p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Se você não solicitou este código, ignore este e-mail.</p>
    </div>
  </div>
</body>
</html>`,
  })
}

export async function sendSignedConfirmation({
  to,
  signerName,
  documentTitle,
  signedAt,
  ipAddress,
  verificationUrl,
  downloadUrl,
}: {
  to: string
  signerName: string
  documentTitle: string
  signedAt: Date
  ipAddress: string
  verificationUrl: string
  downloadUrl?: string
}) {
  const dateStr = signedAt.toLocaleString('pt-BR', { timeZone: 'UTC' })

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Documento assinado com sucesso ✓ — ${documentTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #1B3BFF; padding: 24px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 700;">${APP_NAME}</h1>
    </div>
    <div style="padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <span style="font-size: 32px;">✅</span>
        </div>
        <h2 style="color: #15803d; margin: 0; font-size: 20px;">Documento assinado!</h2>
      </div>
      <p style="color: #6b7280; margin: 0 0 20px;">Olá <strong>${signerName}</strong>, sua assinatura foi registrada com sucesso.</p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px; color: #374151; font-size: 14px;"><strong>Documento:</strong> ${documentTitle}</p>
        <p style="margin: 0 0 8px; color: #374151; font-size: 14px;"><strong>Data/hora:</strong> ${dateStr} UTC</p>
        <p style="margin: 0; color: #374151; font-size: 14px;"><strong>IP de acesso:</strong> ${ipAddress}</p>
      </div>
      <a href="${verificationUrl}" style="display: block; background: #1B3BFF; color: #fff; text-align: center; padding: 12px 24px; border-radius: 9999px; font-weight: 600; font-size: 14px; text-decoration: none; margin-bottom: 12px;">
        Verificar autenticidade
      </a>
      ${downloadUrl ? `<a href="${downloadUrl}" style="display: block; border: 1px solid #d1d5db; color: #374151; text-align: center; padding: 12px 24px; border-radius: 9999px; font-size: 14px; text-decoration: none;">Baixar PDF assinado</a>` : ''}
    </div>
  </div>
</body>
</html>`,
  })
}
