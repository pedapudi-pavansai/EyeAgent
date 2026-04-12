import type { MarketplaceListing, Property } from '@/lib/types'

/** US state from "City, ST" or "..., ST 12345" style strings */
export function extractStateFromLocation(line: string | null | undefined): string | null {
  if (!line?.trim()) return null
  const parts = line.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length < 2) {
    const m = line.trim().match(/\b([A-Z]{2})\s+\d{5}\b/i)
    return m ? m[1].toUpperCase() : null
  }
  const last = parts[parts.length - 1]
  if (/^[A-Z]{2}$/i.test(last)) return last.toUpperCase()
  const zipMatch = last.match(/^([A-Z]{2})\s+/i)
  if (zipMatch) return zipMatch[1].toUpperCase()
  return null
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

function typesLooselyMatch(listingType: string, landlordType: string): boolean {
  const a = listingType.toLowerCase()
  const b = landlordType.toLowerCase()
  const keys: [string, string][] = [
    ['single', 'single'],
    ['multi', 'multi'],
    ['duplex', 'duplex'],
    ['condo', 'condo'],
    ['town', 'town'],
  ]
  for (const [k1, k2] of keys) {
    if (a.includes(k1) && b.includes(k2)) return true
  }
  return a.split(/\s+/)[0] === b.split(/\s+/)[0]
}

export type LandlordListingContext = {
  properties: Pick<Property, 'address' | 'property_type' | 'purchase_price'>[]
  preferredMarkets: string[]
}

function scoreListing(listing: MarketplaceListing, ctx: LandlordListingContext): number {
  const states = new Set<string>()
  const typeCounts = new Map<string, number>()
  const prices: number[] = []

  for (const p of ctx.properties) {
    const st = extractStateFromLocation(p.address)
    if (st) states.add(st)
    const t = (p.property_type || '').trim()
    if (t) typeCounts.set(t, (typeCounts.get(t) || 0) + 1)
    const pp = p.purchase_price
    if (pp != null && !Number.isNaN(Number(pp)) && Number(pp) > 0) {
      prices.push(Number(pp))
    }
  }

  const medianPrice = prices.length ? median(prices) : null
  const topLandlordType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  let score = 0
  const cityLower = (listing.city || '').toLowerCase()
  const listingState = extractStateFromLocation(listing.city)

  if (listingState && states.has(listingState)) score += 100

  for (const pm of ctx.preferredMarkets) {
    const q = pm.toLowerCase().trim()
    if (q.length >= 2 && (cityLower.includes(q) || (listing.address || '').toLowerCase().includes(q))) {
      score += 85
    }
  }

  if (topLandlordType && typesLooselyMatch(listing.property_type || '', topLandlordType)) {
    score += 45
  }

  if (medianPrice != null && listing.price > 0) {
    const ratio = listing.price / medianPrice
    if (ratio >= 0.3 && ratio <= 3.5) score += 35
    else if (ratio >= 0.15 && ratio <= 6) score += 15
  }

  score += listing.cap_rate * 4
  score += listing.cash_on_cash * 0.5

  return score
}

/**
 * Orders marketplace rows for this landlord: preferred markets + geography + property mix + price fit,
 * then cap rate. Falls back to cap-rate-only when there is no portfolio or preferred markets.
 */
export function personalizeTopListings(
  listings: MarketplaceListing[],
  ctx: LandlordListingContext,
  take: number
): MarketplaceListing[] {
  if (!listings.length) return []

  const hasSignals = ctx.properties.length > 0 || ctx.preferredMarkets.length > 0

  if (!hasSignals) {
    return [...listings].sort((a, b) => b.cap_rate - a.cap_rate).slice(0, take)
  }

  return [...listings]
    .map(l => ({ l, score: scoreListing(l, ctx) }))
    .sort((a, b) => b.score - a.score || b.l.cap_rate - a.l.cap_rate || b.l.cash_on_cash - a.l.cash_on_cash)
    .slice(0, take)
    .map(x => x.l)
}
