import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Política de Privacidade</h1>
          <div className="prose prose-sm text-gray-600 space-y-4">
            <p>
              A <strong>Helder Morais Negócios Imobiliários</strong> respeita sua privacidade e trata os dados
              pessoais em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>.
            </p>
            <h2 className="text-lg font-semibold text-gray-800 mt-6">1. Dados Coletados</h2>
            <p>Coletamos: nome completo, e-mail, CPF (opcional), endereço IP, data/hora de acesso,
              dados do dispositivo (User-Agent) e assinatura eletrônica (imagem).</p>
            <h2 className="text-lg font-semibold text-gray-800 mt-6">2. Finalidade do Tratamento</h2>
            <p>Os dados são utilizados exclusivamente para: autenticação do usuário, execução do contrato
              de assinatura eletrônica, cumprimento de obrigações legais e formação de prova em caso de litígio.</p>
            <h2 className="text-lg font-semibold text-gray-800 mt-6">3. Base Legal</h2>
            <p>O tratamento é fundamentado no <strong>Art. 7º, V (execução de contrato)</strong> e
              <strong> Art. 7º, VI (exercício regular de direitos em processos)</strong> da LGPD.</p>
            <h2 className="text-lg font-semibold text-gray-800 mt-6">4. Seus Direitos</h2>
            <p>Você tem direito a: confirmação da existência de tratamento, acesso aos dados, correção,
              anonimização, portabilidade e eliminação dos dados. Para exercer seus direitos, entre em contato
              através do e-mail <strong>helderdemoraisvieira@gmail.com</strong>.</p>
            <h2 className="text-lg font-semibold text-gray-800 mt-6">5. Retenção de Dados</h2>
            <p>Os dados de assinatura são retidos pelo prazo mínimo de <strong>5 anos</strong> após a
              conclusão do documento, em conformidade com o prazo prescricional civil aplicável.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
