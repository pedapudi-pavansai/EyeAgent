import { Building2 } from 'lucide-react'
import type { MarketplaceListing } from '@/lib/types'

const tagConfig: Record<string, { bg: string; text: string; dot: string }> = {
  'Strong Match': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Consider':    { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  'Avoid':       { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400'     },
}

interface Props {
  listings: MarketplaceListing[]
  className?: string
}

function MetricTile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-neutral-50 px-2 py-2 ring-1 ring-black/[0.04]">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{label}</span>
      <span className={`font-manrope text-[13px] font-bold tabular-nums ${accent ? 'text-[#0f766e]' : 'text-neutral-800'}`}>
        {value}
      </span>
    </div>
  )
}

export default function MarketplacePicksGrid({ listings, className = '' }: Props) {
  if (!listings.length) return null

  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {listings.map(listing => {
        const tag = listing.ai_tag ? tagConfig[listing.ai_tag] : null

        return (
          /* Double-bezel outer shell */
          <div
            key={listing.id}
            className="group rounded-[20px] p-[4px] ring-1 ring-black/[0.05] bg-black/[0.025] transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-px"
          >
            {/* Inner core */}
            <div className="overflow-hidden rounded-[16px] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">

              {/* Image */}
              <div className="relative h-28 overflow-hidden bg-gradient-to-br from-neutral-100 to-teal-50/60">
                {listing.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.photo_url}
                    alt=""
                    className="h-full w-full object-cover transition-[transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-300">
                    <Building2 className="h-9 w-9" strokeWidth={1} />
                  </div>
                )}

                {tag && (
                  <span className={`absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full ${tag.bg} px-2.5 py-1 text-[10px] font-semibold ${tag.text} backdrop-blur-sm`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${tag.dot}`} aria-hidden />
                    {listing.ai_tag}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate font-manrope text-[13.5px] font-bold leading-snug text-neutral-900">
                    {listing.address}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-neutral-400">{listing.city}</p>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <MetricTile label="Price" value={`$${(listing.price / 1000).toFixed(0)}k`} />
                  <MetricTile label="Cap" value={`${listing.cap_rate}%`} accent />
                  <MetricTile label="CoC" value={`${listing.cash_on_cash}%`} />
                </div>

                <p className="mt-2.5 text-[11px] text-neutral-400">
                  {listing.property_type} · {listing.bedrooms} bed
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
