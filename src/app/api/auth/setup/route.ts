import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken, ensureDefaultBroadcastConfigs } from '@/lib/auth'

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
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

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
