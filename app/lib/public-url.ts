import type { NextRequest } from 'next/server'

/**
 * Canonical site origin for absolute URLs (emails, redirects, share links).
 * Prefer NEXT_PUBLIC_APP_URL in production; otherwise derive from the incoming request
 * (Vercel sets x-forwarded-* headers).
 */
export function getPublicOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const protoHeader = req.headers.get('x-forwarded-proto')
  const proto =
    protoHeader?.split(',')[0]?.trim() ??
    (req.nextUrl.protocol === 'https:' ? 'https' : 'http')
  if (host) {
    return `${proto}://${host.split(',')[0].trim()}`
  }
  return req.nextUrl.origin.replace(/\/$/, '')
}
