import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, ensureDefaultBroadcastConfigs } from '@/lib/auth'

// GET - Public: Get all broadcast configs
export async function GET() {
  try {
    await ensureDefaultBroadcastConfigs()
    const configs = await db.broadcastConfig.findMany({
      orderBy: { channel: 'asc' },
    })
    return NextResponse.json(configs)
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener configuraciones' },
      { status: 500 }
    )
  }
}

// POST - Authenticated: Create or update broadcast config
export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { channel, sourceType, sourceUrl, isActive, displayName } = body

    if (!channel) {
      return NextResponse.json(
        { error: 'Canal es requerido' },
        { status: 400 }
      )
    }

    const config = await db.broadcastConfig.upsert({
      where: { channel },
      update: {
        ...(sourceType !== undefined && { sourceType }),
        ...(sourceUrl !== undefined && { sourceUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(displayName !== undefined && { displayName }),
      },
      create: {
        channel,
        sourceType: sourceType || 'url',
        sourceUrl: sourceUrl || null,
        isActive: isActive ?? false,
        displayName: displayName || null,
      },
    })

    return NextResponse.json(config)
  } catch {
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    )
  }
}

// PUT - Authenticated: Update broadcast config
export async function PUT(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { channel, sourceType, sourceUrl, isActive, displayName } = body

    if (!channel) {
      return NextResponse.json(
        { error: 'Canal es requerido' },
        { status: 400 }
      )
    }

    const existing = await db.broadcastConfig.findUnique({ where: { channel } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      )
    }

    const config = await db.broadcastConfig.update({
      where: { channel },
      data: {
        ...(sourceType !== undefined && { sourceType }),
        ...(sourceUrl !== undefined && { sourceUrl }),
        ...(isActive !== undefined && { isActive }),
        ...(displayName !== undefined && { displayName }),
      },
    })

    return NextResponse.json(config)
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}

// DELETE - Authenticated: Delete broadcast config
export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromRequest(request)
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel')

    if (!channel) {
      return NextResponse.json(
        { error: 'Canal es requerido' },
        { status: 400 }
      )
    }

    await db.broadcastConfig.delete({ where: { channel } })
    return NextResponse.json({ message: 'Configuración eliminada' })
  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar configuración' },
      { status: 500 }
    )
  }
}
