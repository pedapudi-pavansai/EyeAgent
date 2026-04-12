import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { getGeminiModelId } from '@/lib/ai/gemini-config'
import type { DeterministicFit, NormalizedScreeningReport } from '@/lib/diligence/schema'
import { z } from 'zod'

const responseSchema = z.object({ analysis: z.string() })

/** Risk / stability sub-agent (LangGraph node). */
export async function runRiskAgent(input: {
  applicantName: string
  employer?: string
  vendor: NormalizedScreeningReport
  deterministic: DeterministicFit
}): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY is required')

  const llm = new ChatGoogleGenerativeAI({
    model: getGeminiModelId(),
    temperature: 0.2,
    apiKey,
  })

  const prompt = `You are a rental risk analyst. In 3-6 sentences, discuss employment/stability context and screening-related risk factors (eviction/criminal flags if present). Informational only, not legal advice.

Applicant: ${input.applicantName}
Employer: ${input.employer ?? 'unknown'}
Normalized screening: ${JSON.stringify({
    criminal_hits: input.vendor.criminal_hits,
    eviction_hits: input.vendor.eviction_hits,
    credit_band: input.vendor.credit_band,
    summary_flags: input.vendor.summary_flags,
  })}
Rent/income context: ${input.deterministic.rent_affordability_note}

Respond with ONLY JSON: {"analysis":"..."}`

  const response = await llm.invoke(prompt)
  const raw = typeof response.content === 'string' ? response.content : String(response.content)
  const clean = raw.replace(/```json\s*|```/g, '').trim()
  const parsed = responseSchema.parse(JSON.parse(clean))
  return parsed.analysis
}
