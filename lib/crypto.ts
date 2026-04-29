import { createHash, randomBytes } from 'crypto'

export async function hashFile(buffer: Buffer): Promise<string> {
  return createHash('sha256').update(buffer).digest('hex')
}

export function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function generateSignToken(): string {
  return randomBytes(32).toString('hex')
}

export function generateOTP(): string {
  const digits = randomBytes(4).readUInt32BE(0) % 900000 + 100000
  return digits.toString()
}

export function generateVerificationUUID(): string {
  return randomBytes(16).toString('hex')
}

export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(clean[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(clean[10])
}

export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '')
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
