import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest, ensureDefaultBroadcastConfigs } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

// GET - Public: Get all broadcast configs (limited fields)
export async function GET() {
  try {
    await ensureDefaultBroadcastConfigs()
    const configs = await db.broadcastConfig.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        channel: true,
        sourceType: true,
        sourceUrl: true,
        isActive: true,
        displayName: true,
        category: true,
        description: true,
        thumbnailUrl: true,
        sortOrder: true,
      },
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
    const { channel, sourceType, sourceUrl, isActive, displayName, category, description, thumbnailUrl, sortOrder } = body

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
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      create: {
        channel,
        sourceType: sourceType || 'url',
        sourceUrl: sourceUrl || null,
        isActive: isActive ?? false,
        displayName: displayName || null,
        category: category || 'tv',
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        sortOrder: sortOrder ?? 0,
      },
    })

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    await logAudit({ adminId: admin.id, action: 'update_broadcast', resource: 'BroadcastConfig', details: { channel }, ipAddress: ip })

    return NextResponse.json(config)
  } catch {
    return NextResponse.json(
      { error: 'Error al guardar configuracion' },
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
    const { channel, sourceType, sourceUrl, isActive, displayName, category, description, thumbnailUrl, sortOrder } = body

    if (!channel) {
      return NextResponse.json(
        { error: 'Canal es requerido' },
        { status: 400 }
      )
    }

    const existing = await db.broadcastConfig.findUnique({ where: { channel } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Configuracion no encontrada' },
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
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json(config)
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar configuracion' },
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

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    await logAudit({ adminId: admin.id, action: 'delete_broadcast', resource: 'BroadcastConfig', details: { channel }, ipAddress: ip })

    return NextResponse.json({ message: 'Configuracion eliminada' })
  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar configuracion' },
      { status: 500 }
    )
  }
}
