'use client'

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  length?: number
  disabled?: boolean
}

export function OTPInput({ value, onChange, length = 6, disabled }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  function handleChange(index: number, char: string) {
    if (!/^\d*$/.test(char)) return
    const newDigits = [...digits]
    newDigits[index] = char.slice(-1)
    onChange(newDigits.join(''))
    if (char && index < length - 1) {
      inputs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted.padEnd(length, '').slice(0, length))
    const nextIdx = Math.min(pasted.length, length - 1)
    inputs.current[nextIdx]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          disabled={disabled}
          value={digits[i] ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-11 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all disabled:bg-gray-50 disabled:text-gray-400"
        />
      ))}
    </div>
  )
}
