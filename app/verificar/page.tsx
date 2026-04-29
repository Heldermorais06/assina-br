'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Search } from 'lucide-react'

export default function VerifyIndexPage() {
  const router = useRouter()
  const [code, setCode] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    router.push(`/verificar/${code.trim()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificar documento</h1>
        <p className="text-gray-500 text-sm mb-8">
          Insira o código do documento para verificar sua autenticidade e integridade.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            className="input-field text-center font-mono"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Código do documento"
          />
          <button type="submit" disabled={!code.trim()} className="btn-primary flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            Verificar
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-6">
          O código é encontrado no rodapé do PDF assinado ou no link de verificação enviado por e-mail.
        </p>
      </div>
    </div>
  )
}
