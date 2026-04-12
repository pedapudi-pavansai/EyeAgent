import { getPropertyImageUrl } from '@/lib/property-image'
import type { RentCastSaleListing } from '@/lib/types'

interface Props {
  listing: RentCastSaleListing
  distinctImageUrl?: string
}

function formatMoney(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function headline(listing: RentCastSaleListing) {
  return (
    listing.formattedAddress ||
    [listing.addressLine1, listing.addressLine2].filter(Boolean).join(', ') ||
    'Address unavailable'
  )
}

const StatTile = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex flex-col items-center gap-0.5 rounded-xl bg-neutral-50 px-2 py-2.5 ring-1 ring-black/[0.04]">
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{label}</span>
    <span className="font-manrope text-[13px] font-bold tabular-nums text-neutral-800">{value}</span>
  </div>
)

export default function SaleListingCard({ listing, distinctImageUrl }: Props) {
  const sub = [listing.city, listing.state, listing.zipCode].filter(Boolean).join(', ') || null
  const imageSrc = distinctImageUrl ?? getPropertyImageUrl(listing.id)

  return (
    /* Double-bezel outer shell */
    <div className="group rounded-[24px] p-[5px] ring-1 ring-black/[0.05] bg-black/[0.025] transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)] hover:-translate-y-px">
      {/* Inner core */}
      <div className="overflow-hidden rounded-[19px] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.95)]">

        {/* Image area */}
        <div className="relative h-48 overflow-hidden bg-neutral-100">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={headline(listing)}
              className="absolute inset-0 h-full w-full object-cover transition-[transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-50">
              <svg className="h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
              </svg>
            </div>
          )}

          {/* Status badge */}
          {listing.status && (
            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 shadow-sm backdrop-blur-sm">
              {listing.status}
            </span>
          )}

          {/* Price gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-4 pb-3 pt-8">
            <p className="font-manrope text-xl font-bold tabular-nums text-white">
              {formatMoney(listing.price)}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p className="font-manrope text-[14.5px] font-bold leading-snug text-neutral-900">
            {headline(listing)}
          </p>
          {sub && (
            <p className="mt-0.5 text-[12px] text-neutral-400">{sub}</p>
          )}

          {/* Stats grid */}
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            <StatTile label="Beds" value={listing.bedrooms === 0 ? 'Studio' : (listing.bedrooms ?? '—')} />
            <StatTile label="Baths" value={listing.bathrooms ?? '—'} />
            <StatTile label="Sq ft" value={listing.squareFootage != null ? listing.squareFootage.toLocaleString() : '—'} />
            <StatTile label="DOM" value={listing.daysOnMarket != null ? listing.daysOnMarket : '—'} />
          </div>

          {/* Footer meta */}
          <div className="mt-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {listing.propertyType && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
                  {listing.propertyType}
                </span>
              )}
              {listing.yearBuilt != null && (
                <span className="text-[11px] text-neutral-300">Built {listing.yearBuilt}</span>
              )}
            </div>
            {listing.mlsNumber && (
              <span className="text-[11px] text-neutral-300">
                {listing.mlsName ? `${listing.mlsName} ` : 'MLS '}
                {listing.mlsNumber}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
