'use client'

import { useEffect, useState } from 'react'
import { SignLayout } from '@/components/layout/SignLayout'
import { CheckCircle2, Download, ClipboardList } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STEPS = [
  { id: 'review', label: 'Revisar', sublabel: '1 documento nesta etapa', status: 'completed' as const },
  { id: 'confirm', label: 'Confirmar dados', sublabel: 'Dados e assinatura', status: 'completed' as const },
  { id: 'authenticate', label: 'Autenticar', sublabel: 'Código por e-mail', status: 'completed' as const },
  { id: 'complete', label: 'Concluído', sublabel: 'Assinatura realizada', status: 'active' as const },
]

interface SignerData {
  name: string
  email: string
  signedAt: string
  ipAddress: string
  authMethod: string
  document: {
    title: string
    signedUrl: string | null
    id: string
    owner: { name: string }
  }
}

export default function CompletePage({ params }: { params: { token: string } }) {
  const [signer, setSigner] = useState<SignerData | null>(null)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

  useEffect(() => {
    fetch(`/api/sign/${params.token}`)
      .then(r => r.json())
      .then(setSigner)
  }, [params.token])

  const signedDate = signer?.signedAt
    ? format(new Date(signer.signedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })
    : ''

  return (
    <SignLayout steps={STEPS} companyName={signer?.document.owner.name} showBack={false}>
      <div className="text-center animate-slide-up">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-check-pop">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Documento assinado!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Sua assinatura eletrônica foi registrada com sucesso.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 mb-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Documento</span>
          <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{signer?.document.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Signatário</span>
          <span className="font-medium text-gray-900">{signer?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Data/hora</span>
          <span className="font-medium text-gray-900">{signedDate} UTC</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">IP de acesso</span>
          <span className="font-medium text-gray-900">{signer?.ipAddress ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Método</span>
          <span className="font-medium text-gray-900">{signer?.authMethod}</span>
        </div>
      </div>

      <div className="space-y-3">
        {signer?.document.id && (
          <a
            href={`/api/sign/${params.token}/download`}
            className="flex items-center justify-center gap-2 bg-orange-500 text-white rounded-full px-8 py-3 w-full font-semibold hover:bg-orange-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar PDF assinado
          </a>
        )}
        <a
          href={`/verificar/${signer?.document.id}`}
          className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 rounded-full px-8 py-3 w-full font-medium hover:bg-gray-50 transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          Ver trilha de auditoria
        </a>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Uma cópia de confirmação foi enviada para seu e-mail.
      </p>
    </SignLayout>
  )
}
