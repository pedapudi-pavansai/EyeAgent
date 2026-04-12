import type { NextRequest } from 'next/server'

const LOCALHOST_ORIGIN_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i

function isLocalhostOrigin(url: string): boolean {
  return LOCALHOST_ORIGIN_RE.test(url.trim())
}

/**
 * Canonical site origin for absolute URLs (emails, redirects, share links).
 *
 * - If `NEXT_PUBLIC_APP_URL` is a real (non-localhost) URL, use it — e.g. share prod
 *   links while developing locally, or a custom domain on Vercel.
 * - Otherwise prefer the incoming request host when it is not localhost (preview /
 *   production on Vercel, tunnels, custom domains). This avoids copied links staying
 *   `localhost` when the env var was left as localhost or baked into a deploy.
 * - On Vercel, `VERCEL_URL` is a final fallback when the request host is still localhost.
 */
export function getPublicOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const protoHeader = req.headers.get('x-forwarded-proto')
  const proto =
    protoHeader?.split(',')[0]?.trim() ??
    (req.nextUrl.protocol === 'https:' ? 'https' : 'http')

  const hostFirst = host?.split(',')[0]?.trim()
  const hostIsPublic =
    hostFirst &&
    !/^localhost(:\d+)?$/i.test(hostFirst) &&
    !/^127\.0\.0\.1(:\d+)?$/i.test(hostFirst)

  if (fromEnv && !isLocalhostOrigin(fromEnv)) {
    return fromEnv.replace(/\/$/, '')
  }

  if (host && hostIsPublic) {
    return `${proto}://${hostFirst}`
  }

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, '')}`
  }

  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }

  if (host) {
    return `${proto}://${hostFirst}`
  }

  return req.nextUrl.origin.replace(/\/$/, '')
}
