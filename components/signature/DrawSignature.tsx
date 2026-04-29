'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Trash2 } from 'lucide-react'

interface Props {
  onCapture: (dataUrl: string) => void
}

export function DrawSignature({ onCapture }: Props) {
  const canvasRef = useRef<SignatureCanvas>(null)
  const [empty, setEmpty] = useState(true)

  function handleEnd() {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      setEmpty(false)
      onCapture(canvasRef.current.toDataURL('image/png'))
    }
  }

  function handleClear() {
    canvasRef.current?.clear()
    setEmpty(true)
  }

  return (
    <div>
      <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 relative">
        <SignatureCanvas
          ref={canvasRef}
          penColor="#1a1a2e"
          canvasProps={{ width: 460, height: 160, className: 'w-full touch-none' }}
          onEnd={handleEnd}
        />
        {empty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Assine aqui com o mouse ou dedo</p>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="h-0.5 flex-1 bg-gray-300 mx-2" />
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpar
        </button>
      </div>
    </div>
  )
}
