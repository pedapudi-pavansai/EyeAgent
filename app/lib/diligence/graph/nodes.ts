import { createAdminClient } from '@/lib/supabase/admin'
import { getScreeningProvider } from '@/lib/diligence/providers'
import { computeDeterministicFit } from '@/lib/diligence/deterministic'
import { normalizedScreeningReportSchema } from '@/lib/diligence/schema'
import { runFinancialAgent } from '@/lib/diligence/agents/financial'
import { runRiskAgent } from '@/lib/diligence/agents/risk'
import { mergeDiligenceReport } from '@/lib/diligence/agents/merge'
import type { DiligenceGraphState } from '@/lib/diligence/graph/state'

export async function loadContextNode(
  state: DiligenceGraphState
): Promise<Partial<DiligenceGraphState>> {
  const admin = createAdminClient()
  const { data: app, error: appErr } = await admin
    .from('applications')
    .select('*')
    .eq('id', state.applicationId)
    .single()

  if (appErr || !app) {
    throw new Error(appErr?.message || 'Application not found')
  }

  const { data: property } = await admin
    .from('properties')
    .select('monthly_rent, address')
    .eq('id', app.property_id as string)
    .single()

  return {
    appRow: app as Record<string, unknown>,
    propertyMonthlyRent: property?.monthly_rent != null ? Number(property.monthly_rent) : null,
    propertyAddress: property?.address || 'Unknown property',
  }
}

export async function screeningNode(state: DiligenceGraphState): Promise<Partial<DiligenceGraphState>> {
  const app = state.appRow
  const provider = getScreeningProvider()
  const ctx = {
    applicationId: String(app.id ?? state.applicationId),
    full_name: String(app.full_name || 'Applicant'),
    email: String(app.email || ''),
    phone: app.phone != null ? String(app.phone) : undefined,
    employer: app.employer != null ? String(app.employer) : undefined,
    annual_income: app.annual_income != null ? Number(app.annual_income) : undefined,
  }

  const { order_id } = await provider.createOrder(ctx)
  const admin = createAdminClient()
  await admin
    .from('applications')
    .update({
      diligence_external_order_id: order_id,
      diligence_provider: provider.id,
    })
    .eq('id', state.applicationId)

  const rawReport = await provider.waitForReport(order_id)
  const vendor = normalizedScreeningReportSchema.parse(rawReport)

  return {
    vendor,
    providerId: provider.id,
    externalOrderId: order_id,
  }
}

export async function deterministicNode(state: DiligenceGraphState): Promise<Partial<DiligenceGraphState>> {
  const app = state.appRow
  const monthly_rent = state.propertyMonthlyRent
  const deterministic = computeDeterministicFit({
    annual_income: Number(app.annual_income) || 0,
    monthly_debts: Number(app.monthly_debts) || 0,
    monthly_rent,
  })
  return { deterministic }
}

export async function financialAgentNode(state: DiligenceGraphState): Promise<Partial<DiligenceGraphState>> {
  if (!state.vendor || !state.deterministic) {
    throw new Error('screening and deterministic steps must run before financial agent')
  }
  const app = state.appRow
  try {
    const text = await runFinancialAgent({
      applicantName: String(app.full_name || 'Applicant'),
      propertyAddress: state.propertyAddress,
      vendor: state.vendor,
      deterministic: state.deterministic,
    })
    return { financialAgentText: text }
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err)
    throw new Error(`Financial analysis failed: ${cause}`)
  }
}

export async function riskAgentNode(state: DiligenceGraphState): Promise<Partial<DiligenceGraphState>> {
  if (!state.vendor || !state.deterministic) {
    throw new Error('screening and deterministic steps must run before risk agent')
  }
  const app = state.appRow
  try {
    const text = await runRiskAgent({
      applicantName: String(app.full_name || 'Applicant'),
      employer: app.employer != null ? String(app.employer) : undefined,
      vendor: state.vendor,
      deterministic: state.deterministic,
    })
    return { riskAgentText: text }
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err)
    throw new Error(`Risk analysis failed: ${cause}`)
  }
}

export async function mergeReportNode(state: DiligenceGraphState): Promise<Partial<DiligenceGraphState>> {
  if (!state.vendor || !state.deterministic) {
    throw new Error('Missing vendor or deterministic for merge')
  }
  const app = state.appRow
  try {
    const report = await mergeDiligenceReport({
      applicantName: String(app.full_name || 'Applicant'),
      propertyAddress: state.propertyAddress,
      employer: app.employer != null ? String(app.employer) : undefined,
      jobTitle: app.job_title != null ? String(app.job_title) : undefined,
      vendor: state.vendor,
      deterministic: state.deterministic,
      financialAgentText: state.financialAgentText,
      riskAgentText: state.riskAgentText,
    })
    return { finalReport: report }
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err)
    throw new Error(`Report merge failed: ${cause}`)
  }
}
