import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Termos de Uso</h1>
          <div className="prose prose-sm text-gray-600 space-y-4">
            <p>
              Ao utilizar a plataforma de assinatura eletrônica da <strong>Helder Morais Negócios Imobiliários</strong>,
              você concorda com os presentes Termos de Uso e com a nossa Política de Privacidade. Esta plataforma
              oferece serviços de assinatura eletrônica em conformidade com a <strong>Lei 14.063/2020</strong> e
              a <strong>MP 2.200-2/2001</strong>.
            </p>
            <h2 className="text-lg font-semibold text-gray-800 mt-6">1. Validade Jurídica</h2>
            <p>
              As assinaturas eletrônicas realizadas nesta plataforma são classificadas como
              <strong> assinaturas eletrônicas avançadas</strong>, conforme o Art. 4º, II da Lei 14.063/2020.
              A autenticidade é garantida pela identificação do signatário (e-mail e CPF) e pela autenticação
              por código OTP enviado ao e-mail cadastrado.
            </p>
            <h2 className="text-lg font-semibold text-gray-800 mt-6">2. Responsabilidades do Usuário</h2>
            <p>
              O usuário é responsável pela veracidade das informações fornecidas, pela guarda de suas credenciais
              de acesso e pela autorização dos documentos enviados para assinatura.
            </p>
            <h2 className="text-lg font-semibold text-gray-800 mt-6">3. Consentimento para Assinatura</h2>
            <p>
              Ao clicar em "Finalizar assinatura", o signatário manifesta sua concordância livre e inequívoca
              com o conteúdo do documento, tendo plena ciência de que a assinatura eletrônica possui validade
              jurídica equivalente à assinatura manuscrita.
            </p>
            <h2 className="text-lg font-semibold text-gray-800 mt-6">4. Trilha de Auditoria</h2>
            <p>
              Todas as ações realizadas na plataforma são registradas em trilha de auditoria imutável, incluindo
              data/hora UTC, endereço IP, dispositivo e método de autenticação, em conformidade com os requisitos
              probatórios aplicáveis.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
