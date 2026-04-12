import type { ScreeningProvider, ApplicationScreeningContext } from './types'
import type { NormalizedScreeningReport } from '@/lib/diligence/schema'

/**
 * Deterministic sandbox for CI and local dev without vendor keys.
 * Set SCREENING_PROVIDER=stub (default when no credentials).
 */
export function createStubScreeningProvider(): ScreeningProvider {
  return {
    id: 'stub',
    async createOrder(ctx: ApplicationScreeningContext) {
      return { order_id: `stub_${ctx.applicationId.slice(0, 8)}` }
    },
    async waitForReport(orderId: string): Promise<NormalizedScreeningReport> {
      const seed = orderId.length % 3
      return {
        order_id: orderId,
        status: 'complete',
        summary_flags:
          seed === 0
            ? ['No disqualifying records in stub profile']
            : seed === 1
              ? ['Eviction record found (stub)', 'Verify with landlord references']
              : ['Credit band: fair (stub)'],
        criminal_hits: seed === 1,
        eviction_hits: seed === 1,
        credit_band: seed === 2 ? 'fair' : 'good',
        raw_vendor_payload: { source: 'stub', order_id: orderId },
      }
    },
  }
}
