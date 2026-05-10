import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Public: Redeem a raffle code (atomic operation to prevent race condition)
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

    // Use atomic updateMany to prevent race condition / double-spend
    const result = await db.$transaction(async (tx) => {
      // Check if code exists and is not redeemed + not expired
      const raffleCode = await tx.raffleCode.findUnique({ where: { code } })

      if (!raffleCode) {
        throw new Error('NOT_FOUND')
      }

      if (raffleCode.isRedeemed) {
        throw new Error('ALREADY_REDEEMED')
      }

      if (raffleCode.expiresAt && new Date() > raffleCode.expiresAt) {
        throw new Error('EXPIRED')
      }

      // Atomic conditional update - only updates if isRedeemed is still false
      const updated = await tx.raffleCode.updateMany({
        where: { code, isRedeemed: false },
        data: {
          isRedeemed: true,
          redeemedBy: redeemedBy || 'Anónimo',
          redeemedAt: new Date(),
        },
      })

      if (updated.count === 0) {
        throw new Error('ALREADY_REDEEMED')
      }

      return raffleCode
    })

    return NextResponse.json({
      message: '¡Código canjeado exitosamente!',
      prize: result.prize,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'UNKNOWN'

    if (msg === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'Código no encontrado' },
        { status: 404 }
      )
    }

    if (msg === 'ALREADY_REDEEMED') {
      return NextResponse.json(
        { error: 'Este código ya ha sido canjeado' },
        { status: 400 }
      )
    }

    if (msg === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Este código ha expirado' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al canjear código' },
      { status: 500 }
    )
  }
}
