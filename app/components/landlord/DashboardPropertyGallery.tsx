'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PortfolioPropertyCard from '@/components/landlord/PortfolioPropertyCard'
import type { Property } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface DashboardGalleryItem {
  property: Property
  distinctPlaceholderUrl?: string
  appCount: number
  occupied: boolean
}

function useItemsPerView() {
  const [n, setN] = useState(3)

  const update = useCallback(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200
    if (w < 520) setN(1)
    else if (w < 860) setN(2)
    else setN(3)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  return n
}

function GalleryGrid({
  columns,
  children,
  flex1,
}: {
  columns: number
  children: ReactNode
  flex1?: boolean
}) {
  return (
    <div
      className={cn(
        'grid min-h-0 min-w-0 w-full gap-2 sm:gap-3 md:gap-4',
        flex1 && 'flex-1'
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  )
}

export default function DashboardPropertyGallery({ items }: { items: DashboardGalleryItem[] }) {
  const itemsPerView = useItemsPerView()
  const [start, setStart] = useState(0)

  /** More than 3 → carousel; 3 or fewer → fill row with equal-width columns */
  const isCarousel = items.length > 3

  const maxStart = Math.max(0, items.length - itemsPerView)

  useEffect(() => {
    setStart(s => Math.min(s, maxStart))
  }, [maxStart, items.length, itemsPerView])

  const visible = useMemo(() => {
    if (!isCarousel) return items
    return items.slice(start, start + itemsPerView)
  }, [items, start, itemsPerView, isCarousel])

  const showArrows = isCarousel && items.length > itemsPerView

  const canPrev = start > 0
  const canNext = start < maxStart

  const goPrev = () => {
    if (canPrev) setStart(s => Math.max(0, s - 1))
  }

  const goNext = () => {
    if (canNext) setStart(s => Math.min(maxStart, s + 1))
  }

  /** Column count: fill space when ≤3 items; otherwise match carousel window */
  const columnCount = isCarousel ? itemsPerView : Math.max(1, items.length)

  const cells = visible.map(({ property, distinctPlaceholderUrl, appCount, occupied }) => (
    <div key={property.id} className="relative min-w-0">
      {appCount > 0 && (
        <span className="absolute -top-2 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white sm:-right-2">
          {appCount}
        </span>
      )}
      <PortfolioPropertyCard
        property={property}
        distinctPlaceholderUrl={distinctPlaceholderUrl}
        gallery
        occupied={occupied}
      />
    </div>
  ))

  const grid = (
    <GalleryGrid columns={columnCount} flex1={showArrows}>
      {cells}
    </GalleryGrid>
  )

  return (
    <div
      className="relative mt-4 sm:mt-6"
      role="region"
      aria-roledescription={isCarousel ? 'carousel' : undefined}
      aria-label="Property portfolio"
    >
      {showArrows ? (
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canPrev}
            aria-label="Previous properties"
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#115e59] ring-1 ring-black/[0.07] shadow-sm transition-[background,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] sm:h-10 sm:w-10',
              'hover:bg-[#f8fafc] disabled:pointer-events-none disabled:opacity-30'
            )}
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </button>
          {grid}
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            aria-label="Next properties"
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#115e59] ring-1 ring-black/[0.07] shadow-sm transition-[background,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] sm:h-10 sm:w-10',
              'hover:bg-[#f8fafc] disabled:pointer-events-none disabled:opacity-30'
            )}
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </button>
        </div>
      ) : (
        grid
      )}

      {showArrows && (
        <p className="mt-3 text-center text-[11px] text-[#94a3b8] sm:text-xs">
          Showing {start + 1}–{Math.min(start + itemsPerView, items.length)} of {items.length}
        </p>
      )}
    </div>
  )
}
