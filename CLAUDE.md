# CLAUDE.md — Assina-BR

Plataforma de assinatura eletrônica com validade jurídica (Lei 14.063/2020 e MP 2.200-2/2001),
desenvolvida para Helder Morais Vieira (CRECI 33.973-J), corretor imobiliário em Brasília/DF.

---

## Stack técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript 5.5 |
| Estilo | Tailwind CSS 3.4 |
| ORM | Prisma 5.17 + PostgreSQL (Neon.tech) |
| Autenticação | NextAuth 4.24 (credentials) |
| E-mail | Resend API |
| PDF | pdf-lib 1.17 + qrcode 1.5 |
| Assinatura canvas | react-signature-canvas |
| Validação | Zod |
| Animações | Framer Motion |
| Testes | Vitest |

---

## Variáveis de ambiente

Configuradas na Vercel (produção). Para desenvolvimento local, criar `.env.local`:

```env
DATABASE_URL="postgresql://user:password@host/assina_br?sslmode=require"
NEXTAUTH_SECRET="string-aleatoria-longa"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Helder Morais"
```

Em produção:
- `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL` = `https://assina-br.vercel.app` (temporário — futuro: `https://assinar.xn--heldermoraisimveis-31b.com.br`)
- `RESEND_API_KEY` = chave real da conta Resend
- Domínio Resend verificado: `xn--heldermoraisimveis-31b.com.br` (região sa-east-1)

---

## Estrutura de pastas

```
assina-br/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   # Handler NextAuth
│   │   │   └── register/route.ts        # Registro de usuário
│   │   ├── documents/
│   │   │   ├── route.ts                 # GET lista / POST cria documento
│   │   │   └── [id]/
│   │   │       ├── route.ts             # GET detalhe / PATCH (cancel, resend, regenerate-pdf)
│   │   │       └── download/route.ts    # GET download PDF assinado (requer auth)
│   │   └── sign/
│   │       └── [token]/
│   │           ├── route.ts             # GET dados do signatário
│   │           ├── authenticate/route.ts # POST envia OTP
│   │           ├── confirm/route.ts      # POST confirma dados + salva signatureImg
│   │           ├── verify-otp/route.ts   # POST valida OTP (max 5 tentativas, bloqueio 30min)
│   │           ├── finalize/route.ts     # POST finaliza assinatura, gera PDF se allSigned
│   │           └── download/route.ts     # GET download PDF (público, por token)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx                     # Lista de documentos com filtros e paginação
│   │   └── documents/
│   │       ├── new/page.tsx             # Upload PDF + cadastro de signatários
│   │       └── [id]/page.tsx            # Detalhe: status, signatários, auditoria, download
│   ├── sign/[token]/
│   │   ├── layout.tsx
│   │   ├── review/page.tsx              # Signatário revisa o documento
│   │   ├── confirm/page.tsx             # Confirma dados pessoais + desenha assinatura
│   │   ├── authenticate/page.tsx        # Insere código OTP recebido por e-mail
│   │   └── complete/page.tsx            # Confirmação + botão de download
│   ├── verificar/
│   │   ├── page.tsx                     # Busca documento por ID
│   │   └── [id]/page.tsx               # Exibe detalhes públicos de autenticidade
│   ├── termos/page.tsx
│   ├── privacidade/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                         # Homepage pública
│   └── providers.tsx
├── components/
│   ├── layout/
│   │   ├── SignLayout.tsx               # Layout das páginas de assinatura (sidebar + conteúdo)
│   │   └── SignatureProgress.tsx        # Sidebar com etapas do fluxo de assinatura
│   └── signature/
│       ├── DrawSignature.tsx            # Canvas de assinatura manuscrita
│       ├── OTPInput.tsx                 # Input de 6 dígitos para OTP
│       └── TypeSignature.tsx            # Assinatura digitada
├── lib/
│   ├── prisma.ts                        # Singleton PrismaClient
│   ├── crypto.ts                        # hashFile (SHA-256), generateSignToken, OTP, CPF utils
│   ├── email.ts                         # sendSignInvite, sendOTPEmail, sendSignedConfirmation
│   ├── pdf.ts                           # embedSignaturesInPDF (adiciona página de assinaturas)
│   └── audit-log.ts                     # createAuditLog, getClientIp, getClientAgent
├── types/
│   ├── index.ts
│   └── next-auth.d.ts
├── middleware.ts                         # Protege /dashboard/* e /api/documents/*
├── prisma/schema.prisma
└── __tests__/
    ├── crypto.test.ts
    └── otp.test.ts
```

---

## Modelos do banco (Prisma)

### User
Proprietários de documentos (administradores da plataforma).
- `id`, `name`, `email` (unique), `cpf`, `phone`, `password` (bcrypt), `createdAt`

### Document
- `id` (cuid), `title`, `fileName`, `fileUrl` (data URL base64 — TODO: migrar para S3), `fileHash` (SHA-256)
- `signedUrl` (data URL base64 do PDF assinado — gerado on-the-fly no download), `signedHash`
- `status`: `DRAFT | PENDING | PARTIAL | COMPLETED | CANCELLED | EXPIRED`
- `expiresAt`, `webhookUrl`
- Relações: `owner` (User), `signers` (Signer[]), `auditLogs` (AuditLog[])

### Signer
- `signToken` (UUID único, usado nas URLs de assinatura)
- `status`: `PENDING | SIGNED | DECLINED`
- `authMethod`: `EMAIL_TOKEN | SMS_TOKEN | WHATSAPP_TOKEN`
- `signatureImg` (data URL base64 da assinatura desenhada)
- `signedAt`, `ipAddress`, `userAgent`, `geolocation`, `order`

