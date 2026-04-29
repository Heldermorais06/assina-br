import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Helder Morais — Assinatura Eletrônica',
  description: 'Plataforma de assinatura eletrônica com validade jurídica — Helder Morais Negócios Imobiliários',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </Providers>
      </body>
    </html>
  )
}
