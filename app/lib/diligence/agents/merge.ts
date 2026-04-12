import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { getGeminiModelId } from '@/lib/ai/gemini-config'
import {
  diligenceReportSchema,
  type DeterministicFit,
  type DiligenceReport,
  type NormalizedScreeningReport,
} from '@/lib/diligence/schema'
import { z } from 'zod'

const PROMPT_VERSION = 'diligence-langgraph-v1'

const mergePartialSchema = z.object({
  executive_summary: z.string(),
  financial_fit: z.string(),
  stability: z.string(),
  risk_flags: z.array(z.string()),
  recommended_follow_ups: z.array(z.string()),
  disclaimer: z.string(),
})

/** Final merge node: combines sub-agent outputs into a validated diligence_report. */
export async function mergeDiligenceReport(input: {
  applicantName: string
  propertyAddress: string
  employer?: string
  jobTitle?: string
  vendor: NormalizedScreeningReport
  deterministic: DeterministicFit
  financialAgentText: string
  riskAgentText: string
}): Promise<DiligenceReport> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY is required')

  const modelId = getGeminiModelId()
  const llm = new ChatGoogleGenerativeAI({
    model: modelId,
    temperature: 0.2,
    apiKey,
  })

  const prompt = `You merge rental diligence sub-analyses into one structured report. Not legal advice.

Applicant: ${input.applicantName}
Property: ${input.propertyAddress}
Employer: ${input.employer ?? 'unknown'}
Title: ${input.jobTitle ?? 'unknown'}

Full screening object:
${JSON.stringify(input.vendor, null, 2)}

Deterministic metrics:
${JSON.stringify(input.deterministic, null, 2)}

Financial sub-agent analysis:
${input.financialAgentText}

Risk/stability sub-agent analysis:
${input.riskAgentText}

Produce executive_summary, financial_fit, stability, risk_flags, recommended_follow_ups, disclaimer.
Integrate the sub-agent text; you may refine wording for consistency. disclaimer must state informational only and fair housing awareness.

Respond with ONLY valid JSON (no markdown) with keys:
executive_summary, financial_fit, stability, risk_flags (array of strings), recommended_follow_ups (array of strings), disclaimer`

  const response = await llm.invoke(prompt)
  const raw = typeof response.content === 'string' ? response.content : String(response.content)
  const clean = raw.replace(/```json\s*|```/g, '').trim()
  const llmPart = mergePartialSchema.parse(JSON.parse(clean))
  const generatedAt = new Date().toISOString()

  const merged = {
    version: 1 as const,
    generated_at: generatedAt,
    model: modelId,
    prompt_version: PROMPT_VERSION,
    ...llmPart,
    vendor: input.vendor,
    deterministic: input.deterministic,
    agent_sections: {
      financial_agent: input.financialAgentText,
      risk_agent: input.riskAgentText,
    },
  }

  return diligenceReportSchema.parse(merged)
}
