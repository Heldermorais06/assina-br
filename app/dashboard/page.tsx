'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  FileText, Plus, LogOut, Clock, CheckCircle2, AlertCircle,
  RefreshCw, Search, ChevronLeft, ChevronRight, Send
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type DocStatus = 'DRAFT' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'

interface Doc {
  id: string
  title: string
  status: DocStatus
  createdAt: string
  signers: { id: string; name: string; email: string; status: string }[]
}

const STATUS_LABELS: Record<DocStatus, string> = {
  DRAFT: 'Rascunho', PENDING: 'Aguardando', PARTIAL: 'Parcial',
  COMPLETED: 'Concluído', CANCELLED: 'Cancelado', EXPIRED: 'Expirado',
}

const STATUS_COLORS: Record<DocStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-yellow-100 text-yellow-700',
  PARTIAL: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-orange-100 text-orange-600',
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return
    loadDocs()
  }, [status, page, statusFilter])

  async function loadDocs() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/documents?${params}`)
    const data = await res.json()
    setDocs(data.documents ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setLoading(false)
  }

  const filtered = search
    ? docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
    : docs

  const stats = {
    total,
    pending: docs.filter(d => d.status === 'PENDING' || d.status === 'PARTIAL').length,
    completed: docs.filter(d => d.status === 'COMPLETED').length,
    expired: docs.filter(d => d.status === 'EXPIRED').length,
  }

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0e0b06] border-b border-[#2a1f0a] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Image src="/logo-helder-morais.png" alt="Helder Morais" width={130} height={48}
            className="object-contain" priority />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              Olá, <strong>{session?.user?.name?.split(' ')[0]}</strong>
            </span>
            <Link
              href="/dashboard/documents/new"
              className="flex items-center gap-2 bg-[#c9a96e] text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-[#b8923d] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo documento
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-9 h-9 rounded-full border border-[#3a2e18] flex items-center justify-center hover:bg-[#1a1208] transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4 text-[#c9a96e]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: total, icon: <FileText className="w-5 h-5 text-blue-700" />, bg: 'bg-blue-50' },
            { label: 'Aguardando', value: stats.pending, icon: <Clock className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-50' },
            { label: 'Concluídos', value: stats.completed, icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, bg: 'bg-green-50' },
            { label: 'Expirados', value: stats.expired, icon: <AlertCircle className="w-5 h-5 text-red-500" />, bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por título..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button onClick={loadDocs} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum documento encontrado</p>
              <p className="text-gray-400 text-sm mt-1">Crie seu primeiro documento para começar</p>
              <Link href="/dashboard/documents/new" className="inline-flex items-center gap-2 mt-4 bg-orange-500 text-white rounded-full px-6 py-2 text-sm font-semibold hover:bg-orange-600 transition-colors">
                <Plus className="w-4 h-4" />
                Novo documento
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Signatários</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Data</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]">{doc.title}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Send className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {doc.signers.filter(s => s.status === 'SIGNED').length}/{doc.signers.length} assinaram
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                          {STATUS_LABELS[doc.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                        {format(new Date(doc.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/dashboard/documents/${doc.id}`} className="text-sm text-orange-500 hover:underline font-medium">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Página {page} de {pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
