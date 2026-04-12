'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Wraps the landing page. Intercepts every internal <a> click in the
 * capture phase (before Next.js Link's own handler), fades the page out,
 * then navigates. No per-link wrapper needed.
 */
export function PageFade({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [exiting, setExiting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href') ?? ''
      if (!href.startsWith('/')) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      e.preventDefault() // stops Next.js Link's own navigation

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!reduced) setExiting(true)
      setTimeout(() => router.push(href), reduced ? 0 : 370)
    }

    // Capture = fires before any child handlers, including Next.js Link
    el.addEventListener('click', handleClick, { capture: true })
    return () => el.removeEventListener('click', handleClick, { capture: true })
  }, [router])

  return (
    <div
      ref={ref}
      style={{
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateY(-20px)' : 'translateY(0)',
        filter: exiting ? 'blur(10px)' : 'blur(0)',
        transition: [
          'opacity 370ms cubic-bezier(0.32, 0.72, 0, 1)',
          'transform 370ms cubic-bezier(0.32, 0.72, 0, 1)',
          'filter 370ms cubic-bezier(0.32, 0.72, 0, 1)',
        ].join(', '),
        pointerEvents: exiting ? 'none' : undefined,
      }}
    >
      {children}
    </div>
  )
}
