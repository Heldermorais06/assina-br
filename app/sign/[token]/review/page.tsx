'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SignLayout } from '@/components/layout/SignLayout'
import { FileText, AlertCircle } from 'lucide-react'

type StepStatus = 'pending' | 'active' | 'completed'
const STEPS = (_current: string) => [
  { id: 'review', label: 'Revisar', sublabel: '1 documento nesta etapa', status: 'active' as StepStatus },
  { id: 'confirm', label: 'Confirmar dados', sublabel: 'Dados e assinatura', status: 'pending' as StepStatus },
  { id: 'authenticate', label: 'Autenticar', sublabel: 'Código por e-mail', status: 'pending' as StepStatus },
  { id: 'complete', label: 'Concluído', sublabel: 'Assinatura realizada', status: 'pending' as StepStatus },
]

interface Signer {
  id: string
  name: string
  email: string
  status: string
  document: {
    id: string
    title: string
    fileUrl: string
    status: string
    owner: { name: string }
  }
}

export default function ReviewPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [signer, setSigner] = useState<Signer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    fetch(`/api/sign/${params.token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setSigner(data)
      })
      .catch(() => setError('Erro ao carregar documento.'))
      .finally(() => setLoading(false))
  }, [params.token])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setScrolled(true)
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Link inválido ou expirado</h2>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  )

  if (signer?.status === 'SIGNED') return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Documento já assinado</h2>
        <p className="text-gray-500 text-sm">Você já assinou este documento anteriormente.</p>
      </div>
    </div>
  )

  return (
    <SignLayout steps={STEPS('review')} companyName={signer?.document.owner.name}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <FileText className="w-7 h-7 text-blue-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Revisar documento</h1>
        <p className="text-gray-500 text-sm mt-1">
          Solicitado por <strong>{signer?.document.owner.name}</strong>
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <div className="bg-gray-200 px-4 py-2 flex items-center gap-2 border-b border-gray-300">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 truncate">{signer?.document.title}</span>
        </div>
        <div
          className="h-[400px] overflow-y-auto"
          onScroll={handleScroll}
        >
          <iframe
            src={signer?.document.fileUrl}
            className="w-full h-full min-h-[400px]"
            title="Documento para assinatura"
          />
        </div>
      </div>

      <div className="flex items-start gap-3 mb-5 p-3 bg-orange-50 rounded-xl border border-orange-100">
        <input
          type="checkbox"
          id="agree"
          checked={agreed}
          onChange={e => { setAgreed(e.target.checked); setScrolled(true) }}
          className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer"
        />
        <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
          Li e compreendi todo o conteúdo do documento acima e concordo em prosseguir com a assinatura eletrônica.
        </label>
      </div>

      <button
        onClick={() => router.push(`/sign/${params.token}/confirm`)}
        disabled={!agreed && !scrolled}
        className="btn-primary"
      >
        Próximo →
      </button>
    </SignLayout>
  )
}
