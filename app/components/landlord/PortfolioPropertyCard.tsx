import Link from 'next/link'
import { Building2, Hotel, Users } from 'lucide-react'
import { getPropertyImageUrl } from '@/lib/property-image'
import type { Property } from '@/lib/types'
import { cn } from '@/lib/utils'
import CopyApplicationLinkButton from '@/components/landlord/CopyApplicationLinkButton'
import FallbackImage from '@/components/FallbackImage'

function formatPropertyTag(type: string | null | undefined) {
  if (!type) return 'Property'
  const t = type.toLowerCase()
  if (t.includes('single') || t.includes('family')) return 'Single Family'
  if (t.includes('hotel') || t.includes('hospitality')) return 'Hospitality'
  if (t.includes('commercial')) return 'Commercial'
  if (t.includes('residential') || t.includes('multi')) return 'Residential'
  return type.slice(0, 14) || 'Property'
}

function metricLabel(type: string | null | undefined) {
  if (!type) return 'Monthly Rent'
  const t = type.toLowerCase()
  if (t.includes('hospitality') || t.includes('hotel')) return 'Avg. Nightly'
  if (t.includes('commercial') && t.includes('lease')) return 'Monthly Lease'
  return 'Monthly Rent'
}

function unitLabel(property: Property) {
  const t = (property.property_type ?? '').toLowerCase()
  if (t.includes('hospitality') || t.includes('hotel')) {
    return { line1: String(property.unit_count || 4), line2: 'Suites' as const }
  }
  if (t.includes('mixed')) return { line1: 'Mixed', line2: 'Use' as const }
  const n = property.unit_count ?? 1
  return { line1: String(n), line2: n === 1 ? ('Unit' as const) : ('Units' as const) }
}

function TypeIcon({ property }: { property: Property }) {
  const t = (property.property_type ?? '').toLowerCase()
  if (t.includes('hospitality') || t.includes('hotel')) {
    return <Hotel className="h-5 w-5 text-[#94a3b8]" strokeWidth={1.75} />
  }
  if (t.includes('commercial') || t.includes('mixed')) {
    return <Users className="h-5 w-5 text-[#94a3b8]" strokeWidth={1.75} />
  }
  return <Building2 className="h-5 w-5 text-[#94a3b8]" strokeWidth={1.75} />
}

interface Props {
  property: Property
  /** Unique placeholder among siblings when `photo_url` is missing */
  distinctPlaceholderUrl?: string
  /**
   * Dashboard column: cap width and center (taller image + full typography preserved).
   */
  compact?: boolean
  /** Multi-card row: fill grid cell (no max-width clamp). */
  gallery?: boolean
  /** Whether the property has an accepted tenant. */
  occupied?: boolean
}

export default function PortfolioPropertyCard({ property, distinctPlaceholderUrl, compact, gallery, occupied }: Props) {
  const imageSrc =
    (property.photo_url ?? distinctPlaceholderUrl ?? getPropertyImageUrl(property.id)) || undefined
  const tag = formatPropertyTag(property.property_type)
  const secondaryLabel = metricLabel(property.property_type)
  const units = unitLabel(property)
  const addressParts = property.address.split(',').map(s => s.trim())
  const titleLine = addressParts[0] || property.address
  const locationLine =
    addressParts.length > 1 ? addressParts.slice(1).join(', ') : property.property_type ?? ''

  return (
    <article
      className={cn(
        'flex flex-col',
        gallery && 'min-w-0 w-full',
        compact && !gallery && 'mx-auto w-full max-w-[min(100%,248px)] sm:max-w-[min(100%,268px)]'
      )}
    >
      <div className="relative overflow-hidden rounded-[32px] bg-[#f3f4f5] shadow-[0px_12px_24px_rgba(25,28,29,0.06)]">
        <div className="relative h-[288px] w-full">
          {imageSrc ? (
            <FallbackImage
              src={imageSrc}
              alt=""
              className="h-full w-full object-cover"
              fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100/80 to-slate-200/80"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-100/80 to-slate-200/80">
              <Building2 className="h-16 w-16 text-[#94a3b8]/60" strokeWidth={1} />
            </div>
          )}
        </div>
        <div className="absolute right-4 top-4 rounded px-2.5 py-1 backdrop-blur-md bg-white/90">
          <p className="text-[10px] font-bold uppercase leading-[15px] tracking-wide text-[#115e59]">
            {tag}
          </p>
        </div>
        <div className="absolute bottom-[140px] left-4 flex items-center gap-1.5 rounded px-2.5 py-1 backdrop-blur-md bg-white/90">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              occupied ? 'bg-[#0f766e]' : 'bg-[#94a3b8]'
            )}
          />
          <p className={cn(
            'text-[10px] font-bold uppercase leading-[15px] tracking-wide',
            occupied ? 'text-[#115e59]' : 'text-[#64748b]'
          )}>
            {occupied ? 'Occupied' : 'Open'}
          </p>
        </div>
      </div>

      <div className="relative z-[1] -mt-32 px-4 pb-1">
        <div className="rounded-3xl border border-[#f8fafc] bg-white p-[21px] shadow-[0px_20px_40px_rgba(0,0,0,0.08)]">
          <div className="space-y-0.5">
            <h3 className="line-clamp-2 font-manrope text-[18px] font-bold leading-7 text-[#191c1d]">
              {titleLine}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#94a3b8]">
              {locationLine}
            </p>
          </div>

          <div className="mt-4 border-y border-[#f8fafc] py-[13px]">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.45px]">
              <span className="text-[#94a3b8]">Asset Value</span>
              <span className="font-manrope text-[12px] font-bold text-[#0f766e]">
                {property.purchase_price != null && !Number.isNaN(Number(property.purchase_price))
                  ? `$${Number(property.purchase_price).toLocaleString()}`
                  : '—'}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.45px]">
              <span className="text-[#94a3b8]">{secondaryLabel}</span>
              <span className="font-manrope text-[12px] font-bold text-[#191c1d]">
                {property.monthly_rent != null && !Number.isNaN(Number(property.monthly_rent))
                  ? `$${Number(property.monthly_rent).toLocaleString()}`
                  : '—'}
              </span>
            </div>
          </div>

          <div className="mt-4 flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex shrink-0 items-center gap-1.5">
              <TypeIcon property={property} />
              <p className="whitespace-nowrap text-[11px] font-medium leading-[16.5px] text-[#64748b]">
                {units.line1} {units.line2}
              </p>
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
              <Link
                href={`/properties/${property.id}`}
                className={cn(
                  'rounded-lg bg-[rgba(240,253,250,0.9)] px-2 py-2 text-center font-manrope text-[12px] font-bold leading-tight text-[#0f766e] ring-1 ring-[#0f766e]/20 transition hover:bg-[#ccfbf1]/80'
                )}
              >
                View details
              </Link>
              <CopyApplicationLinkButton propertyId={property.id} className="min-w-0" />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
