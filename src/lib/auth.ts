import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'tpk-play-default-secret-change-me'
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
  const defaults = [
    {
      channel: 'main',
      sourceType: 'url',
      sourceUrl: null,
      isActive: false,
      displayName: 'Canal Principal',
    },
    {
      channel: 'tv1',
      sourceType: 'hls',
      sourceUrl: 'https://streaming.rtvc.gov.co/TV_Senal_Colombia_live/smil:live.smil/playlist.m3u8',
      isActive: true,
      displayName: 'Señal Colombia',
    },
    {
      channel: 'tv2',
      sourceType: 'hls',
      sourceUrl: 'http://181.114.57.246:4000/play/u2H4dIJoRipgGI3A/index.m3u8',
      isActive: true,
      displayName: 'Citytv',
    },
    {
      channel: 'radio',
      sourceType: 'audio',
      sourceUrl: 'https://mdstrm.com/live-stream-playlist/58d1921a72e2b22e2905e493.m3u8',
      isActive: true,
      displayName: 'Blue Radio',
    },
    {
      channel: 'music',
      sourceType: 'audio',
      sourceUrl: 'https://mdstrm.com/live-stream-playlist/58d191f07290fbb058025843.m3u8',
      isActive: true,
      displayName: 'La Kalle',
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
