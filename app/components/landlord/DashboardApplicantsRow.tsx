import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types'
import ProfileAvatar from '@/components/ProfileAvatar'

type Enriched = Application & { property_address: string }

interface Props {
  applications: Enriched[]
  compact?: boolean
}

function sortByRank(apps: Enriched[]): Enriched[] {
  const open = apps.filter(a => a.status === 'pending' || a.status === 'under_review')
  return [...open].sort((a, b) => {
    const sa = a.ai_score
    const sb = b.ai_score
    if (sa != null && sb != null && sa !== sb) return sb - sa
    if (sa != null && sb == null) return -1
    if (sa == null && sb != null) return 1
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  })
}

function ScoreChip({ score }: { score?: number }) {
  if (score == null) return <span className="text-[11px] text-neutral-300">—</span>
  const color = score >= 75 ? 'text-[#0f766e] bg-emerald-50' : score >= 50 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 font-manrope text-[11px] font-bold tabular-nums ${color}`}>
      {score}
    </span>
  )
}

export default function DashboardApplicantsRow({ applications, compact }: Props) {
  const ranked = sortByRank(applications)
  const top = ranked.slice(0, compact ? 4 : 5)

  return (
    <section aria-labelledby="applicants-row-heading" className="min-w-0">
      <div className={cn('flex flex-col', compact ? 'gap-3' : 'gap-5 sm:flex-row sm:items-start sm:justify-between')}>
        <div className="min-w-0">
          <h2
            id="applicants-row-heading"
            className={cn('font-manrope font-bold text-neutral-900', compact ? 'text-[15px]' : 'text-[18px]')}
          >
            Applicant pipeline
          </h2>
          <p className={cn('mt-0.5 text-neutral-400', compact ? 'text-[12px] leading-relaxed' : 'text-[13.5px]')}>
            Open applications, ranked by AI score.
          </p>
        </div>
        <Link
          href="/diligence"
          className={cn(
            'group flex shrink-0 items-center gap-2 rounded-full bg-brand pl-4 pr-1.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_2px_12px_rgba(15,118,110,0.22)] transition-[background,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-hover active:scale-[0.97]',
            compact && 'self-start'
          )}
        >
          Open diligence
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-[transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
            <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden />
          </span>
        </Link>
      </div>

      {top.length === 0 ? (
        /* Empty state — double-bezel */
        <div className={cn('rounded-[16px] p-[4px] ring-1 ring-black/[0.05] bg-black/[0.025]', compact ? 'mt-4' : 'mt-6')}>
          <div className="flex flex-col items-center rounded-[12px] bg-white px-4 py-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <p className="text-[13px] font-medium text-neutral-500">No open applications</p>
            <p className="mt-1 text-[12px] text-neutral-400 text-balance">
              Applicants will appear here ranked by score.
            </p>
          </div>
        </div>
      ) : (
        /* Table — double-bezel */
        <div className={cn('rounded-[16px] p-[4px] ring-1 ring-black/[0.05] bg-black/[0.025]', compact ? 'mt-4' : 'mt-6')}>
          <div className="overflow-hidden rounded-[12px] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80">
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">#</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Applicant</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Score</th>
                </tr>
              </thead>
              <tbody>
                {top.map((app, i) => (
                  <tr key={app.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-[background] duration-150">
                    <td className="px-4 py-3">
                      <span className="font-manrope text-[13px] font-bold text-[#0f766e]">{i + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <ProfileAvatar variant="tenant" size="sm" alt="" className="h-8 w-8 ring-2 ring-neutral-100" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-neutral-900">{app.full_name}</p>
                          <p className="truncate text-[11px] text-neutral-400">{app.property_address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreChip score={app.ai_score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
