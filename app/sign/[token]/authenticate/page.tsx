'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SignLayout } from '@/components/layout/SignLayout'
import { OTPInput } from '@/components/signature/OTPInput'
import { ShieldCheck, CheckCircle2 } from 'lucide-react'

const STEPS = [
  { id: 'review', label: 'Revisar', sublabel: '1 documento nesta etapa', status: 'completed' as const },
  { id: 'confirm', label: 'Confirmar dados', sublabel: 'Dados e assinatura', status: 'completed' as const },
  { id: 'authenticate', label: 'Autenticar', sublabel: 'Código por e-mail', status: 'active' as const },
  { id: 'complete', label: 'Concluído', sublabel: 'Assinatura realizada', status: 'pending' as const },
]

export default function AuthenticatePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [attempts, setAttempts] = useState(5)
  const [signerEmail, setSignerEmail] = useState('')
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    fetch(`/api/sign/${params.token}`)
      .then(r => r.json())
      .then(d => {
        setSignerEmail(d.email ?? '')
        setCompanyName(d.document?.owner?.name ?? '')
      })
    sendToken()
  }, [])

  const startCountdown = useCallback(() => {
    setCountdown(60)
    const iv = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(iv); return 0 }
        return c - 1
      })
    }, 1000)
  }, [])

  async function sendToken() {
    setLoading(true)
    const res = await fetch(`/api/sign/${params.token}/authenticate`, { method: 'POST' })
    setLoading(false)
    if (res.ok) startCountdown()
    else setError('Erro ao enviar código. Tente novamente.')
  }

  useEffect(() => {
    if (otp.length === 6 && !verified) verifyOtp()
  }, [otp])

  async function verifyOtp() {
    setError('')
    const res = await fetch(`/api/sign/${params.token}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp }),
    })
    const data = await res.json()
    if (res.ok && data.valid) {
      setVerified(true)
    } else {
      setAttempts(data.attemptsRemaining ?? attempts - 1)
      setError(data.error ?? 'Código inválido ou expirado.')
      setOtp('')
    }
  }

  async function handleFinalize() {
    setFinalizing(true)
    const res = await fetch(`/api/sign/${params.token}/finalize`, { method: 'POST' })
    setFinalizing(false)
    if (res.ok) {
      router.push(`/sign/${params.token}/complete`)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao finalizar assinatura.')
    }
  }

  const emailMasked = signerEmail.replace(/(.{2}).*(@.*)/, '$1***$2')

  return (
    <SignLayout steps={STEPS} companyName={companyName}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-8 h-8 text-blue-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Token de autenticação</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enviamos um código de 6 dígitos para <strong>{emailMasked}</strong>
        </p>
      </div>

      {verified ? (
        <div className="alert-success mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>Token já autenticado ✓</span>
        </div>
      ) : (
        <>
          {error && (
            <div className="alert-error mb-4">
              {error}
              {attempts < 5 && (
                <span className="block mt-1 font-medium">
                  {attempts} tentativa{attempts !== 1 ? 's' : ''} restante{attempts !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          <div className="mb-6">
            <OTPInput value={otp} onChange={setOtp} disabled={attempts <= 0} />
          </div>

          <div className="text-center mb-6">
            {countdown > 0 ? (
              <p className="text-sm text-gray-400">
                Reenviar código em <span className="font-bold text-gray-600">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={sendToken}
                disabled={loading}
                className="text-sm text-orange-500 hover:underline font-medium"
              >
                {loading ? 'Enviando...' : 'Reenviar código'}
              </button>
            )}
          </div>
        </>
      )}

      <button
        onClick={handleFinalize}
        disabled={!verified || finalizing}
        className="btn-primary"
      >
        {finalizing ? 'Finalizando...' : 'Finalizar assinatura'}
      </button>

      <p className="text-center text-xs text-gray-400 mt-4">
        Ao clicar em finalizar, você concorda com os{' '}
        <a href="/termos" className="text-orange-500 hover:underline">Termos de Uso</a>{' '}
        e{' '}
        <a href="/privacidade" className="text-orange-500 hover:underline">Política de Privacidade</a>.
      </p>
    </SignLayout>
  )
}
