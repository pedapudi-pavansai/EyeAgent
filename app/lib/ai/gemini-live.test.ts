import { describe, expect, it } from 'vitest'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { getGeminiModelId } from './gemini-config'

/** Opt-in: `GEMINI_LIVE_TEST=1 npm test` — uses GOOGLE_API_KEY against the real API (rotate keys if Google returns 403 leaked). */
const runLive =
  process.env.GEMINI_LIVE_TEST === '1' && Boolean(process.env.GOOGLE_API_KEY?.trim())

/**
 * Calls the same Generative Language API path as diligence agents.
 * Skips unless GEMINI_LIVE_TEST=1 so CI and normal `npm test` stay green without a valid key.
 */
describe('Gemini live API (LangChain)', () => {
  it.skipIf(!runLive)('invoke succeeds with configured model', async () => {
    const apiKey = process.env.GOOGLE_API_KEY!
    const model = getGeminiModelId()
    const llm = new ChatGoogleGenerativeAI({
      model,
      temperature: 0,
      apiKey,
    })
    const out = await llm.invoke('Reply with exactly the word OK and nothing else.')
    const text = typeof out.content === 'string' ? out.content : String(out.content)
    expect(text.toUpperCase()).toContain('OK')
  }, 90_000)
})
