import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import MarketplacePicksGrid from '@/components/landlord/MarketplacePicksGrid'
import { cn } from '@/lib/utils'
import type { MarketplaceListing } from '@/lib/types'

interface Props {
  listings: MarketplaceListing[]
  personalized?: boolean
  className?: string
}

export default function DashboardMarketplaceRow({ listings, personalized, className }: Props) {
  const top = listings.slice(0, 6)

  return (
    <section aria-labelledby="marketplace-row-heading" className={cn(className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#0f766e]">
            {personalized ? 'Personalized for you' : 'Top by cap rate'}
          </p>
          <h2 id="marketplace-row-heading" className="font-manrope text-[18px] font-bold tracking-[-0.02em] text-neutral-900">
            Marketplace picks
          </h2>
          <p className="mt-1 max-w-md text-[13px] text-neutral-400">
            {personalized
              ? 'Ranked by preferred markets, property type, cap rate, and cash-on-cash.'
              : 'Highest cap-rate listings. Add properties and set preferred markets to get a personalized ranking.'}
          </p>
        </div>
        <Link
          href="/marketplace"
          className="group flex shrink-0 w-fit items-center gap-2 rounded-full border border-black/[0.07] bg-white pl-4 pr-1.5 py-1.5 text-[13px] font-semibold text-neutral-700 shadow-sm transition-[background,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-neutral-50 hover:text-neutral-900 active:scale-[0.97]"
        >
          Browse all
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 transition-[transform,background] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105 group-hover:bg-neutral-200/70">
            <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden />
          </span>
        </Link>
      </div>

      {top.length === 0 ? (
        <div className="mt-6 rounded-[16px] p-[4px] ring-1 ring-black/[0.05] bg-black/[0.025]">
          <div className="flex flex-col items-center rounded-[12px] bg-white px-5 py-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <p className="text-[13px] text-neutral-500">No listings loaded</p>
            <Link href="/marketplace" className="mt-2 text-[13px] font-semibold text-[#0f766e] transition-[color] hover:text-[#115e59]">
              Open marketplace
            </Link>
          </div>
        </div>
      ) : (
        <MarketplacePicksGrid listings={top} className="mt-6" />
      )}
    </section>
  )
}
