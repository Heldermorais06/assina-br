'use client'

import { CheckCircle, Circle } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import Image from 'next/image'

interface Step {
  id: string
  label: string
  sublabel: string
  status: 'pending' | 'active' | 'completed'
}

interface Props {
  steps: Step[]
  companyName?: string
}

export function SignatureProgress({ steps, companyName = 'AssinarBR' }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={clsx(
        'flex-shrink-0 bg-[#FFF0EB] flex flex-col transition-all duration-300 min-h-screen',
        collapsed ? 'w-14' : 'w-[270px]'
      )}
    >
      {/* Header com logo */}
      <div className="bg-[#1a1208] px-4 py-4 flex items-center justify-between">
        {!collapsed && (
          <div className="flex-1 flex justify-center">
            <Image
              src="/logo-helder-morais.png"
              alt="Helder Morais"
              width={150}
              height={56}
              className="object-contain"
              priority
            />
          </div>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="text-[#c9a96e]/70 hover:text-[#c9a96e] text-xs font-medium whitespace-nowrap"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Etapas */}
      {!collapsed && (
        <div className="flex-1 py-6 px-4">
          <div className="relative">
            {/* Linha vertical conectando etapas */}
            <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-orange-200 z-0" />

            <div className="space-y-6 relative z-10">
              {steps.map((step, i) => (
                <div key={step.id} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-8 h-8 text-green-500 bg-white rounded-full" />
                    ) : step.status === 'active' ? (
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
                        <div className="w-3 h-3 bg-white rounded-full" />
                      </div>
                    ) : (
                      <Circle className="w-8 h-8 text-gray-300 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="pt-1">
                    <p
                      className={clsx(
                        'font-semibold text-sm leading-tight',
                        step.status === 'active' ? 'text-orange-600' :
                        step.status === 'completed' ? 'text-green-700' : 'text-gray-400'
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{step.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Badge seguro */}
      {!collapsed && (
        <div className="px-4 pb-5">
          <div className="bg-white/60 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-green-600 text-sm">🔒</span>
            <span className="text-xs text-gray-500 font-medium">Ambiente seguro</span>
          </div>
        </div>
      )}
    </aside>
  )
}
