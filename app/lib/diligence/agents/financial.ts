import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { getGeminiModelId } from '@/lib/ai/gemini-config'
import type { DeterministicFit, NormalizedScreeningReport } from '@/lib/diligence/schema'
import { z } from 'zod'

const responseSchema = z.object({ analysis: z.string() })

/** Financial-fit sub-agent (LangGraph node). */
export async function runFinancialAgent(input: {
  applicantName: string
  propertyAddress: string
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

  const prompt = `You are a rental financial analyst. Write a concise analysis (3-5 sentences) on whether the applicant can afford the rent and how debt/income aligns with screening flags. Not legal advice.

Applicant: ${input.applicantName}
Property: ${input.propertyAddress}

Screening flags: ${JSON.stringify(input.vendor.summary_flags)}
Deterministic metrics: ${JSON.stringify(input.deterministic)}

Respond with ONLY JSON: {"analysis":"..."}`

  const response = await llm.invoke(prompt)
  const raw = typeof response.content === 'string' ? response.content : String(response.content)
  const clean = raw.replace(/```json\s*|```/g, '').trim()
  const parsed = responseSchema.parse(JSON.parse(clean))
  return parsed.analysis
}
