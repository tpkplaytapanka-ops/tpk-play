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
  const defaults = [
    // Canal principal (phone broadcasting)
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
    // TV Channels
    {
      channel: 'tv1',
      sourceType: 'hls',
      sourceUrl: 'https://streaming.rtvc.gov.co/TV_Senal_Colombia_live/smil:live.smil/playlist.m3u8',
      isActive: true,
      displayName: 'Senal Colombia',
      category: 'tv',
      description: 'Canal publico nacional de Colombia',
      thumbnailUrl: null,
      sortOrder: 1,
    },
    {
      channel: 'tv2',
      sourceType: 'hls',
      sourceUrl: 'http://181.114.57.246:4000/play/u2H4dIJoRipgGI3A/index.m3u8',
      isActive: true,
      displayName: 'Citytv',
      category: 'tv',
      description: 'Canal de television bogotano',
      thumbnailUrl: null,
      sortOrder: 2,
    },
    {
      channel: 'tv3',
      sourceType: 'hls',
      sourceUrl: 'https://streaming.rtvc.gov.co/TV_Canal_Institucional_live/smil:live.smil/playlist.m3u8',
      isActive: true,
      displayName: 'Canal Institucional',
      category: 'tv',
      description: 'Canal Institucional RTVC',
      thumbnailUrl: null,
      sortOrder: 3,
    },
    {
      channel: 'tv4',
      sourceType: 'hls',
      sourceUrl: 'https://streaming.rtvc.gov.co/TV_Senal_Colombia_live/smil:live.smil/playlist.m3u8',
      isActive: false,
      displayName: 'Telecaribe',
      category: 'tv',
      description: 'Canal regional del Caribe colombiano',
      thumbnailUrl: null,
      sortOrder: 4,
    },
    {
      channel: 'tv5',
      sourceType: 'hls',
      sourceUrl: 'https://api.new.livestream.com/accounts/15107165/events/4320311/live.m3u8',
      isActive: true,
      displayName: 'Teleantioquia',
      category: 'tv',
      description: 'Canal regional de Antioquia',
      thumbnailUrl: null,
      sortOrder: 5,
    },
    {
      channel: 'tv6',
      sourceType: 'hls',
      sourceUrl: 'https://streaming.rtvc.gov.co/RTVCplay/Canal_Trece_live/smil:live.smil/playlist.m3u8',
      isActive: true,
      displayName: 'Canal Trece',
      category: 'tv',
      description: 'Canal Trece de Colombia',
      thumbnailUrl: null,
      sortOrder: 6,
    },
    {
      channel: 'tv7',
      sourceType: 'youtube',
      sourceUrl: 'https://www.youtube.com/live/junkZDAhklI',
      isActive: true,
      displayName: 'Noticias Caracol',
      category: 'tv',
      description: 'Noticias Caracol en vivo',
      thumbnailUrl: null,
      sortOrder: 7,
    },
    // Radio Stations
    {
      channel: 'radio',
      sourceType: 'audio',
      sourceUrl: 'https://mdstrm.com/live-stream-playlist/58d1921a72e2b22e2905e493.m3u8',
      isActive: true,
      displayName: 'Blue Radio',
      category: 'radio',
      description: 'Noticias y opinion en vivo',
      thumbnailUrl: null,
      sortOrder: 10,
    },
    {
      channel: 'radio2',
      sourceType: 'audio',
      sourceUrl: 'https://24563.live.streamtheworld.com/CARACOL_RADIOAAC_SC',
      isActive: true,
      displayName: 'Caracol Radio',
      category: 'radio',
      description: 'La radio de Colombia - Noticias 24/7',
      thumbnailUrl: null,
      sortOrder: 11,
    },
    {
      channel: 'radio3',
      sourceType: 'audio',
      sourceUrl: 'https://22823.live.streamtheworld.com/WRADIOAAC_SC',
      isActive: true,
      displayName: 'W Radio',
      category: 'radio',
      description: 'W Radio Colombia - Noticias y entretenimiento',
      thumbnailUrl: null,
      sortOrder: 12,
    },
    {
      channel: 'radio4',
      sourceType: 'audio',
      sourceUrl: 'https://24563.live.streamtheworld.com/RCN_RADIOAAC_SC',
      isActive: true,
      displayName: 'RCN Radio',
      category: 'radio',
      description: 'RCN Radio Colombia - Noticias y deportes',
      thumbnailUrl: null,
      sortOrder: 13,
    },
    {
      channel: 'radio5',
      sourceType: 'audio',
      sourceUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/TODELAR_STATIONAAC_SC',
      isActive: true,
      displayName: 'Todelar Radio',
      category: 'radio',
      description: 'Todelar - La cadena de la familia colombiana',
      thumbnailUrl: null,
      sortOrder: 14,
    },
    // Music
    {
      channel: 'music',
      sourceType: 'audio',
      sourceUrl: 'https://mdstrm.com/live-stream-playlist/58d191f07290fbb058025843.m3u8',
      isActive: true,
      displayName: 'La Kalle',
      category: 'music',
      description: 'Musica tropical y reggaeton en vivo',
      thumbnailUrl: null,
      sortOrder: 20,
    },
    {
      channel: 'music2',
      sourceType: 'audio',
      sourceUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_COLOMBIAAAC_SC',
      isActive: true,
      displayName: 'Los 40 Colombia',
      category: 'music',
      description: 'Los exitos del momento',
      thumbnailUrl: null,
      sortOrder: 21,
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
