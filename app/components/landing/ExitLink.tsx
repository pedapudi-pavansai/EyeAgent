'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'

type LinkProps = ComponentPropsWithoutRef<typeof Link>

const DURATION = 380

/**
 * Drop-in replacement for Next.js Link.
 * On click, directly transitions #page-root to opacity 0 + blur + translateY,
 * then navigates after the transition completes.
 */
export function ExitLink({ href, onClick, children, ...props }: LinkProps) {
  const router = useRouter()

  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        const target =
          typeof href === 'string'
            ? href
            : (href as { pathname?: string }).pathname ?? ''

        if (target.startsWith('/')) {
          e.preventDefault()
          onClick?.(e)

          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          const root = document.getElementById('page-root')

          if (root && !reduced) {
            const easing = 'cubic-bezier(0.32, 0.72, 0, 1)'
            root.style.transition = [
              `opacity ${DURATION}ms ${easing}`,
              `transform ${DURATION}ms ${easing}`,
              `filter ${DURATION}ms ${easing}`,
            ].join(', ')
            // Force a reflow so the browser sees the transition start point
            root.getBoundingClientRect()
            root.style.opacity = '0'
            root.style.transform = 'translateY(-20px)'
            root.style.filter = 'blur(10px)'
            root.style.pointerEvents = 'none'
          }

          setTimeout(() => router.push(target), reduced ? 0 : DURATION)
        } else {
          onClick?.(e)
        }
      }}
    >
      {children}
    </Link>
  )
}
