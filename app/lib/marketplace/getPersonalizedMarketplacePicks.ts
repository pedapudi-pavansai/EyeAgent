import type { SupabaseClient } from '@supabase/supabase-js'
import type { MarketplaceListing, Property } from '@/lib/types'
import { inferDefaultSearchLocation } from '@/lib/marketplace/inferDefaultSearchLocation'
import { personalizeTopListings } from '@/lib/marketplace/personalizeTopListings'

export type PersonalizedPicksResult = {
  picks: MarketplaceListing[]
  defaultFilters: { city: string; state: string }
  personalized: boolean
}

/**
 * Loads curated marketplace_listings, ranks them for this landlord, and infers
 * default RentCast search location from portfolio + preferred markets.
 */
export async function getPersonalizedMarketplacePicks(
  supabase: SupabaseClient,
  landlordId: string,
  take: number
): Promise<PersonalizedPicksResult> {
  const [{ data: properties }, { data: financials }, { data: marketplaceRows }] = await Promise.all([
    supabase
      .from('properties')
      .select('address, property_type, purchase_price')
      .eq('landlord_id', landlordId),
    supabase.from('landlord_financials').select('preferred_markets').eq('landlord_id', landlordId).maybeSingle(),
    supabase.from('marketplace_listings').select('*').order('cap_rate', { ascending: false }).limit(48),
  ])

  const props = (properties || []) as Pick<Property, 'address' | 'property_type' | 'purchase_price'>[]
  const preferredMarkets = (financials?.preferred_markets as string[] | null)?.filter(Boolean) ?? []

  const listingContext = {
    properties: props.map(p => ({
      address: p.address,
      property_type: p.property_type,
      purchase_price: p.purchase_price,
    })),
    preferredMarkets,
  }

  const personalized = props.length > 0 || preferredMarkets.length > 0

  const picks = personalizeTopListings(
    (marketplaceRows || []) as MarketplaceListing[],
    listingContext,
    take
  )

  const defaultFilters = inferDefaultSearchLocation(props, preferredMarkets)

  return {
    picks,
    defaultFilters,
    personalized,
  }
}
