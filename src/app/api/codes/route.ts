import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

// GET - Authenticated: Get all raffle codes
export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const codes = await db.raffleCode.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(codes)
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener códigos' },
      { status: 500 }
    )
  }
}

// POST - Authenticated: Create raffle code(s)
export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { code, prize, expiresAt, count } = body

    // Bulk create with generated codes
    if (count && !code) {
      const numCodes = Math.min(Math.max(Number(count), 1), 100)
      const codes = []

      for (let i = 0; i < numCodes; i++) {
        const generatedCode = generateRandomCode()
        codes.push({
          code: generatedCode,
          prize: prize || 'Premio sorpresa',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        })
      }

      const created = await db.raffleCode.createMany({ data: codes })
      return NextResponse.json({ created: created.count, codes: codes.map(c => c.code) })
    }

    // Single code creation
    if (!code || !prize) {
      return NextResponse.json(
        { error: 'Código y premio son requeridos' },
        { status: 400 }
      )
    }

    const existing = await db.raffleCode.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json(
        { error: 'El código ya existe' },
        { status: 409 }
      )
    }

    const raffleCode = await db.raffleCode.create({
      data: {
        code,
        prize,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(raffleCode)
  } catch {
    return NextResponse.json(
      { error: 'Error al crear código' },
      { status: 500 }
    )
  }
}

// DELETE - Authenticated: Delete a raffle code
export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID es requerido' },
        { status: 400 }
      )
    }

    await db.raffleCode.delete({ where: { id } })
    return NextResponse.json({ message: 'Código eliminado' })
  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar código' },
      { status: 500 }
    )
  }
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'TPK-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
