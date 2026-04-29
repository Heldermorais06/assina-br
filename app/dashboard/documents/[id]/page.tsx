'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Download, Send, XCircle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, FileText, Shield, User, Copy, Check
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type DocStatus = 'DRAFT' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
type SignStatus = 'PENDING' | 'SIGNED' | 'DECLINED'

interface Signer {
  id: string
  name: string
  email: string
  cpf: string | null
  signToken: string
  status: SignStatus
  signedAt: string | null
  ipAddress: string | null
  authMethod: string
  order: number
}

interface AuditLog {
  id: string
  action: string
  actorEmail: string
  actorIp: string
  actorAgent: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

interface Document {
  id: string
  title: string
  fileName: string
  fileUrl: string
  fileHash: string
  signedUrl: string | null
  signedHash: string | null
  status: DocStatus
  createdAt: string
  expiresAt: string | null
  signers: Signer[]
  auditLogs: AuditLog[]
  owner: { name: string; email: string }
}

const STATUS_LABELS: Record<DocStatus, string> = {
  DRAFT: 'Rascunho', PENDING: 'Aguardando', PARTIAL: 'Parcial',
  COMPLETED: 'Concluído', CANCELLED: 'Cancelado', EXPIRED: 'Expirado',
}

const STATUS_COLORS: Record<DocStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', PENDING: 'bg-yellow-100 text-yellow-700',
  PARTIAL: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600', EXPIRED: 'bg-orange-100 text-orange-600',
}

const ACTION_LABELS: Record<string, string> = {
  document_created: 'Documento criado',
  invite_sent: 'Convite enviado',
  invite_resent: 'Convite reenviado',
  signer_confirmed_data: 'Dados confirmados pelo signatário',
  otp_sent: 'Código de autenticação enviado',
  otp_verified: 'Código de autenticação verificado',
  document_signed: 'Documento assinado',
  document_completed: 'Documento concluído (todas assinaturas)',
  document_cancelled: 'Documento cancelado',
}

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [auditOpen, setAuditOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [resending, setResending] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  function copyLink(token: string) {
    const url = `${window.location.origin}/sign/${token}/review`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  useEffect(() => {
    fetch(`/api/documents/${params.id}`)
      .then(r => r.json())
      .then(data => { setDoc(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  async function handleCancel() {
    if (!confirm('Tem certeza que deseja cancelar este documento?')) return
    setCancelling(true)
    await fetch(`/api/documents/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    setCancelling(false)
    router.refresh()
    window.location.reload()
  }

  async function handleResend(signerId: string) {
    setResending(signerId)
    await fetch(`/api/documents/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend', signerId }),
    })
    setResending(null)
    alert('Convite reenviado com sucesso!')
  }

  async function handleRegeneratePdf() {
    setRegenerating(true)
    await fetch(`/api/documents/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'regenerate-pdf' }),
    })
    setRegenerating(false)
    window.location.reload()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!doc) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-gray-500">Documento não encontrado.</p>
        <Link href="/dashboard" className="text-orange-500 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    </div>
  )

  const signedCount = doc.signers.filter(s => s.status === 'SIGNED').length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0e0b06] border-b border-[#2a1f0a]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 relative w-full">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-[#c9a96e] hover:text-[#e0b97a] text-sm font-medium absolute left-0">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <div className="flex-1 flex justify-center">
              <Image src="/logo-helder-morais.png" alt="Helder Morais" width={120} height={46} className="object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 truncate max-w-[300px]">{doc.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                  {STATUS_LABELS[doc.status]}
                </span>
                <span className="text-xs text-gray-400">{signedCount}/{doc.signers.length} assinaturas</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {doc.status === 'COMPLETED' && doc.signedUrl && (
              <a href={`/api/documents/${params.id}/download`}
                className="flex items-center gap-1.5 bg-orange-500 text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-orange-600 transition-colors">
                <Download className="w-4 h-4" />
                Baixar assinado
              </a>
            )}
            {doc.status === 'COMPLETED' && !doc.signedUrl && (
              <button onClick={handleRegeneratePdf} disabled={regenerating}
                className="flex items-center gap-1.5 bg-orange-500 text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60">
                <Download className="w-4 h-4" />
                {regenerating ? 'Gerando...' : 'Gerar PDF assinado'}
              </button>
            )}
            {!['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(doc.status) && (
              <button onClick={handleCancel} disabled={cancelling}
                className="flex items-center gap-1.5 border border-red-200 text-red-500 rounded-full px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors">
                <XCircle className="w-4 h-4" />
                {cancelling ? 'Cancelando...' : 'Cancelar'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualizador */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{doc.fileName}</span>
            </div>
            <div className="h-[500px]">
              <iframe src={doc.fileUrl} className="w-full h-full" title="Documento" />
            </div>
          </div>

          {/* Hash */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-700" />
              <h3 className="font-semibold text-gray-900">Integridade do documento</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">SHA-256 original</span>
                <p className="font-mono text-xs text-gray-700 break-all mt-0.5">{doc.fileHash}</p>
              </div>
              {doc.signedHash && (
                <div>
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">SHA-256 assinado</span>
                  <p className="font-mono text-xs text-gray-700 break-all mt-0.5">{doc.signedHash}</p>
                </div>
              )}
              <Link href={`/verificar/${doc.id}`} className="text-orange-500 hover:underline text-xs">
                Verificar autenticidade →
              </Link>
            </div>
          </div>

          {/* Trilha de auditoria */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setAuditOpen(v => !v)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Trilha de auditoria
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{doc.auditLogs.length}</span>
              </h3>
              {auditOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {auditOpen && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-100">
                {doc.auditLogs.map(log => (
                  <div key={log.id} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {log.actorEmail} · {log.actorIp}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })} UTC
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar signatários */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              Signatários
            </h3>
            <div className="space-y-4">
              {doc.signers.map(signer => (
                <div key={signer.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{signer.name}</p>
                      <p className="text-xs text-gray-500 truncate">{signer.email}</p>
                      {signer.cpf && <p className="text-xs text-gray-400">CPF: {signer.cpf}</p>}
                    </div>
                    <div>
                      {signer.status === 'SIGNED' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  {signer.signedAt && (
                    <p className="text-xs text-green-600 mt-1.5">
                      Assinado em {format(new Date(signer.signedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  )}
                  {signer.ipAddress && (
                    <p className="text-xs text-gray-400 mt-0.5">IP: {signer.ipAddress}</p>
                  )}
                  {signer.status === 'PENDING' && !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(doc.status) && (
                    <div className="mt-2 space-y-1.5">
                      <button
                        onClick={() => copyLink(signer.signToken)}
                        className="w-full flex items-center justify-center gap-1.5 bg-[#1a1208] text-[#c9a96e] rounded-lg px-3 py-2 text-xs font-semibold hover:bg-[#2a1f0a] transition-colors"
                      >
                        {copied === signer.signToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === signer.signToken ? 'Link copiado!' : 'Copiar link de assinatura'}
                      </button>
                      <button
                        onClick={() => handleResend(signer.id)}
                        disabled={resending === signer.id}
                        className="w-full flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        {resending === signer.id ? 'Reenviando...' : 'Reenviar por e-mail'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metadados */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm space-y-2">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">Informações</p>
            <div className="flex justify-between">
              <span className="text-gray-500">Criado em</span>
              <span className="text-gray-900 font-medium">
                {format(new Date(doc.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
            {doc.expiresAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Expira em</span>
                <span className="text-gray-900 font-medium">
                  {format(new Date(doc.expiresAt), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Proprietário</span>
              <span className="text-gray-900 font-medium">{doc.owner.name}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
