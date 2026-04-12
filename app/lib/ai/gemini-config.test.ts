import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { DEFAULT_GEMINI_MODEL, getGeminiModelId } from './gemini-config'

describe('getGeminiModelId', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults when GOOGLE_GENAI_MODEL is unset', () => {
    vi.stubEnv('GOOGLE_GENAI_MODEL', '')
    expect(getGeminiModelId()).toBe(DEFAULT_GEMINI_MODEL)
  })

  it('uses GOOGLE_GENAI_MODEL when set', () => {
    vi.stubEnv('GOOGLE_GENAI_MODEL', 'gemini-2.5-flash')
    expect(getGeminiModelId()).toBe('gemini-2.5-flash')
  })

  it('trims whitespace', () => {
    vi.stubEnv('GOOGLE_GENAI_MODEL', '  gemini-flash  ')
    expect(getGeminiModelId()).toBe('gemini-flash')
  })
})

describe('ChatGoogleGenerativeAI wiring', () => {
  it('uses default model id (not legacy gemini-1.5-pro)', () => {
    vi.stubEnv('GOOGLE_GENAI_MODEL', '')
    const llm = new ChatGoogleGenerativeAI({
      model: getGeminiModelId(),
      apiKey: 'test-key-not-used',
    })
    expect((llm as { model?: string }).model).toBe(DEFAULT_GEMINI_MODEL)
  })
})
