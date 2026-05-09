import { NextResponse } from 'next/server'
import { getAdminFromRequest, hashPassword, verifyPassword } from '@/lib/auth'
import { db } from '@/lib/db'

// POST - Authenticated: Change admin password
export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Contraseña actual y nueva son requeridas' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    const adminFull = await db.adminUser.findUnique({ where: { id: admin.id } })
    if (!adminFull) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const valid = await verifyPassword(currentPassword, adminFull.password)
    if (!valid) {
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(newPassword)
    await db.adminUser.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente' })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
