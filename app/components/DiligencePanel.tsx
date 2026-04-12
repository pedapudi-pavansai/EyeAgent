'use client'

import Link from 'next/link'
import type { Application } from '@/lib/types'

interface EnrichedApplication extends Application {
  property_address?: string
}

interface Props {
  applications: EnrichedApplication[]
}

function ScoreChip({ score }: { score?: number }) {
  if (score == null) return <span className="text-xs text-gray-400 italic">No score</span>
  const color =
    score >= 75 ? 'text-green-700 bg-green-50' : score >= 50 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{score}/100</span>
  )
}

function DiligenceBadge({ s }: { s?: string }) {
  const status = s || 'none'
  const map: Record<string, string> = {
    none: 'bg-gray-100 text-gray-600',
    queued: 'bg-amber-100 text-amber-900',
    running: 'bg-teal-100 text-teal-800',
    complete: 'bg-emerald-100 text-emerald-900',
    failed: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.none}`}>
      Diligence: {status}
    </span>
  )
}

/** Dashboard preview: top applicants by fast score, then recency. */
export default function DiligencePanel({ applications }: Props) {
  if (applications.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">
        No applicants yet. Share an application link from a property card to get started.
      </p>
    )
  }

  const sorted = [...applications].sort((a, b) => {
    const as = a.ai_score ?? -1
    const bs = b.ai_score ?? -1
    if (bs !== as) return bs - as
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  })
  const top = sorted.slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {top.map(app => (
          <div
            key={app.id}
            className="flex flex-wrap items-center gap-3 bg-neutral-50 ring-1 ring-black/[0.05] rounded-xl px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{app.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{app.property_address}</p>
            </div>
            <ScoreChip score={app.ai_score} />
            <DiligenceBadge s={app.diligence_status} />
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-1">
        <Link
          href="/diligence"
          className="text-sm font-medium text-brand hover:text-brand-foreground"
        >
          View all applicants →
        </Link>
      </div>
    </div>
  )
}
