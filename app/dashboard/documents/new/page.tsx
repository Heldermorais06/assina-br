'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload, Plus, Trash2, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
async function hashFileClient(arrayBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

interface SignerForm {
  name: string
  email: string
  cpf: string
  authMethod: 'EMAIL_TOKEN' | 'SMS_TOKEN' | 'WHATSAPP_TOKEN'
  order: number
}

export default function NewDocumentPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [fileHash, setFileHash] = useState('')
  const [signers, setSigners] = useState<SignerForm[]>([
    { name: '', email: '', cpf: '', authMethod: 'EMAIL_TOKEN', order: 0 },
  ])
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) { setError('Arquivo muito grande. Máximo 10MB.'); return }
    if (f.type !== 'application/pdf') { setError('Apenas arquivos PDF são aceitos.'); return }

    setFile(f)
    setUploading(true)
    setError('')

    try {
      const arrayBuffer = await f.arrayBuffer()
      const hash = await hashFileClient(arrayBuffer)
      setFileHash(hash)

      // Em produção: fazer upload para storage (S3/Supabase)
      // Por ora, usar data URL base64
      const reader = new FileReader()
      reader.onload = e => {
        setFileUrl(e.target?.result as string)
        setUploading(false)
      }
      reader.readAsDataURL(f)

      if (!title) setTitle(f.name.replace('.pdf', ''))
    } catch {
      setError('Erro ao processar arquivo.')
      setUploading(false)
    }
  }, [title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  function addSigner() {
    setSigners(prev => [...prev, { name: '', email: '', cpf: '', authMethod: 'EMAIL_TOKEN', order: prev.length }])
  }

  function removeSigner(i: number) {
    setSigners(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx })))
  }

  function updateSigner(i: number, field: keyof SignerForm, value: string) {
    setSigners(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !fileUrl || !fileHash) { setError('Por favor, selecione um arquivo PDF.'); return }
    if (signers.some(s => !s.name || !s.email)) { setError('Preencha nome e e-mail de todos os signatários.'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        fileUrl,
        fileName: file.name,
        fileHash,
        signers,
        expiresAt: expiresAt || undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      router.push(`/dashboard/documents/${data.id}`)
    } else {
      setError(data.error ?? 'Erro ao criar documento.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0e0b06] border-b border-[#2a1f0a]">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center relative">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-[#c9a96e] hover:text-[#e0b97a] text-sm font-medium absolute left-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex-1 flex justify-center">
            <Image src="/logo-helder-morais.png" alt="Helder Morais" width={120} height={46} className="object-contain" priority />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="alert-error">{error}</div>}

          {/* Upload */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-500" />
              Documento PDF
            </h2>
            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50/30'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o PDF ou clique para selecionar'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Apenas PDF • Máximo 10MB</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <FileText className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-800 truncate">{file.name}</p>
                  <p className="text-xs text-green-600 mt-0.5 font-mono truncate">SHA-256: {fileHash.substring(0, 32)}...</p>
                </div>
                <button type="button" onClick={() => { setFile(null); setFileUrl(''); setFileHash('') }}
                  className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Detalhes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Detalhes</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título do documento *</label>
              <input type="text" required className="input-field" value={title}
                onChange={e => setTitle(e.target.value)} placeholder="Ex: Contrato de Locação — João da Silva" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de expiração (opcional)</label>
              <input type="datetime-local" className="input-field" value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>

          {/* Signatários */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Signatários</h2>
              <button type="button" onClick={addSigner}
                className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium">
                <Plus className="w-4 h-4" />
                Adicionar signatário
              </button>
            </div>
            <div className="space-y-4">
              {signers.map((signer, i) => (
                <div key={i} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Signatário {i + 1}</span>
                    {signers.length > 1 && (
                      <button type="button" onClick={() => removeSigner(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                      <input type="text" required className="input-field text-sm py-2" value={signer.name}
                        onChange={e => updateSigner(i, 'name', e.target.value)} placeholder="Nome completo" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                      <input type="email" required className="input-field text-sm py-2" value={signer.email}
                        onChange={e => updateSigner(i, 'email', e.target.value)} placeholder="email@exemplo.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CPF (opcional)</label>
                      <input type="text" className="input-field text-sm py-2" value={signer.cpf}
                        onChange={e => updateSigner(i, 'cpf', e.target.value)} placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Autenticação</label>
                      <select className="input-field text-sm py-2" value={signer.authMethod}
                        onChange={e => updateSigner(i, 'authMethod', e.target.value as never)}>
                        <option value="EMAIL_TOKEN">Token por e-mail</option>
                        <option value="SMS_TOKEN">Token por SMS</option>
                        <option value="WHATSAPP_TOKEN">Token por WhatsApp</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploading || !file}
            className="btn-primary"
          >
            {loading ? 'Enviando para assinatura...' : uploading ? 'Processando arquivo...' : 'Enviar para assinatura →'}
          </button>
        </form>
      </main>
    </div>
  )
}
