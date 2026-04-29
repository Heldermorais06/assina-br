import { describe, it, expect } from 'vitest'
import { hashFile, generateSignToken, generateOTP, validateCPF, formatCPF } from '../lib/crypto'

describe('hashFile', () => {
  it('retorna hash SHA-256 em hexadecimal', async () => {
    const buf = Buffer.from('documento de teste')
    const hash = await hashFile(buf)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('produz o mesmo hash para o mesmo conteúdo', async () => {
    const buf = Buffer.from('conteúdo igual')
    const h1 = await hashFile(buf)
    const h2 = await hashFile(buf)
    expect(h1).toBe(h2)
  })

  it('produz hashes diferentes para conteúdos diferentes', async () => {
    const h1 = await hashFile(Buffer.from('arquivo A'))
    const h2 = await hashFile(Buffer.from('arquivo B'))
    expect(h1).not.toBe(h2)
  })
})

describe('generateSignToken', () => {
  it('gera token com 64 caracteres hexadecimais', () => {
    const token = generateSignToken()
    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it('gera tokens únicos', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSignToken()))
    expect(tokens.size).toBe(100)
  })
})

describe('generateOTP', () => {
  it('gera OTP de 6 dígitos', () => {
    const otp = generateOTP()
    expect(otp).toMatch(/^\d{6}$/)
  })

  it('gera valor entre 100000 e 999999', () => {
    for (let i = 0; i < 50; i++) {
      const n = parseInt(generateOTP())
      expect(n).toBeGreaterThanOrEqual(100000)
      expect(n).toBeLessThanOrEqual(999999)
    }
  })
})

describe('validateCPF', () => {
  it('valida CPF correto', () => {
    expect(validateCPF('529.982.247-25')).toBe(true)
    expect(validateCPF('52998224725')).toBe(true)
  })

  it('rejeita CPF com dígitos repetidos', () => {
    expect(validateCPF('111.111.111-11')).toBe(false)
    expect(validateCPF('000.000.000-00')).toBe(false)
    expect(validateCPF('999.999.999-99')).toBe(false)
  })

  it('rejeita CPF com comprimento errado', () => {
    expect(validateCPF('123.456.789')).toBe(false)
    expect(validateCPF('')).toBe(false)
  })

  it('rejeita CPF inválido', () => {
    expect(validateCPF('123.456.789-00')).toBe(false)
    expect(validateCPF('111.222.333-44')).toBe(false)
  })
})

describe('formatCPF', () => {
  it('formata CPF sem máscara', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25')
  })

  it('formata CPF já com máscara parcial', () => {
    expect(formatCPF('529.982.24725')).toBe('529.982.247-25')
  })
})
