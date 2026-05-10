import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/auth'

// Cryptographically secure Fisher-Yates shuffle
function secureShuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// POST - Authenticated: Random draw from unredeemed codes
export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { count = 1 } = body

    const unredeemed = await db.raffleCode.findMany({
      where: {
        isRedeemed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    if (unredeemed.length === 0) {
      return NextResponse.json(
        { error: 'No hay códigos disponibles para sorteo' },
        { status: 404 }
      )
    }

    // Cryptographically secure Fisher-Yates shuffle
    const shuffled = secureShuffle(unredeemed)
    const winners = shuffled.slice(0, Math.min(Number(count), unredeemed.length))

    return NextResponse.json({
      winners: winners.map(w => ({
        id: w.id,
        code: w.code,
        prize: w.prize,
      })),
      totalAvailable: unredeemed.length,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error al realizar sorteo' },
      { status: 500 }
    )
  }
}
