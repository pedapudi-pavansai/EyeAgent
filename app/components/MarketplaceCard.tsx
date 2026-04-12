import { getPropertyImageUrl } from '@/lib/property-image'
import type { MarketplaceListing } from '@/lib/types'

interface Props {
  listing: MarketplaceListing
  distinctPlaceholderUrl?: string
}

const tagColors: Record<string, string> = {
  'Strong Match': 'bg-green-100 text-green-800',
  'Consider': 'bg-yellow-100 text-yellow-800',
  'Avoid': 'bg-red-100 text-red-800',
}

export default function MarketplaceCard({ listing, distinctPlaceholderUrl }: Props) {
  const imageSrc =
    listing.photo_url ?? distinctPlaceholderUrl ?? getPropertyImageUrl(listing.id)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={listing.address}
            width={1200}
            height={900}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
          <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
          </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{listing.address}</p>
            <p className="text-xs text-gray-500">{listing.city}</p>
          </div>
          {listing.ai_tag && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagColors[listing.ai_tag] || 'bg-gray-100 text-gray-700'}`}>
              {listing.ai_tag}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-sm font-bold text-gray-900">${(listing.price / 1000).toFixed(0)}k</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Cap Rate</p>
            <p className="text-sm font-bold text-gray-900">{listing.cap_rate}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">CoC</p>
            <p className="text-sm font-bold text-gray-900">{listing.cash_on_cash}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500">{listing.property_type}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{listing.bedrooms} bed</span>
        </div>
        {listing.ai_thesis && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{listing.ai_thesis}</p>
        )}
        {listing.external_url && (
          <a
            href={listing.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-xs text-brand hover:underline"
          >
            View Listing →
          </a>
        )}
      </div>
    </div>
  )
}
