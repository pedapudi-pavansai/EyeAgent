'use client'

import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { GlobeBackground } from './GlobeBackground'

export interface LandingHeroProps {
  brandName?: string
  heroTitle?: string
  heroDescription?: string
}

export function LandingHero({
  brandName = 'Keystone',
  heroTitle = 'Property management that scales with you',
  heroDescription =
    'Clear screening, serious diligence, and a portfolio view that fits how you actually work. No enterprise baggage, no guesswork.',
}: LandingHeroProps) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-transparent text-neutral-900">
      <GlobeBackground />

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-4 sm:px-6 lg:px-10 xl:px-14">

        {/* ── Floating island nav ── */}
        <header className="relative shrink-0 pt-6 sm:pt-7">

          {/* Wordmark only — CTAs live in the hero below */}
          <Link
            href="/"
            className="nav-reveal inline-block font-manrope text-[14px] font-bold tracking-[0.3em] text-neutral-900 transition-[color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#0f766e] sm:text-[15px] sm:tracking-[0.32em]"
            style={{ animationDelay: '0s' }}
          >
            {brandName.toUpperCase()}
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center pb-12 pt-8 sm:pb-16 lg:max-w-[min(44rem,48vw)] lg:pb-20 lg:pt-0 xl:max-w-[min(46rem,44vw)]">

          <h1
            className="hero-reveal font-manrope text-[2.25rem] font-bold leading-[1.1] tracking-[-0.03em] text-neutral-900 sm:text-[3.25rem] sm:leading-[1.07] lg:text-[3.75rem] lg:leading-[1.04]"
            style={{ animationDelay: '0.12s' }}
          >
            {heroTitle}
          </h1>

          <p
            className="hero-reveal mt-6 max-w-lg text-[1.0625rem] leading-[1.7] text-neutral-500 sm:text-lg lg:text-[1.125rem]"
            style={{ animationDelay: '0.22s' }}
          >
            {heroDescription}
          </p>

          <div
            className="hero-reveal mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5"
            style={{ animationDelay: '0.34s' }}
          >
            {/* Button-in-button primary CTA — Link for page transition */}
            <Link
              href="/register"
              className="group flex items-center gap-2.5 rounded-full bg-brand pl-6 pr-2 py-2 text-[15px] font-semibold text-white shadow-[0_2px_12px_rgba(15,118,110,0.28)] transition-[background,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-hover hover:shadow-[0_4px_24px_rgba(15,118,110,0.38)] active:scale-[0.97]"
            >
              Get started free
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-[transform,background] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110 group-hover:bg-white/15">
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
            </Link>

            <Link
              href="/login"
              className="text-[15px] font-medium text-neutral-400 transition-[color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-neutral-700"
            >
              Sign in
            </Link>
          </div>
        </main>

        {/* ── Scroll cue — refined pulse, waits for hero to finish ── */}
        <div
          className="hero-reveal flex shrink-0 justify-center pb-8 pt-2"
          style={{ animationDelay: '0.5s' }}
        >
          <button
            type="button"
            className="flex flex-col items-center gap-1.5 text-neutral-400 transition-[color] duration-200 hover:text-neutral-600"
            aria-label="Scroll down"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            <ChevronDown className="scroll-cue-animate h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

      </div>
    </div>
  )
}
