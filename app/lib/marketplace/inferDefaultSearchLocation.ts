/**
 * Default RentCast city/state from onboarding preferred markets, then first property address.
 * Falls back to Austin, TX so the API always has a valid metro to query.
 */
export function inferDefaultSearchLocation(
  properties: { address: string }[],
  preferredMarkets: string[]
): { city: string; state: string } {
  for (const pm of preferredMarkets) {
    const t = pm.trim()
    const m = t.match(/^([^,]+),\s*([A-Za-z]{2})\s*$/)
    if (m) {
      return { city: m[1].trim(), state: m[2].toUpperCase() }
    }
  }

  for (const p of properties) {
    const parts = p.address.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length < 2) continue

    const last = parts[parts.length - 1]
    const stateOnly = last.match(/^([A-Z]{2})$/i)
    const stateZip = last.match(/^([A-Z]{2})\s+(\d{5})/i)
    const state = (stateOnly?.[1] || stateZip?.[1])?.toUpperCase()
    if (!state) continue

    const cityCandidate = parts[parts.length - 2]
    if (cityCandidate && !/^\d/.test(cityCandidate) && cityCandidate.length >= 2) {
      return { city: cityCandidate, state }
    }
  }

  return { city: 'Austin', state: 'TX' }
}
