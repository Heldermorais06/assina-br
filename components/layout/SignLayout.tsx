'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import Image from 'next/image'
import { SignatureProgress } from './SignatureProgress'

interface Step {
  id: string
  label: string
  sublabel: string
  status: 'pending' | 'active' | 'completed'
}

interface Props {
  steps: Step[]
  children: React.ReactNode
  companyName?: string
  showBack?: boolean
  backHref?: string
}

export function SignLayout({ steps, children, companyName, showBack = true, backHref }: Props) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen">
      <SignatureProgress steps={steps} companyName={companyName} />

      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          {showBack ? (
            <button
              onClick={() => backHref ? router.push(backHref) : router.back()}
              className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          ) : <div />}
          <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-lg">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="/termos" className="text-orange-500 hover:underline">Termos de Uso</a>
            <a href="/privacidade" className="text-orange-500 hover:underline">Política de Privacidade</a>
          </div>
          <span className="text-xs text-gray-400">🔒 Ambiente seguro</span>
        </div>
      </div>
    </div>
  )
}
