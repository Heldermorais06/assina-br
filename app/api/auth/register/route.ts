export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validateCPF } from '@/lib/crypto'

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8).max(72),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    if (data.cpf) {
      const cleanCpf = data.cpf.replace(/\D/g, '')
      if (!validateCPF(cleanCpf)) {
        return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
      }
      data.cpf = cleanCpf
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 })
    }

    const hashed = await hash(data.password, 12)
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        cpf: data.cpf ?? null,
        phone: data.phone ?? null,
        password: hashed,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
