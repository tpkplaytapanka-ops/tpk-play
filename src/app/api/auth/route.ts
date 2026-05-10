import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

const loginSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(1, 'Contraseña es requerida').max(128),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { email, password } = result.data
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const admin = await db.adminUser.findUnique({ where: { email } })
    if (!admin) {
      await logAudit({ action: 'login_failed', details: { email }, ipAddress: ip })
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const valid = await verifyPassword(password, admin.password)
    if (!valid) {
      await logAudit({ adminId: admin.id, action: 'login_failed', ipAddress: ip })
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const token = generateToken({ id: admin.id, email: admin.email })
    await logAudit({ adminId: admin.id, action: 'login', ipAddress: ip })

    return NextResponse.json({
      token,
      user: { id: admin.id, email: admin.email, name: admin.name },
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
