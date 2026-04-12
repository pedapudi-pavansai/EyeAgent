'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Building2,
  Filter,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Store,
} from 'lucide-react'
import SaleListingCard from '@/components/SaleListingCard'
import { assignDistinctPropertyImageUrls } from '@/lib/property-image'
import type { RentCastSaleListing } from '@/lib/types'

const MarketplaceMap = dynamic(() => import('@/components/MarketplaceMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] w-full items-center justify-center rounded-[32px] bg-gradient-to-b from-neutral-50 to-neutral-100/80 ring-1 ring-black/[0.05]">
      <div className="flex flex-col items-center gap-3 text-[#64748b]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0f766e]" strokeWidth={1.75} />
        <p className="text-sm font-medium">Loading map…</p>
      </div>
    </div>
  ),
})

const PROPERTY_TYPES = [
  '',
  'Single Family',
  'Condo',
  'Townhouse',
  'Manufactured',
  'Multi-Family',
  'Apartment',
  'Land',
] as const

const STATUSES = ['', 'Active', 'Inactive'] as const

const field =
  'w-full min-w-0 rounded-[10px] bg-white px-3 py-2.5 text-[13.5px] text-neutral-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-neutral-300 focus:outline-none focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.04),0_0_0_3px_rgba(15,118,110,0.15)] transition-[box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]'

const fieldWrap = 'rounded-xl p-[3px] ring-1 ring-black/[0.07] bg-neutral-100/60'

const labelClass = 'mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-neutral-400'

function buildPriceParam(minPrice: string, maxPrice: string): string | null {
  const min = minPrice.trim()
  const max = maxPrice.trim()
  if (!min && !max) return null
  if (min && max) return `${min}-${max}`
  if (min) return `${min}-`
  return `-${max}`
}

