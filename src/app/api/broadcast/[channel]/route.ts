import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDefaultBroadcastConfigs } from '@/lib/auth'

// GET - Public: Get specific channel config
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channel: string }> }
) {
  try {
    await ensureDefaultBroadcastConfigs()
    const { channel } = await params
    const config = await db.broadcastConfig.findUnique({
      where: { channel },
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Canal no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(config)
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener configuración del canal' },
      { status: 500 }
    )
  }
}
