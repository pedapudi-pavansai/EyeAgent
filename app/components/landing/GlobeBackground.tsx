'use client'

import type { CSSProperties } from 'react'
import { GlobePulse } from './GlobePulse'

/**
 * Reference globe at scale `1`. The canvas stays a square (same globe proportions — only the display size changes).
 */
export const GLOBE_BASE = {
  columnWidthPercent: 52,
  minColumnPx: 320,
  sizeVh: 100,
  sizeVw: 110,
  /** Optional max edge length (px) on huge screens; height is not limited by `100vh`. */
  maxSizePx: 1290,
  /** Viewport-relative push past the right edge; scaled with `GLOBE_SCALE`. */
  bleedRightPercent: 18,
  spotlightPrimary: { xPercent: 88, yPercent: 55 },
  spotlightSecondary: { xPercent: 78, yPercent: 48 },
} as const

/**
 * Single knob: increase to make the globe larger **and** shift it right in the same proportion
 * (bleed / column width scale together so it doesn’t crowd the copy).
 */
export const GLOBE_SCALE = 1.25

function buildGlobeLayout(scale: number) {
  const s = scale
  const b = GLOBE_BASE
  /** Spotlight centers drift slightly right as the globe grows + moves. */
  const spotShift = (s - 1) * 28
  return {
    columnWidthPercent: Math.min(72, b.columnWidthPercent * s),
    minColumnPx: b.minColumnPx,
    sizeVh: b.sizeVh * s,
    sizeVw: b.sizeVw * s,
    maxSizePx: b.maxSizePx * s,
    bleedRightPercent: b.bleedRightPercent * s,
    spotlightPrimary: {
      xPercent: b.spotlightPrimary.xPercent + spotShift,
      yPercent: b.spotlightPrimary.yPercent,
    },
    spotlightSecondary: {
      xPercent: b.spotlightSecondary.xPercent + spotShift,
      yPercent: b.spotlightSecondary.yPercent,
    },
  }
}

/** Resolved sizes for the current `GLOBE_SCALE` (use in styles). */
export const GLOBE_BACKGROUND_LAYOUT = buildGlobeLayout(GLOBE_SCALE)

export function GlobeBackground() {
  const L = GLOBE_BACKGROUND_LAYOUT

  const columnVars = {
    '--globe-column-width': `${L.columnWidthPercent}%`,
    '--globe-min-column': `${L.minColumnPx}px`,
  } as CSSProperties

  /** One expression for both sides so the globe stays square; can exceed `100vh` when scale is up. */
  const side = `min(${L.sizeVh}vh, ${L.sizeVw}vw, ${L.maxSizePx}px)`
  const globeBoxStyle: CSSProperties = {
    width: side,
    height: side,
    marginRight: `-${L.bleedRightPercent}vw`,
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[linear-gradient(to_right,#ffffff_0%,#ffffff_10%,#fafafa_18%,#f0f0f0_24%,#e0e0e0_30%,#c9c9c9_38%,#a3a3a3_46%,#787878_52%,#5a5a5a_58%,#404040_64%,#2a2a2a_70%,#1a1a1a_76%,#0f0f0f_82%,#080808_88%,#030303_94%,#000000_100%)]"
      aria-hidden
    >
      {/* Right ~half: cobe globe reads against near-black so it doesn’t float on white. */}
      <div
        className="absolute inset-y-0 right-0 flex w-full items-center justify-end md:w-[var(--globe-column-width)] md:min-w-[var(--globe-min-column)]"
        style={columnVars}
      >
        <div className="pointer-events-auto flex items-center justify-center" style={globeBoxStyle}>
          <GlobePulse className="h-full w-full" />
        </div>
      </div>
      {/* Subtle brand tint on the globe side only */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 85% 90% at ${L.spotlightPrimary.xPercent}% ${L.spotlightPrimary.yPercent}%, rgba(15,118,110,0.14), transparent 52%)`,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 55% 70% at ${L.spotlightSecondary.xPercent}% ${L.spotlightSecondary.yPercent}%, rgba(15,118,110,0.08), transparent 48%)`,
        }}
        aria-hidden
      />
    </div>
  )
}
