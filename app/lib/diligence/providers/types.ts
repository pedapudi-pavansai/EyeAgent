import type { NormalizedScreeningReport } from '@/lib/diligence/schema'

export interface ApplicationScreeningContext {
  applicationId: string
  full_name: string
  email: string
  phone?: string
  employer?: string
  annual_income?: number
}

export interface ScreeningProvider {
  readonly id: string
  createOrder(ctx: ApplicationScreeningContext): Promise<{ order_id: string }>
  /** Poll until complete or throw on terminal failure. */
  waitForReport(orderId: string): Promise<NormalizedScreeningReport>
}
