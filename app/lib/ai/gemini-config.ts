/**
 * Single source of truth for Google AI Studio (Generative Language API) model id.
 * Older ids (`gemini-1.5-pro`, `gemini-2.0-flash`) are often retired from v1beta — use current Flash/Pro.
 *
 * Override: GOOGLE_GENAI_MODEL (e.g. gemini-2.5-pro)
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

export function getGeminiModelId(): string {
  const fromEnv = process.env.GOOGLE_GENAI_MODEL?.trim()
  return fromEnv || DEFAULT_GEMINI_MODEL
}