export default function MarketplacePageClient() {
  const [listings, setListings] = useState<RentCastSaleListing[]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchReady, setSearchReady] = useState(false)
  const [filters, setFilters] = useState({
    city: 'Austin',
    state: 'TX',
    zipCode: '',
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    status: 'Active',
    limit: '50',
    offset: '0',
  })

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.city.trim()) p.set('city', filters.city.trim())
    if (filters.state.trim()) p.set('state', filters.state.trim())
    if (filters.zipCode.trim()) p.set('zipCode', filters.zipCode.trim())
    const price = buildPriceParam(filters.minPrice, filters.maxPrice)
    if (price) p.set('price', price)
    if (filters.propertyType) p.set('propertyType', filters.propertyType)
    if (filters.bedrooms.trim()) p.set('bedrooms', filters.bedrooms.trim())
    if (filters.bathrooms.trim()) p.set('bathrooms', filters.bathrooms.trim())
    if (filters.status) p.set('status', filters.status)
    const limit = Math.min(500, Math.max(1, parseInt(filters.limit, 10) || 50))
    p.set('limit', String(limit))
    const offset = Math.max(0, parseInt(filters.offset, 10) || 0)
    p.set('offset', String(offset))
    p.set('includeTotalCount', 'true')
    return p.toString()
  }, [filters])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rentcast/sale-listings?${queryString}`)
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setListings([])
        setTotalCount(null)
        setError(typeof body.error === 'string' ? body.error : 'Failed to load listings')
        return
      }
      setListings(Array.isArray(body.listings) ? body.listings : [])
      setTotalCount(typeof body.totalCount === 'number' ? body.totalCount : null)
    } catch {
      setListings([])
      setTotalCount(null)
      setError('Network error loading listings')
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/landlord/marketplace-picks')
        if (cancelled) return
        if (res.status === 401 || !res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data.defaultFilters?.city && data.defaultFilters?.state) {
          setFilters(f => ({
            ...f,
            city: String(data.defaultFilters.city),
            state: String(data.defaultFilters.state).slice(0, 2).toUpperCase(),
          }))
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setSearchReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!searchReady) return
    fetchListings()
  }, [searchReady, fetchListings])

  const defaultFilters = {
    city: 'Austin',
    state: 'TX',
    zipCode: '',
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    status: 'Active',
    limit: '50',
    offset: '0',
  }

  const listingImageById = useMemo(
    () => assignDistinctPropertyImageUrls(listings.map(l => l.id)),
    [listings]
  )

  return (
    <main className="relative mx-auto flex min-h-0 w-full max-w-[1320px] flex-1 flex-col px-5 pb-20 pt-6 sm:px-8 sm:pt-8">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(100vw,900px)] -translate-x-1/2 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(20,184,166,0.12),transparent)]"
        aria-hidden
      />

      <section aria-labelledby="marketplace-heading" className="relative">
        <div className="relative overflow-hidden rounded-[28px] bg-white ring-1 ring-black/[0.05] shadow-[0_20px_60px_-24px_rgba(0,0,0,0.10)]">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#0f766e]/[0.06] blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:flex-row lg:items-stretch lg:gap-10">
            <div className="shrink-0 border-l-[3px] border-[#0f766e] pl-6 sm:pl-8 lg:max-w-md lg:pt-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Acquisition search</p>
              <h1
                id="marketplace-heading"
                className="mt-3 font-manrope text-[clamp(1.75rem,4vw,2.25rem)] font-bold leading-tight tracking-[-0.03em] text-[#191c1d]"
              >
                Marketplace
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-[#475569] sm:text-[16px]">
                Explore live for-sale inventory on the map, then drill into cards — same query powers both panes. Data
                via RentCast; location defaults can follow your portfolio.
              </p>
              <ul className="mt-8 flex flex-wrap gap-2.5" aria-label="Data sources and modes">
                <li className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3.5 py-1.5 text-[12px] font-medium text-neutral-600 ring-1 ring-black/[0.05]">
                  <Sparkles className="h-3.5 w-3.5 text-[#0f766e]" strokeWidth={2} />
                  RentCast listings
                </li>
                <li className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3.5 py-1.5 text-[12px] font-medium text-neutral-600 ring-1 ring-black/[0.05]">
                  <MapPin className="h-3.5 w-3.5 text-[#0f766e]" strokeWidth={2} />
                  Geocoded map pins
                </li>
                <li className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3.5 py-1.5 text-[12px] font-medium text-neutral-600 ring-1 ring-black/[0.05]">
                  <Layers className="h-3.5 w-3.5 text-[#0f766e]" strokeWidth={2} />
                  Card detail view
                </li>
              </ul>
            </div>

            <div className="min-h-0 min-w-0 flex-1 border-t border-black/[0.05] pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {!searchReady ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[20px] bg-black/[0.025] ring-1 ring-black/[0.05] py-12 lg:min-h-[280px]">
                  <Loader2 className="h-10 w-10 animate-spin text-[#0f766e]" strokeWidth={1.75} />
                  <p className="mt-4 text-[13px] font-medium text-neutral-500">Loading your search defaults…</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f766e]/10 text-[#115e59]">
                        <Filter className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-manrope text-sm font-bold text-[#191c1d]">Search filters</h2>
                        <p className="mt-0.5 text-xs text-[#64748b]">
                          Adjust parameters and refresh. Total count and map pins update from the same query.
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setFilters(defaultFilters)}
                        className="inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white px-4 py-2 text-[13.5px] font-semibold text-neutral-600 shadow-sm transition-[background,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97]"
                      >
                        Reset filters
                      </button>
                      <button
                        type="button"
                        onClick={() => fetchListings()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-full bg-[#0f766e] px-4 py-2 text-[13.5px] font-bold text-white shadow-sm transition-[background,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#115e59] active:scale-[0.97] disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" strokeWidth={2} />
                        )}
                        {loading ? 'Refreshing…' : 'Refresh results'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                <div className="min-w-0 sm:col-span-1">
                  <label className={labelClass}>City</label>
                  <div className={fieldWrap}>
                    <input
                      type="text"
                      value={filters.city}
                      onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                      className={field}
                      placeholder="Austin"
                    />
                  </div>
                </div>
                <div className="w-full min-w-0 sm:max-w-[5.5rem]">
                  <label className={labelClass}>State</label>
                  <div className={fieldWrap}>
                    <input
                      type="text"
                      value={filters.state}
                      onChange={e => setFilters(f => ({ ...f, state: e.target.value.toUpperCase() }))}
                      maxLength={2}
                      className={field}
                      placeholder="TX"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>ZIP</label>
                  <div className={fieldWrap}>
                    <input
                      type="text"
                      value={filters.zipCode}
                      onChange={e => setFilters(f => ({ ...f, zipCode: e.target.value }))}
                      className={field}
                      placeholder="78701"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>Min price</label>
                  <div className={fieldWrap}>
                    <input
                      type="number"
                      min={0}
                      value={filters.minPrice}
                      onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                      className={field}
                      placeholder="$"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>Max price</label>
                  <div className={fieldWrap}>
                    <input
                      type="number"
                      min={0}
                      value={filters.maxPrice}
                      onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                      className={field}
                      placeholder="$"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>Property type</label>
                  <div className={fieldWrap}>
                    <select
                      value={filters.propertyType}
                      onChange={e => setFilters(f => ({ ...f, propertyType: e.target.value }))}
                      className={field}
                    >
                      {PROPERTY_TYPES.map(t => (
                        <option key={t || 'any'} value={t}>
                          {t || 'Any'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>Beds</label>
                  <div className={fieldWrap}>
                    <input
                      type="text"
                      value={filters.bedrooms}
                      onChange={e => setFilters(f => ({ ...f, bedrooms: e.target.value }))}
                      className={field}
                      placeholder="3"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>Baths</label>
                  <div className={fieldWrap}>
                    <input
                      type="text"
                      value={filters.bathrooms}
                      onChange={e => setFilters(f => ({ ...f, bathrooms: e.target.value }))}
                      className={field}
                      placeholder="2"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className={labelClass}>Status</label>
                  <div className={fieldWrap}>
                    <select
                      value={filters.status}
                      onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                      className={field}
                    >
                      {STATUSES.map(s => (
                        <option key={s || 'any'} value={s}>
                          {s || 'Any'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="min-w-0 sm:max-w-[6rem]">
                  <label className={labelClass}>Limit</label>
                  <div className={fieldWrap}>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={filters.limit}
                      onChange={e => setFilters(f => ({ ...f, limit: e.target.value }))}
                      className={field}
                    />
                  </div>
                </div>
                <div className="min-w-0 sm:max-w-[6rem]">
                  <label className={labelClass}>Offset</label>
                  <div className={fieldWrap}>
                    <input
                      type="number"
                      min={0}
                      value={filters.offset}
                      onChange={e => setFilters(f => ({ ...f, offset: e.target.value }))}
                      className={field}
                    />
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {searchReady && (
        <>
          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <div className="mt-10 space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-manrope text-lg font-bold text-[#191c1d]">Results</h2>
                <p className="text-xs text-[#64748b]">
                  Map and grid stay in sync with your current filter set.
                  {totalCount != null && !loading && (
                    <span className="text-[#94a3b8]"> · {totalCount.toLocaleString()} total matches in catalogue</span>
                  )}
                </p>
              </div>
              {loading && (
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#115e59]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating
                </span>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-6 lg:min-h-[520px] lg:flex-row">
              <section
                className="flex min-h-[380px] w-full shrink-0 flex-col lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:min-h-0 lg:w-[42%] lg:max-w-2xl"
                aria-label="Listings map"
              >
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">Map</p>
                <MarketplaceMap listings={listings} />
              </section>

              <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" aria-label="Listing cards">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">Listings</p>
                {loading ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-[20px] bg-black/[0.025] ring-1 ring-black/[0.05] py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-[#0f766e]" strokeWidth={1.75} />
                    <p className="mt-4 text-[13px] font-medium text-neutral-500">Loading listings…</p>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="rounded-[20px] p-[4px] ring-1 ring-black/[0.05] bg-black/[0.025]">
                    <div className="flex flex-col items-center rounded-[16px] bg-white px-6 py-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-12">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f766e]/[0.08] text-[#115e59]">
                        <Store className="h-7 w-7" strokeWidth={1.5} />
                      </div>
                      <h3 className="mt-5 font-manrope text-[17px] font-bold text-neutral-900">No listings match</h3>
                      <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-neutral-500">
                        Broaden price, property type, or location — or reset filters to the default market and try
                        again.
                      </p>
                      <button
                        type="button"
                        onClick={() => setFilters(defaultFilters)}
                        className="group mt-7 inline-flex items-center gap-2 rounded-full bg-brand pl-5 pr-2 py-2 text-[13.5px] font-semibold text-white shadow-[0_2px_12px_rgba(15,118,110,0.22)] transition-[background,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-hover active:scale-[0.97]"
                      >
                        <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
                        Reset to defaults
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-[transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-110">
                          <RefreshCw className="h-3 w-3" strokeWidth={2} />
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="-mr-1 flex-1 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 gap-6 pb-4 xl:grid-cols-2">
                      {listings.map(listing => (
                        <SaleListingCard
                          key={listing.id}
                          listing={listing}
                          distinctImageUrl={listingImageById[listing.id]}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
