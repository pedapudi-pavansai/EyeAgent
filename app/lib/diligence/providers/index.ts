import { createStubScreeningProvider } from './stub'
import { createBackgroundChecksProvider } from './backgroundchecks'
import type { ScreeningProvider } from './types'

export type { ScreeningProvider, ApplicationScreeningContext } from './types'

export function getScreeningProvider(): ScreeningProvider {
  const mode = (process.env.SCREENING_PROVIDER || '').toLowerCase()
  if (mode === 'backgroundchecks') {
    return createBackgroundChecksProvider()
  }
  if (mode === 'stub') {
    return createStubScreeningProvider()
  }
  // Default: stub when no explicit mode (safe local dev); use backgroundchecks in production with env set
  if (process.env.SCREENING_API_BASE_URL && process.env.SCREENING_API_TOKEN) {
    try {
      return createBackgroundChecksProvider()
    } catch {
      return createStubScreeningProvider()
    }
  }
  return createStubScreeningProvider()
}
