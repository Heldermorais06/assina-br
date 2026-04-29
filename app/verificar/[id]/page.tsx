import { prisma } from '@/lib/prisma'
import { hashFile } from '@/lib/crypto'
import Image from 'next/image'
import { Shield, CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function verifyDocument(id: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      signers: { orderBy: { order: 'asc' } },
      owner: { select: { name: true } },
    },
  })
  if (!doc) return null

  let integrityOk = false
  try {
    if (doc.signedUrl && !doc.signedUrl.startsWith('data:')) {
      const res = await fetch(doc.signedUrl)
      const buf = Buffer.from(await res.arrayBuffer())
      const hash = await hashFile(buf)
      integrityOk = hash === doc.signedHash
    } else {
      integrityOk = doc.status === 'COMPLETED' && !!doc.signedHash
    }
  } catch {
    integrityOk = false
  }

  return { doc, integrityOk }
}

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const result = await verifyDocument(params.id)

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Documento não encontrado</h1>
          <p className="text-gray-500 text-sm">O código de verificação informado não corresponde a nenhum documento.</p>
          <Link href="/" className="mt-4 inline-block text-orange-500 hover:underline">Voltar ao início</Link>
        </div>
      </div>
    )
  }

  const { doc, integrityOk } = result
  const isComplete = doc.status === 'COMPLETED'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0e0b06] border-b border-[#2a1f0a]">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
          <Image src="/logo-helder-morais.png" alt="Helder Morais" width={130} height={48} className="object-contain" />
          <span className="text-[#c9a96e]/60 text-sm">— Verificação de documento</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Status card */}
        <div className={`rounded-2xl p-6 ${isComplete && integrityOk ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isComplete && integrityOk ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {isComplete && integrityOk ? (
                <Shield className="w-7 h-7 text-green-600" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-yellow-600" />
              )}
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isComplete && integrityOk ? 'text-green-800' : 'text-yellow-800'}`}>
                {isComplete && integrityOk
                  ? 'Documento autêntico e íntegro'
                  : isComplete
                  ? 'Documento concluído (integridade não verificável online)'
                  : 'Documento ainda não concluído'}
              </h1>
              <p className={`text-sm mt-1 ${isComplete && integrityOk ? 'text-green-700' : 'text-yellow-700'}`}>
                {isComplete && integrityOk
                  ? 'Todas as assinaturas foram validadas. O hash SHA-256 confirma que o documento não foi alterado.'
                  : isComplete
                  ? 'Todas as assinaturas foram registradas. Verifique o hash SHA-256 manualmente.'
                  : 'Este documento ainda possui assinaturas pendentes.'}
              </p>
            </div>
          </div>
        </div>

        {/* Documento */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Documento</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Título</span>
              <span className="font-medium text-gray-900">{doc.title}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Proprietário</span>
              <span className="font-medium text-gray-900">{doc.owner.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Criado em</span>
              <span className="font-medium text-gray-900">
                {format(new Date(doc.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} UTC
              </span>
            </div>
            <div className="py-2 border-b border-gray-50">
              <p className="text-gray-500 mb-1">SHA-256 original</p>
              <p className="font-mono text-xs text-gray-700 break-all">{doc.fileHash}</p>
            </div>
            {doc.signedHash && (
              <div className="py-2">
                <p className="text-gray-500 mb-1">SHA-256 documento assinado</p>
                <p className="font-mono text-xs text-gray-700 break-all">{doc.signedHash}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signatários */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Signatários ({doc.signers.filter(s => s.status === 'SIGNED').length}/{doc.signers.length})
          </h2>
          <div className="space-y-3">
            {doc.signers.map(signer => (
              <div key={signer.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                {signer.status === 'SIGNED' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{signer.name}</p>
                  <p className="text-xs text-gray-500">{signer.email}</p>
                  {signer.cpf && <p className="text-xs text-gray-400">CPF: {signer.cpf}</p>}
                  {signer.signedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Assinado em {format(new Date(signer.signedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })} UTC
                    </p>
                  )}
                  {signer.ipAddress && signer.status === 'SIGNED' && (
                    <p className="text-xs text-gray-400">IP: {signer.ipAddress} · Método: {signer.authMethod}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Base legal */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Base legal:</strong> Este documento eletrônico possui validade jurídica conforme a{' '}
            <strong>Lei 14.063/2020</strong> (assinatura eletrônica avançada) e a <strong>MP 2.200-2/2001</strong>.
            A autenticidade é garantida pelo hash SHA-256, pela identificação do signatário (e-mail + CPF) e pela
            autenticação por token OTP. A trilha de auditoria é imutável e pode ser utilizada como prova em processos judiciais.
            Documento emitido pela plataforma <strong>Helder Morais Negócios Imobiliários</strong>.
          </p>
        </div>
      </main>
    </div>
  )
}
