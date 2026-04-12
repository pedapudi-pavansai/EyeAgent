import type { ScreeningProvider, ApplicationScreeningContext } from './types'
import type { NormalizedScreeningReport } from '@/lib/diligence/schema'

/**
 * BackgroundChecks.com / ClearChecks-style sandbox HTTP client.
 * See `docs/SCREENING_VENDOR.md` (repo root: platform/app/docs/) for env vars and sandbox E2E steps.
 */
export function createBackgroundChecksProvider(): ScreeningProvider {
  const base = process.env.SCREENING_API_BASE_URL?.replace(/\/$/, '') || ''
  const token = process.env.SCREENING_API_TOKEN || ''
  const orderPath = process.env.SCREENING_ORDER_PATH || '/v1/screening_orders'
  const statusPath = process.env.SCREENING_ORDER_STATUS_PATH || '/v1/screening_orders'

  if (!base || !token) {
    throw new Error('SCREENING_API_BASE_URL and SCREENING_API_TOKEN are required for backgroundchecks provider')
  }

  async function apiGet(path: string) {
    const url = new URL(path.startsWith('http') ? path : `${base}${path}`)
    if (!path.startsWith('http')) url.searchParams.set('api_token', token)
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`Screening API GET ${path}: ${res.status}`)
    return res.json() as Promise<Record<string, unknown>>
  }

  async function apiPost(path: string, body: Record<string, unknown>) {
    const url = new URL(`${base}${path}`)
    url.searchParams.set('api_token', token)
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`Screening API POST ${path}: ${res.status} ${t.slice(0, 200)}`)
    }
    return res.json() as Promise<Record<string, unknown>>
  }

  function mapToNormalized(orderId: string, payload: Record<string, unknown>): NormalizedScreeningReport {
    const statusRaw = String(payload.status ?? payload.state ?? 'complete').toLowerCase()
    const status =
      statusRaw.includes('pend') || statusRaw === 'processing'
        ? 'pending'
        : statusRaw.includes('fail') || statusRaw === 'error'
          ? 'failed'
          : 'complete'

    const flags: string[] = []
    if (payload.flags && Array.isArray(payload.flags)) flags.push(...(payload.flags as string[]))
    if (payload.summary && typeof payload.summary === 'string') flags.push(payload.summary)

    return {
      order_id: orderId,
      status,
      summary_flags: flags.length ? flags : ['Screening order completed'],
      criminal_hits: Boolean(payload.criminal_hits ?? payload.criminalHits),
      eviction_hits: Boolean(payload.eviction_hits ?? payload.evictionHits),
      credit_band: (payload.credit_band as NormalizedScreeningReport['credit_band']) ?? 'unknown',
      raw_vendor_payload: payload,
    }
  }

  return {
    id: 'backgroundchecks',
    async createOrder(ctx: ApplicationScreeningContext) {
      const [firstName = 'Applicant', ...rest] = ctx.full_name.trim().split(/\s+/)
      const lastName = rest.join(' ') || 'Unknown'
      const body = {
        application_id: ctx.applicationId,
        applicant: {
          first_name: firstName,
          last_name: lastName,
          email: ctx.email,
          phone: ctx.phone,
          employer: ctx.employer,
        },
      }
      const data = await apiPost(orderPath, body)
      const id = String(data.id ?? data.order_id ?? data.orderId ?? '')
      if (!id) throw new Error('Screening API did not return order id')
      return { order_id: id }
    },
    async waitForReport(orderId: string): Promise<NormalizedScreeningReport> {
      const maxAttempts = 30
      const delayMs = 2000
      for (let i = 0; i < maxAttempts; i++) {
        const data = await apiGet(`${statusPath.replace(/\/$/, '')}/${encodeURIComponent(orderId)}`)
        const normalized = mapToNormalized(orderId, data)
        if (normalized.status === 'complete') return normalized
        if (normalized.status === 'failed') {
          throw new Error(String(data.error ?? 'Screening report failed'))
        }
        await new Promise(r => setTimeout(r, delayMs))
      }
      throw new Error('Screening report timed out waiting for vendor')
    },
  }
}
