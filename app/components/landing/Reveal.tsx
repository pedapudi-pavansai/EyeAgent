'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  delay?: number
  className?: string
  /** Slide direction on entrance. Default: 'up' (standard fade-up). */
  direction?: 'up' | 'left' | 'right'
  /**
   * When true, also fades the element out (upward) as it scrolls above the
   * viewport. Default: false — element stays visible once revealed.
   */
  exit?: boolean
}

/**
 * Wraps children in a blur-fade reveal driven by IntersectionObserver.
 * GPU-safe: only animates `transform`, `opacity`, and `filter`.
 */
export function Reveal({ children, delay = 0, className = '', direction = 'up', exit = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.classList.add('reveal-start')
    if (direction !== 'up') el.dataset.dir = direction
    if (delay) el.style.transitionDelay = `${delay}ms`

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove('is-exiting')
          el.classList.add('is-visible')
          if (!exit) obs.unobserve(el)
        } else if (exit) {
          el.classList.remove('is-visible')
          // Only add exit class when element has scrolled ABOVE the viewport
          if (entry.boundingClientRect.top < 0) {
            el.classList.add('is-exiting')
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay, direction, exit])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
