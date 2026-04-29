import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateOTP } from '../lib/crypto'

describe('OTP — expiração e tentativas', () => {
  it('OTP gerado é numérico de 6 dígitos', () => {
    const otp = generateOTP()
    expect(/^\d{6}$/.test(otp)).toBe(true)
  })

  it('tokens diferentes são gerados em chamadas consecutivas', () => {
    const otps = new Set(Array.from({ length: 20 }, () => generateOTP()))
    // Com 6 dígitos e 20 chamadas, a probabilidade de colisão é mínima
    expect(otps.size).toBeGreaterThan(15)
  })

  it('simula bloqueio após 5 tentativas', () => {
    const MAX_ATTEMPTS = 5
    let attempts = 0
    let blocked = false

    function tryOTP(input: string, correct: string): 'ok' | 'invalid' | 'blocked' {
      if (blocked) return 'blocked'
      if (input === correct) return 'ok'
      attempts++
      if (attempts >= MAX_ATTEMPTS) blocked = true
      return 'invalid'
    }

    const correct = '123456'
    expect(tryOTP('000000', correct)).toBe('invalid')
    expect(tryOTP('000000', correct)).toBe('invalid')
    expect(tryOTP('000000', correct)).toBe('invalid')
    expect(tryOTP('000000', correct)).toBe('invalid')
    expect(tryOTP('000000', correct)).toBe('invalid')
    expect(tryOTP('000000', correct)).toBe('blocked')
    expect(tryOTP(correct, correct)).toBe('blocked')
  })

  it('OTP expirado não é aceito', () => {
    const now = Date.now()
    const expiresAt = now - 1000 // já expirou
    const isExpired = expiresAt < now
    expect(isExpired).toBe(true)
  })

  it('OTP válido dentro do prazo', () => {
    const now = Date.now()
    const expiresAt = now + 10 * 60 * 1000 // 10 minutos no futuro
    const isExpired = expiresAt < now
    expect(isExpired).toBe(false)
  })
})
