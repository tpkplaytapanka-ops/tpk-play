import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  entry.count++
  if (entry.count > limit) {
    return false
  }

  return true
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limiting for auth endpoints
  if (pathname.startsWith('/api/auth')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const rateKey = `auth:${ip}`

    if (!checkRateLimit(rateKey, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo en un minuto.' },
        { status: 429 }
      )
    }
  }

  // Rate limiting for code redemption
  if (pathname === '/api/codes/redeem') {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const rateKey = `redeem:${ip}`

    if (!checkRateLimit(rateKey, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Demasiados intentos de canjeo. Intenta de nuevo en un minuto.' },
        { status: 429 }
      )
    }
  }

  // Rate limiting for setup endpoint (very strict)
  if (pathname === '/api/auth/setup') {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const rateKey = `setup:${ip}`

    if (!checkRateLimit(rateKey, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Demasiados intentos de configuración. Intenta de nuevo en una hora.' },
        { status: 429 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
