export type DocStatus = 'DRAFT' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
export type SignStatus = 'PENDING' | 'SIGNED' | 'DECLINED'
export type AuthMethod = 'EMAIL_TOKEN' | 'SMS_TOKEN' | 'WHATSAPP_TOKEN' | 'SELFIE' | 'PIX'

export interface DocumentWithSigners {
  id: string
  title: string
  fileName: string
  fileUrl: string
  fileHash: string
  signedUrl: string | null
  signedHash: string | null
  status: DocStatus
  ownerId: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date | null
  signers: SignerWithAuth[]
  auditLogs?: AuditLogEntry[]
  owner?: { name: string; email: string }
}

export interface SignerWithAuth {
  id: string
  documentId: string
  name: string
  email: string
  cpf: string | null
  signToken: string
  signedAt: Date | null
  ipAddress: string | null
  userAgent: string | null
  signatureImg: string | null
  authMethod: AuthMethod
  status: SignStatus
  order: number
  createdAt: Date
}

export interface AuditLogEntry {
  id: string
  documentId: string
  action: string
  actorEmail: string
  actorIp: string
  actorAgent: string
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface SignatureStep {
  id: string
  label: string
  sublabel: string
  status: 'pending' | 'active' | 'completed'
}

export interface OTPResult {
  success: boolean
  error?: string
  attemptsRemaining?: number
}
