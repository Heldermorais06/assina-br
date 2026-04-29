'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', cpf: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, cpf: form.cpf, phone: form.phone, password: form.password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) setError(data.error ?? 'Erro ao criar conta.')
    else router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#0e0b06] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo-helder-morais.png" alt="Helder Morais" width={180} height={68}
            className="object-contain mx-auto mb-6" priority />
          <h1 className="text-xl font-semibold text-white">Criar conta</h1>
          <p className="text-gray-400 text-sm mt-1">Plataforma de assinatura eletrônica</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && <div className="alert-error mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input type="text" required className="input-field" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="João da Silva" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" required className="input-field" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="joao@email.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input type="text" className="input-field" value={form.cpf}
                  onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="tel" className="input-field" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(61) 9 0000-0000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input type="password" required minLength={8} className="input-field" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
              <input type="password" required className="input-field" value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repita a senha" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#1a1208] text-white rounded-full py-3 font-semibold hover:bg-[#2a1f0a] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-[#c9a96e] hover:underline font-medium">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