### AuthToken
- Tokens OTP de 6 dígitos, expiram em 10 min
- `usedAt` marcado ao usar; bloqueio após 5 tentativas erradas por 30 min

### AuditLog
- Registra todas as ações: `document_created`, `invite_sent`, `otp_verified`, `document_signed`, etc.
- `metadata` (JSON) com detalhes da ação

---

## Fluxo principal de assinatura

```
Proprietário                    Signatário
─────────────                   ──────────
1. Upload PDF
2. Cadastra signatários
3. POST /api/documents
   → envia e-mail de convite
                                4. Recebe e-mail com link /sign/[token]/review
                                5. Revisa o documento (iframe PDF)
                                6. POST /api/sign/[token]/confirm
                                   → salva dados + signatureImg
                                7. POST /api/sign/[token]/authenticate
                                   → envia OTP por e-mail
                                8. POST /api/sign/[token]/verify-otp
                                   → valida código (max 5 tentativas)
                                9. POST /api/sign/[token]/finalize
                                   → marca SIGNED
                                   → se allSigned: gera PDF assinado
                                   → envia e-mail de confirmação
                               10. GET /api/sign/[token]/download
                                   → baixa PDF com página de assinaturas
```

---

## Geração do PDF assinado (lib/pdf.ts)

A função `embedSignaturesInPDF` recebe o PDF original (Uint8Array) e:

1. Adiciona **rodapé** em todas as páginas com hash SHA-256 truncado e URL de verificação
2. Adiciona uma **nova página A4** ao final com:
   - Header azul `#1B3BFF` com título "PÁGINA DE ASSINATURAS ELETRÔNICAS"
   - Hash SHA-256 completo do documento original
   - URL de verificação pública (`/verificar/[id]`)
   - QR code para verificação (80×80px, canto superior direito)
   - Card por signatário com: nome, e-mail, CPF, data/hora UTC, IP, método, imagem da assinatura
3. Retorna `Uint8Array` do PDF gerado

**Atenção:** Usar apenas fontes padrão (`StandardFonts.Helvetica`/`HelveticaBold`) pois só suportam WinAnsi. Não usar caracteres Unicode como `✓` (0x2713) — usar ASCII equivalente (`OK`, `v`, etc.).

---

## Geração e download do PDF

O PDF assinado **não é persistido em storage externo** — é gerado on-the-fly em cada download:

- `GET /api/documents/[id]/download` — requer sessão autenticada (dono do documento)
- `GET /api/sign/[token]/download` — público, acessível pelo token do signatário

Ambos leem o `fileUrl` do banco, decodificam o base64, chamam `embedSignaturesInPDF` e retornam o binário com `Content-Disposition: attachment`.

**TODO:** Migrar `fileUrl` e `signedUrl` de data URLs base64 para storage externo (S3 ou Supabase Storage) para melhor performance e evitar banco inflado.

---

## Autenticação e proteção de rotas

- `middleware.ts` protege `/dashboard/*` e `/api/documents/*` — redireciona para `/login` sem sessão
- Rotas `/api/sign/*` são públicas (autenticadas pelo `signToken`)
- Senha armazenada com `bcryptjs`
- `NEXTAUTH_SECRET` obrigatório em produção

---

## E-mail (lib/email.ts)

Remetente: `Helder Morais <noreply@xn--heldermoraisimveis-31b.com.br>`

Três templates HTML inline:
- `sendSignInvite` — convite para assinar com link e prazo
- `sendOTPEmail` — código de 6 dígitos com expiração de 10 min
- `sendSignedConfirmation` — confirmação pós-assinatura com link de verificação

Domínio verificado no Resend (região São Paulo, sa-east-1) com registros DKIM, SPF e DMARC no Registro.br.

---

## Convenções de código

- **Sem comentários** salvo quando o motivo não for óbvio
- **Sem abstrações prematuras** — implementar apenas o necessário
- **Sem type annotations redundantes** quando inferidas pelo TypeScript
- Validação de entrada com **Zod** apenas nas rotas de API
- `export const dynamic = 'force-dynamic'` em todas as rotas de API
- Datas sempre em **UTC** no banco e na exibição
- IPs extraídos via header `x-forwarded-for` (Vercel)

---

## Deploy e infraestrutura

| Serviço | URL | Observação |
|---------|-----|-----------|
| Vercel | `assina-br.vercel.app` | Deploy automático via push no `main` |
| Neon | — | PostgreSQL serverless, pool com `sslmode=require` |
| Resend | — | E-mail transacional, domínio próprio verificado |
| GitHub | `github.com/Heldermorais06/assina-br` | Repositório principal |

**Domínio futuro:** `assinar.xn--heldermoraisimveis-31b.com.br` (CNAME no Registro.br apontando para Vercel já configurado). Quando ativado, atualizar `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL` na Vercel.

---

## Pendências conhecidas (TODO)

1. **Storage externo** — `fileUrl` e `signedUrl` são data URLs base64 no banco. Migrar para Vercel Blob ou S3 para documentos grandes
2. **Domínio próprio** — ativar `assinar.heldermoraisimóveis.com.br` na Vercel e atualizar variáveis de ambiente
3. **SMS/WhatsApp OTP** — `authMethod` suporta `SMS_TOKEN` e `WHATSAPP_TOKEN` mas apenas `EMAIL_TOKEN` está implementado
4. **Múltiplos signatários sequenciais** — campo `order` existe no modelo mas a lógica de bloqueio sequencial não está implementada
5. **Expiração de documentos** — campo `expiresAt` existe mas não há job que marque documentos como `EXPIRED` automaticamente
6. **Página nova se muitos signatários** — `embedSignaturesInPDF` tem `break` quando `y < 120` mas não adiciona nova página automaticamente
