'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getPropertyImageUrl } from '@/lib/property-image'
import type { Property } from '@/lib/types'

interface Props {
  property: Property
  /** When set (e.g. from dashboard grid), guarantees unique images among siblings */
  distinctPlaceholderUrl?: string
}

export default function PropertyCard({ property, distinctPlaceholderUrl }: Props) {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkError, setLinkError] = useState('')
  const imageSrc =
    property.photo_url ?? distinctPlaceholderUrl ?? getPropertyImageUrl(property.id)

  async function generateApplicationLink() {
    setGenerating(true)
    setLinkError('')
    try {
      const res = await fetch('/api/applications/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: property.id }),
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Failed to generate link')
      setGeneratedUrl(data.url)
    } catch (err) {
      setLinkError('Failed to generate link')
      console.error(err)
    }
    setGenerating(false)
  }

  async function copyLink() {
    if (!generatedUrl) return
    await navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={property.address}
            width={1200}
            height={900}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
          <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
          </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{property.address}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{property.property_type} · {property.unit_count} unit{property.unit_count !== 1 ? 's' : ''}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-gray-900">${property.monthly_rent?.toLocaleString()}/mo</span>
          <span className="text-xs text-gray-400">${property.purchase_price?.toLocaleString()} purchase</span>
        </div>
        <div className="flex gap-2 mt-3">
          <Link
            href={`/properties/${property.id}`}
            className="flex-1 rounded-lg bg-brand-subtle py-1.5 text-center text-sm font-medium text-brand transition hover:bg-teal-100"
          >
            View Details
          </Link>
          <button
            onClick={generateApplicationLink}
            disabled={generating}
            className="flex-1 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition font-medium disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Get App Link'}
          </button>
        </div>

        {linkError && <p className="text-red-500 text-xs mt-2">{linkError}</p>}

        {generatedUrl && (
          <div className="mt-3 flex gap-2 items-center">
            <input
              readOnly
              value={generatedUrl}
              className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 truncate"
            />
            <button
              onClick={copyLink}
              className="whitespace-nowrap rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-hover"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
