import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Public: Redeem a raffle code
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, redeemedBy } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Código es requerido' },
        { status: 400 }
      )
    }

    const raffleCode = await db.raffleCode.findUnique({ where: { code } })

    if (!raffleCode) {
      return NextResponse.json(
        { error: 'Código no encontrado' },
        { status: 404 }
      )
    }

    if (raffleCode.isRedeemed) {
      return NextResponse.json(
        { error: 'Este código ya ha sido canjeado' },
        { status: 400 }
      )
    }

    if (raffleCode.expiresAt && new Date() > raffleCode.expiresAt) {
      return NextResponse.json(
        { error: 'Este código ha expirado' },
        { status: 400 }
      )
    }

    const updated = await db.raffleCode.update({
      where: { code },
      data: {
        isRedeemed: true,
        redeemedBy: redeemedBy || 'Anónimo',
        redeemedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: '¡Código canjeado exitosamente!',
      prize: updated.prize,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error al canjear código' },
      { status: 500 }
    )
  }
}
