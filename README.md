# AssinarBR — Assinatura Eletrônica com Validade Jurídica

Plataforma de assinatura eletrônica em conformidade com a Lei 14.063/2020 e MP 2.200-2/2001.

## Stack

- **Next.js 14** (App Router)
- **TypeScript 5**
- **Tailwind CSS 3**
- **Prisma ORM** + **PostgreSQL**
- **NextAuth.js** (autenticação por credenciais)
- **pdf-lib** (geração de PDF assinado)
- **Resend** (envio de e-mails transacionais)
- **Vitest** (testes unitários)

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/assina_br"
NEXTAUTH_SECRET="gere-um-secret-longo-aqui"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_sua_chave_aqui"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="AssinarBR"
```

### 3. Banco de dados

```bash
npx prisma generate
npx prisma db push   # para desenvolvimento rápido
# ou
npx prisma migrate dev --name init   # para produção
```

### 4. Iniciar em desenvolvimento

```bash
npm run dev
```

Acesse em http://localhost:3000

### 5. Rodar testes

```bash
npm test
```

## Arquitetura de segurança

| Camada | Implementação |
|--------|--------------|
| Hash do documento | SHA-256 calculado no cliente (Web Crypto API) e verificado no servidor |
| Token de acesso | 64 bytes aleatórios (crypto.randomBytes) |
| OTP | 6 dígitos, expira em 10 min, máx. 5 tentativas |
| Rate limiting | Bloqueio de 30 min após 5 tentativas inválidas |
| Audit log | Imutável — IP, User-Agent, timestamp UTC, hash |
| PDF assinado | Página de assinaturas + rodapé em todas as páginas + QR Code de verificação |
| Headers HTTP | CSP, X-Frame-Options, HSTS, X-Content-Type-Options |

## Conformidade legal

- **Lei 14.063/2020** — Assinatura Eletrônica Avançada (Art. 4º, II)
- **MP 2.200-2/2001** — Validade de documentos eletrônicos
- **LGPD (Lei 13.709/2018)** — Consentimento registrado, política de privacidade, direito ao apagamento
- **Validade probatória** — Trilha de auditoria imutável com dados suficientes para produção de prova em juízo

## Fluxo de assinatura

```
Proprietário cria documento (PDF + signatários)
        ↓
Sistema gera token único por signatário e envia e-mail
        ↓
Signatário acessa /sign/[token]/review  → lê o documento
        ↓
/sign/[token]/confirm  → confirma dados + assinatura (desenha/digita)
        ↓
/sign/[token]/authenticate  → recebe OTP por e-mail e valida
        ↓
/sign/[token]/complete  → assinatura concluída
        ↓
(Quando todos assinarem) → gera PDF final com estampa de assinatura
        ↓
Verificação pública em /verificar/[documentId]
```

## Produção

Para produção, substitua o armazenamento de PDFs por S3 ou Supabase Storage:

1. Fazer upload do PDF para o storage em `app/dashboard/documents/new/page.tsx`
2. Salvar a URL pública assinada em `fileUrl`
3. Salvar o PDF assinado no storage em `app/api/sign/[token]/finalize/route.ts`
4. Usar Redis para rate limiting de OTP (em vez do Map em memória)
