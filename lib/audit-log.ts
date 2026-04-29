import { prisma } from './prisma'

interface LogParams {
  documentId: string
  action: string
  actorEmail: string
  actorIp: string
  actorAgent: string
  metadata?: Record<string, unknown>
}

export async function createAuditLog(params: LogParams) {
  return prisma.auditLog.create({
    data: {
      documentId: params.documentId,
      action: params.action,
      actorEmail: params.actorEmail,
      actorIp: params.actorIp,
      actorAgent: params.actorAgent,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  })
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

export function getClientAgent(req: Request): string {
  return req.headers.get('user-agent') ?? 'unknown'
}
