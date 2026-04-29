'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  name: string
  onCapture: (dataUrl: string) => void
}

export function TypeSignature({ name, onCapture }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [text, setText] = useState(name)

  useEffect(() => {
    renderToCanvas(text)
  }, [text])

  function renderToCanvas(value: string) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = '44px "Dancing Script", cursive'
    ctx.fillStyle = '#1a1a2e'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(value, canvas.width / 2, canvas.height / 2)
    onCapture(canvas.toDataURL('image/png'))
  }

  return (
    <div>
      <input
        type="text"
        className="input-field mb-3 font-cursive text-lg"
        style={{ fontFamily: '"Dancing Script", cursive' }}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Digite seu nome"
      />
      <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={460}
          height={140}
          className="w-full"
          style={{ fontFamily: '"Dancing Script", cursive' }}
        />
      </div>
    </div>
  )
}
