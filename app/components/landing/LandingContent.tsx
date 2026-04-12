import Link from 'next/link'
import { ArrowRight, Building2, Compass, FileCheck2, MessageSquare } from 'lucide-react'
import { Reveal } from './Reveal'

const stats = [
  { value: '3,400+', label: 'units tracked' },
  { value: '47 min', label: 'saved per applicant' },
  { value: '94%', label: 'landlord satisfaction' },
  { value: '12', label: 'active markets' },
]

function BentoCard({
  icon: Icon,
  title,
  body,
  accent = false,
  className = '',
}: {
  icon: typeof FileCheck2
  title: string
  body: string
  accent?: boolean
  className?: string
}) {
  return (
    <div
      className={[
        'rounded-[28px] p-[5px] ring-1',
        'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5',
        accent ? 'bg-[#0a1512] ring-white/[0.08]' : 'bg-black/[0.03] ring-black/[0.05]',
        className,
      ].join(' ')}
    >
      <div
        className={[
          'h-full rounded-[23px] p-7',
          accent
            ? 'bg-[#0e1f18] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
            : 'bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]',
        ].join(' ')}
      >
        <div
          className={[
            'mb-5 flex h-10 w-10 items-center justify-center rounded-xl',
            accent ? 'bg-[#0f766e]/20' : 'bg-[rgba(15,118,110,0.08)]',
          ].join(' ')}
        >
          <Icon
            className={accent ? 'h-5 w-5 text-[#4ade80]' : 'h-5 w-5 text-[#0f766e]'}
            strokeWidth={1.5}
          />
        </div>
        <h3
          className={[
            'font-manrope text-[1.0625rem] font-bold leading-snug',
            accent ? 'text-white' : 'text-neutral-900',
          ].join(' ')}
        >
          {title}
        </h3>
        <p
          className={[
            'mt-2.5 text-[14px] leading-relaxed text-pretty',
            accent ? 'text-white/50' : 'text-neutral-500',
          ].join(' ')}
        >
          {body}
        </p>
      </div>
    </div>
  )
}

export function LandingContent() {
  return (
    <>
      {/* ── Stats strip ── */}
      <section aria-label="Platform statistics" className="border-y border-neutral-100 bg-white py-14 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map(({ value, label }, i) => (
            <Reveal key={label} delay={i * 70} exit>
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="font-manrope text-[2rem] font-bold tabular-nums tracking-tight text-[#0f766e]">
                  {value}
                </span>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                  {label}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Features bento ── */}
      <section className="bg-[#f8f9fa] px-4 py-24 sm:px-6 lg:py-32">
        <div className="mx-auto max-w-5xl">

          <Reveal>
            <div className="mb-14">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#0f766e]">
                What you get
              </p>
              <h2 className="font-manrope text-[2.25rem] font-bold leading-[1.1] tracking-[-0.025em] text-neutral-900 sm:text-[2.75rem]">
                Everything independent landlords actually need
              </h2>
            </div>
          </Reveal>

          {/*
            Asymmetric bento — 12-column grid, 2 rows:
            Row 1: [AI Screening - 7 cols] [Portfolio - 5 cols, row-span-2]
            Row 2: [Marketplace - 5 cols] [Stat tile - 2 cols]
            Directional reveals add depth — cards enter from their natural side.
          */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:grid-rows-[auto_auto]">

            <Reveal className="md:col-span-7 md:row-start-1" direction="right" delay={0}>
              <BentoCard
                icon={FileCheck2}
                title="AI tenant screening"
                body="Every application gets an instant risk score. Run full diligence with one click — structured report, AI synthesis, delivered in minutes."
              />
            </Reveal>

            <Reveal className="md:col-span-5 md:row-start-1 md:row-end-3" direction="left" delay={80}>
              <BentoCard
                icon={Building2}
                title="Portfolio at a glance"
                body="See all your properties, occupancy status, asset value, and monthly rent in one gallery. No spreadsheets. No reconciliation. Just the numbers you care about, always current."
                accent
                className="h-full"
              />
            </Reveal>

            <Reveal className="md:col-span-5 md:row-start-2" direction="right" delay={60}>
              <BentoCard
                icon={Compass}
                title="Personalized marketplace"
                body="Properties ranked by cap rate and cash-on-cash. Tailored to your preferred markets and price range automatically."
              />
            </Reveal>

            <Reveal className="md:col-span-2 md:row-start-2" delay={120}>
              <div className="rounded-[28px] p-[5px] ring-1 ring-black/[0.05] bg-black/[0.03] h-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5">
                <div className="flex h-full flex-col items-center justify-center rounded-[23px] bg-white px-4 py-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <span className="font-manrope text-[2.25rem] font-bold tabular-nums leading-none tracking-tight text-[#0f766e]">
                    2 min
                  </span>
                  <span className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    avg. screening
                  </span>
                </div>
              </div>
            </Reveal>

          </div>

          {/* Full-width horizontal feature card */}
          <Reveal className="mt-3" delay={140}>
            <div className="rounded-[28px] p-[5px] ring-1 ring-black/[0.05] bg-black/[0.03] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
              <div className="rounded-[23px] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                <div className="flex flex-col items-start gap-5 px-7 py-7 sm:flex-row sm:items-center sm:gap-10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(15,118,110,0.08)]">
                    <MessageSquare className="h-5 w-5 text-[#0f766e]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-manrope text-[1.0625rem] font-bold text-neutral-900">
                      Tenant portal built-in
                    </h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">
                      Tenants submit service requests directly. You stay informed without the back-and-forth texts and calls.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    Included free
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#0a1512] px-4 py-32 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">

          <Reveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0f766e]" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                Free to start
              </span>
            </div>
            <h2 className="font-manrope text-[2.25rem] font-bold leading-[1.1] tracking-[-0.025em] text-white sm:text-[2.75rem]">
              Start managing your portfolio today
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-[1.7] text-white/40">
              No credit card. No enterprise setup. Add your first property in under three minutes.
            </p>
          </Reveal>

          <Reveal delay={100} className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="group flex items-center gap-2.5 rounded-full bg-[#0f766e] pl-6 pr-2 py-2 text-[15px] font-semibold text-white shadow-[0_2px_20px_rgba(15,118,110,0.4)] transition-[background,box-shadow,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#115e59] hover:shadow-[0_4px_32px_rgba(15,118,110,0.5)] active:scale-[0.97]"
            >
              Get started free
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-[transform,background] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-110 group-hover:bg-white/20">
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
            </Link>
            <Link
              href="/login"
              className="text-[15px] font-medium text-white/35 transition-[color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white/65"
            >
              Sign in to your account
            </Link>
          </Reveal>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0a1512] border-t border-white/[0.05] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-manrope text-[13px] font-bold tracking-[0.3em] text-white/30">
            KEYSTONE
          </span>
          <div className="flex items-center gap-6 text-[13px] text-white/25">
            <Link href="#" className="transition-[color] duration-200 hover:text-white/50">
              Privacy policy
            </Link>
            <Link href="#" className="transition-[color] duration-200 hover:text-white/50">
              Terms of service
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}
