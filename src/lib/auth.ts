import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('ADMIN_JWT_SECRET environment variable is required. Set it in your .env file.')
}
const JWT_EXPIRES_IN = '24h'

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (typeof decoded === 'string') return null
    return decoded as jwt.JwtPayload
  } catch {
    return null
  }
}

export async function getAdminFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  if (!payload?.id) return null

  const admin = await db.adminUser.findUnique({
    where: { id: payload.id as string },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  return admin
}

export async function ensureDefaultBroadcastConfigs() {
  // Solo el canal principal para transmision desde telefono
  // Los demas canales se agregan desde el panel de administracion
  const defaults = [
    {
      channel: 'main',
      sourceType: 'url',
      sourceUrl: null,
      isActive: false,
      displayName: 'Canal Principal',
      category: 'tv',
      description: 'Transmision principal en vivo desde telefono',
      thumbnailUrl: null,
      sortOrder: 0,
    },
  ]

  for (const config of defaults) {
    const existing = await db.broadcastConfig.findUnique({
      where: { channel: config.channel },
    })
    if (!existing) {
      await db.broadcastConfig.create({ data: config })
    }
  }
}
