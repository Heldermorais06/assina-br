'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignLayout } from '@/components/layout/SignLayout'
import { DrawSignature } from '@/components/signature/DrawSignature'
import { TypeSignature } from '@/components/signature/TypeSignature'
import { UserCheck } from 'lucide-react'

const STEPS = [
  { id: 'review', label: 'Revisar', sublabel: '1 documento nesta etapa', status: 'completed' as const },
  { id: 'confirm', label: 'Confirmar dados', sublabel: 'Dados e assinatura', status: 'active' as const },
  { id: 'authenticate', label: 'Autenticar', sublabel: 'Código por e-mail', status: 'pending' as const },
  { id: 'complete', label: 'Concluído', sublabel: 'Assinatura realizada', status: 'pending' as const },
]

type TabType = 'draw' | 'type' | 'upload'

interface Signer {
  name: string
  email: string
  cpf: string | null
  document: { owner: { name: string } }
}

export default function ConfirmPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [signer, setSigner] = useState<Signer | null>(null)
  const [tab, setTab] = useState<TabType>('draw')
  const [signatureImg, setSignatureImg] = useState('')
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/sign/${params.token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setSigner(data)
          setName(data.name)
          setCpf(data.cpf ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [params.token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!signatureImg) { setError('Por favor, adicione sua assinatura.'); return }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/sign/${params.token}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, cpf, signatureImg }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      router.push(`/sign/${params.token}/authenticate`)
    } else {
      setError(data.error ?? 'Erro ao salvar dados.')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <SignLayout steps={STEPS} companyName={signer?.document.owner.name}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <UserCheck className="w-7 h-7 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Confirmar dados</h1>
        <p className="text-gray-500 text-sm mt-1">Verifique seus dados e adicione sua assinatura</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="alert-error">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input type="text" required className="input-field" value={name}
            onChange={e => setName(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input type="email" readOnly className="input-field bg-gray-50 text-gray-500"
              value={signer?.email ?? ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input type="text" className="input-field" value={cpf}
              onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assinatura</label>
          <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
            {(['draw', 'type', 'upload'] as TabType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'draw' ? 'Desenhar' : t === 'type' ? 'Digitar' : 'Foto'}
              </button>
            ))}
          </div>

          {tab === 'draw' && <DrawSignature onCapture={setSignatureImg} />}
          {tab === 'type' && <TypeSignature name={name} onCapture={setSignatureImg} />}
          {tab === 'upload' && (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="sig-upload"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => setSignatureImg(ev.target?.result as string)
                  reader.readAsDataURL(file)
                }}
              />
              <label htmlFor="sig-upload" className="cursor-pointer">
                <p className="text-gray-400 text-sm mb-2">Clique para enviar foto da assinatura</p>
                <p className="text-xs text-gray-400">PNG, JPG até 2MB</p>
              </label>
              {signatureImg && tab === 'upload' && (
                <img src={signatureImg} alt="Assinatura" className="mt-3 max-h-24 mx-auto" />
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving || !signatureImg} className="btn-primary">
          {saving ? 'Salvando...' : 'Confirmar e continuar →'}
        </button>
      </form>
    </SignLayout>
  )
}
