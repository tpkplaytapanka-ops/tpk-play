import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminFromRequest, hashPassword, verifyPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual es requerida').max(128),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La nueva contraseña debe tener al menos una mayúscula, una minúscula y un número'
    ),
})

// POST - Authenticated: Change admin password
export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const result = changePasswordSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = result.data

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

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    await logAudit({ adminId: admin.id, action: 'change_password', ipAddress: ip })

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente' })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
