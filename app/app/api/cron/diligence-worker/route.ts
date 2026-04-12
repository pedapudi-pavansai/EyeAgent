import { NextRequest, NextResponse } from 'next/server'
import { processNextDiligenceJob } from '@/lib/diligence/process-queue'

export const maxDuration = 300

function authorize(req: NextRequest): boolean {
  /** Vercel Cron sets this header on scheduled invocations. */
  if (process.env.VERCEL && req.headers.get('x-vercel-cron') === '1') {
    return true
  }
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return false
  }
  const auth = req.headers.get('authorization')
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  const header = req.headers.get('x-cron-secret')
  return bearer === secret || header === secret
}

/**
 * Secured cron/worker endpoint. Vercel Cron should call with CRON_SECRET.
 * Local dev: curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/diligence-worker
 */
export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const processed = await processNextDiligenceJob()
    return NextResponse.json({ ok: true, processed })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Worker error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
