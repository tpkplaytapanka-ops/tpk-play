import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, generateToken, ensureDefaultBroadcastConfigs } from '@/lib/auth'

const setupSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muy largo'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es muy larga')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe tener al menos una mayúscula, una minúscula y un número'
    ),
  confirmPassword: z.string(),
  name: z.string().max(100, 'Nombre muy largo').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export async function POST(request: Request) {
  try {
    // Only allow setup if no admin exists yet
    const adminCount = await db.adminUser.count()
    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Ya existe un administrador. Use el inicio de sesión.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = setupSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { email, password, name } = result.data

    const hashedPassword = await hashPassword(password)
    const admin = await db.adminUser.create({
      data: { email, password: hashedPassword, name: name || 'Admin' },
    })

    // Seed default broadcast configs
    await ensureDefaultBroadcastConfigs()

    const token = generateToken({ id: admin.id, email: admin.email })

    return NextResponse.json({
      token,
      user: { id: admin.id, email: admin.email, name: admin.name },
      message: 'Administrador creado exitosamente',
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
