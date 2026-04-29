import Link from 'next/link'
import Image from 'next/image'
import { Shield, FileCheck, Clock, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Image
            src="/logo-helder-morais.png"
            alt="Helder Morais"
            width={140}
            height={52}
            className="object-contain"
            priority
          />
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-5 py-2">Entrar</Link>
            <Link href="/register" className="bg-[#c9a96e] text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-[#b8923d] transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 rounded-full px-4 py-2 text-sm font-medium mb-6 border border-amber-200">
            <Shield className="w-4 h-4" />
            Conformidade com Lei 14.063/2020 e MP 2.200-2/2001
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Helder Morais<br />
            <span className="text-[#c9a96e]">Assinatura Eletrônica</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Assine contratos imobiliários com segurança, autenticidade e validade legal no Brasil.
            Trilha de auditoria completa e verificação pública de integridade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="bg-[#1a1208] text-white rounded-full px-10 py-4 font-semibold hover:bg-[#2a1f0a] transition-colors text-lg">
              Acessar plataforma
            </Link>
            <Link href="/verificar" className="border border-gray-300 text-gray-700 rounded-full px-10 py-4 font-medium hover:bg-gray-50 transition-colors text-lg">
              Verificar documento
            </Link>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8 text-[#c9a96e]" />,
                title: 'Validade Jurídica',
                desc: 'Assinatura eletrônica avançada com identificação por e-mail, CPF e código OTP. Hash SHA-256 garante integridade do documento.',
              },
              {
                icon: <Clock className="w-8 h-8 text-[#c9a96e]" />,
                title: 'Trilha de Auditoria',
                desc: 'Registro imutável de cada ação: IP, data/hora UTC, dispositivo e método de autenticação — válido como prova em juízo.',
              },
              {
                icon: <Users className="w-8 h-8 text-[#c9a96e]" />,
                title: 'Múltiplos Signatários',
                desc: 'Envie para compradores, vendedores e fiadores com ordem definida. Cada um recebe link único por e-mail.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo-helder-morais.png" alt="Helder Morais" width={100} height={38} className="object-contain opacity-60" />
            <p className="text-sm text-gray-400">© 2025 Helder Morais. Todos os direitos reservados.</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/termos" className="hover:text-gray-700 transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-gray-700 transition-colors">Política de Privacidade</Link>
            <Link href="/verificar" className="hover:text-gray-700 transition-colors">Verificar documento</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
