import { z } from 'zod'

/** Normalized vendor snapshot (no raw PII in logs; store ids only in app logs). */
export const normalizedScreeningReportSchema = z.object({
  order_id: z.string(),
  status: z.enum(['pending', 'complete', 'failed']),
  summary_flags: z.array(z.string()).default([]),
  criminal_hits: z.boolean().optional(),
  eviction_hits: z.boolean().optional(),
  credit_band: z.enum(['excellent', 'good', 'fair', 'poor', 'unknown']).optional(),
  raw_vendor_payload: z.record(z.string(), z.unknown()).optional(),
})

export type NormalizedScreeningReport = z.infer<typeof normalizedScreeningReportSchema>

export const deterministicFitSchema = z.object({
  monthly_rent: z.number().nullable(),
  annual_income: z.number(),
  monthly_debts: z.number(),
  estimated_dti_percent: z.number().nullable(),
  rent_to_income_ratio: z.number().nullable(),
  rent_affordability_note: z.string(),
})

export type DeterministicFit = z.infer<typeof deterministicFitSchema>

export const diligenceReportSchema = z.object({
  version: z.literal(1),
  generated_at: z.string(),
  model: z.string(),
  prompt_version: z.string(),
  executive_summary: z.string(),
  financial_fit: z.string(),
  stability: z.string(),
  risk_flags: z.array(z.string()),
  recommended_follow_ups: z.array(z.string()),
  disclaimer: z.string(),
  vendor: normalizedScreeningReportSchema,
  deterministic: deterministicFitSchema,
  /** Populated by LangGraph multi-agent merge when present */
  agent_sections: z
    .object({
      financial_agent: z.string(),
      risk_agent: z.string(),
    })
    .optional(),
})

export type DiligenceReport = z.infer<typeof diligenceReportSchema>

export function parseDiligenceReport(data: unknown): DiligenceReport {
  return diligenceReportSchema.parse(data)
}
