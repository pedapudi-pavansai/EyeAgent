'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, X } from 'lucide-react'
import type { Application, DiligenceStatus } from '@/lib/types'
import ProfileAvatar from '@/components/ProfileAvatar'

interface EnrichedApplication extends Application {
  property_address?: string
}

/* ── Status helpers ── */

const appStatusConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending:      { label: 'Pending',      dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50' },
  under_review: { label: 'Under review', dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50'  },
  accepted:     { label: 'Accepted',     dot: 'bg-emerald-500',text: 'text-emerald-700',bg: 'bg-emerald-50'},
  rejected:     { label: 'Rejected',     dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50'   },
}

const diligenceConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  none:     { label: 'Not run',  dot: 'bg-neutral-300', text: 'text-neutral-500', bg: 'bg-neutral-100' },
  queued:   { label: 'Queued',   dot: 'bg-amber-400',   text: 'text-amber-700',  bg: 'bg-amber-50'    },
  running:  { label: 'Running',  dot: 'bg-[#0f766e]',   text: 'text-[#0f766e]',  bg: 'bg-teal-50'     },
  complete: { label: 'Complete', dot: 'bg-emerald-500', text: 'text-emerald-700',bg: 'bg-emerald-50'  },
  failed:   { label: 'Failed',   dot: 'bg-red-400',     text: 'text-red-700',    bg: 'bg-red-50'      },
}

function StatusPill({ config }: { config: { label: string; dot: string; text: string; bg: string } }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden />
      {config.label}
    </span>
  )
}

function ScoreRing({ score }: { score?: number }) {
  if (score == null) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 ring-2 ring-neutral-200/60">
        <span className="text-[10px] font-semibold text-neutral-400">—</span>
      </div>
    )
  }
  const color = score >= 75 ? '#0f766e' : score >= 50 ? '#d97706' : '#dc2626'
  const ringColor = score >= 75 ? 'ring-emerald-200' : score >= 50 ? 'ring-amber-200' : 'ring-red-200'
  const bg = score >= 75 ? 'bg-emerald-50' : score >= 50 ? 'bg-amber-50' : 'bg-red-50'
  return (
    <div className={`flex h-12 w-12 flex-col items-center justify-center rounded-full ${bg} ring-2 ${ringColor}`}>
      <span className="font-manrope text-[13px] font-bold tabular-nums leading-none" style={{ color }}>
        {score}
      </span>
      <span className="text-[8px] font-medium text-neutral-400">/ 100</span>
    </div>
  )
}

/* ── Double-bezel select ── */
function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{label}</span>
      <div className="rounded-xl p-[3px] ring-1 ring-black/[0.07] bg-neutral-100/60">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-[9px] bg-white px-3 py-2 text-[13.5px] text-neutral-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[box-shadow] duration-200 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.04),0_0_0_3px_rgba(15,118,110,0.15)]"
        >
          {children}
        </select>
      </div>
    </label>
  )
}

interface Props {
  initialApplications: EnrichedApplication[]
}

type AcceptNotice =
  | { error: string }
  | { inviteSent: boolean; inviteEmail?: string; inviteUrl?: string }

export default function DiligenceList({ initialApplications }: Props) {
  const [apps, setApps] = useState(initialApplications)
  const [scoringId, setScoringId] = useState<string | null>(null)
  const [diligenceLoading, setDiligenceLoading] = useState<string | null>(null)
  const [diligenceError, setDiligenceError] = useState<string | null>(null)
  const [acceptNoticeByApp, setAcceptNoticeByApp] = useState<Record<string, AcceptNotice | undefined>>({})
  const [diligenceInviteCopiedId, setDiligenceInviteCopiedId] = useState<string | null>(null)
  const [filterProperty, setFilterProperty] = useState<string>('all')
  const [filterAppStatus, setFilterAppStatus] = useState<string>('all')
  const [filterDiligence, setFilterDiligence] = useState<string>('all')

  const propertyOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const a of apps) {
      if (a.property_id && a.property_address) m.set(a.property_id, a.property_address)
    }
    return [...m.entries()]
  }, [apps])

  const refresh = useCallback(async () => {
    const res = await fetch('/api/landlord/applications')
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data.applications)) setApps(data.applications)
  }, [])

  const needsPoll = useMemo(
    () => apps.some(a => a.diligence_status === 'queued' || a.diligence_status === 'running'),
    [apps]
  )

  const anyInFlight = useMemo(
    () => diligenceLoading !== null || apps.some(a => a.diligence_status === 'queued' || a.diligence_status === 'running'),
    [apps, diligenceLoading]
  )

  useEffect(() => {
    if (!needsPoll) return
    const t = setInterval(refresh, 4000)
    return () => clearInterval(t)
  }, [needsPoll, refresh])

  const filtered = useMemo(() => {
    return apps.filter(a => {
      if (filterProperty !== 'all' && a.property_id !== filterProperty) return false
      if (filterAppStatus !== 'all' && a.status !== filterAppStatus) return false
      const d = (a.diligence_status || 'none') as DiligenceStatus
      if (filterDiligence === 'complete' && d !== 'complete') return false
      if (filterDiligence === 'not_run' && (d === 'complete' || d === 'queued' || d === 'running')) return false
      if (filterDiligence === 'in_progress' && d !== 'queued' && d !== 'running') return false
      if (filterDiligence === 'failed' && d !== 'failed') return false
      return true
    })
  }, [apps, filterProperty, filterAppStatus, filterDiligence])

  async function runFastScore(appId: string) {
    setScoringId(appId)
    await fetch('/api/ai/score-applicant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: appId }),
    })
    await refresh()
    setScoringId(null)
  }

  async function runDiligence(appId: string) {
    setDiligenceError(null)
    setDiligenceLoading(appId)
    const res = await fetch('/api/diligence/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: appId }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setDiligenceError(body.error || 'Could not start diligence')
      setDiligenceLoading(null)
      return
    }
    await refresh()
    setDiligenceLoading(null)
  }

  async function handleDecision(appId: string, decision: 'accepted' | 'rejected', applicantId?: string) {
    setAcceptNoticeByApp(prev => {
      const next = { ...prev }
      delete next[appId]
      return next
    })
    const endpoint = decision === 'accepted' ? '/api/applications/accept' : '/api/applications/reject'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: appId, applicant_id: applicantId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (decision === 'accepted') {
        const msg = typeof data.error === 'string' ? data.error : 'Could not accept application'
        setAcceptNoticeByApp(prev => ({ ...prev, [appId]: { error: msg } }))
      }
      return
    }
    setApps(prev => prev.map(a => (a.id === appId ? { ...a, status: decision } : a)))
    if (decision === 'accepted' && typeof data.inviteSent === 'boolean') {
      setAcceptNoticeByApp(prev => ({
        ...prev,
        [appId]: { inviteSent: data.inviteSent, inviteEmail: data.inviteEmail, inviteUrl: data.inviteUrl },
      }))
    }
  }

  async function copyDiligenceInviteLink(appId: string, url: string) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/plain': Promise.resolve(new Blob([url], { type: 'text/plain' })) }),
      ])
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setDiligenceInviteCopiedId(appId)
    setTimeout(() => setDiligenceInviteCopiedId(null), 3000)
  }

  if (apps.length === 0) {
    return (
      <div className="rounded-[20px] p-[4px] ring-1 ring-black/[0.05] bg-black/[0.025]">
        <div className="flex flex-col items-center rounded-[16px] bg-white px-6 py-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50 ring-1 ring-black/[0.06]">
            <svg className="h-7 w-7 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="mt-5 font-manrope text-[15px] font-bold text-neutral-800">No applicants yet</p>
          <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-neutral-400">
            Share an application link from a property on the{' '}
            <Link href="/dashboard" className="font-semibold text-[#0f766e] transition-[color] hover:text-[#115e59]">
              dashboard
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-4 items-end">
        <FilterSelect label="Property" value={filterProperty} onChange={setFilterProperty}>
          <option value="all">All properties</option>
          {propertyOptions.map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Status" value={filterAppStatus} onChange={setFilterAppStatus}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </FilterSelect>
        <FilterSelect label="Diligence" value={filterDiligence} onChange={setFilterDiligence}>
          <option value="all">All</option>
          <option value="complete">Complete</option>
          <option value="not_run">Not run</option>
          <option value="in_progress">In progress</option>
          <option value="failed">Failed</option>
        </FilterSelect>
        <p className="ml-auto text-[12px] font-medium text-neutral-400 self-end pb-0.5">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </p>
      </div>

      {/* ── Global error ── */}
      {diligenceError && (
        <div className="flex items-start gap-3 rounded-[16px] border border-red-200/80 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
          <span className="flex-1">{diligenceError}</span>
          <button
            type="button"
            onClick={() => setDiligenceError(null)}
            className="shrink-0 text-red-400 transition-[color] hover:text-red-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Applicant cards ── */}
      <div className="space-y-2.5">
        {filtered.map(app => {
          const d = (app.diligence_status || 'none') as DiligenceStatus
          const report = app.diligence_report as Record<string, unknown> | null | undefined
          const thisInFlight = d === 'queued' || d === 'running'
          const otherInFlight = apps.some(
            o => o.id !== app.id && (o.diligence_status === 'queued' || o.diligence_status === 'running')
          )
          const canStartDiligence = d !== 'complete' && !thisInFlight && !anyInFlight
          const acceptNotice = acceptNoticeByApp[app.id]
          const dConfig = diligenceConfig[d] ?? diligenceConfig.none
          const sConfig = appStatusConfig[app.status] ?? { label: app.status, dot: 'bg-neutral-300', text: 'text-neutral-500', bg: 'bg-neutral-100' }

          return (
            /* Double-bezel applicant card */
            <details
              key={app.id}
              className="group rounded-[20px] p-[4px] ring-1 ring-black/[0.05] bg-black/[0.025] transition-[box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] open:shadow-[0_8px_32px_rgba(0,0,0,0.07)]"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 rounded-[16px] bg-white px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] [&::-webkit-details-marker]:hidden group-open:rounded-b-none transition-[background] hover:bg-neutral-50/50">
                <ProfileAvatar variant="tenant" size="sm" alt="" className="shrink-0 ring-2 ring-neutral-100" />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-manrope text-[14px] font-bold text-neutral-900">{app.full_name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-neutral-400">{app.property_address}</p>
                </div>

                <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
                  <ScoreRing score={app.ai_score} />
                  <StatusPill config={dConfig} />
                  <StatusPill config={sConfig} />
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 transition-[background,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-180 group-hover:bg-neutral-200/80">
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-500" strokeWidth={2} />
                </div>
              </summary>

              {/* Expanded panel */}
              <div className="rounded-b-[16px] bg-white px-5 pb-5 pt-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">

                {/* Mobile status pills */}
                <div className="mb-4 flex flex-wrap items-center gap-2 sm:hidden">
                  <ScoreRing score={app.ai_score} />
                  <StatusPill config={dConfig} />
                  <StatusPill config={sConfig} />
                </div>

                {/* Divider */}
                <div className="mb-4 h-px bg-neutral-100" />

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => runFastScore(app.id)}
                    disabled={scoringId === app.id}
                    className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-[12.5px] font-medium text-neutral-600 shadow-sm transition-[background,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-neutral-50 active:scale-[0.97] disabled:opacity-50"
                  >
                    {scoringId === app.id ? 'Scoring…' : 'Run fast score'}
                  </button>
                  <button
                    type="button"
                    onClick={() => runDiligence(app.id)}
                    disabled={!canStartDiligence}
                    className="rounded-full bg-[#0f766e] px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-sm transition-[background,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#115e59] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {diligenceLoading === app.id ? 'Starting…' : d === 'complete' ? 'Diligence complete' : 'Run full diligence'}
                  </button>
                  {app.status === 'under_review' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDecision(app.id, 'accepted', app.applicant_id)}
                        className="rounded-full bg-emerald-600 px-4 py-1.5 text-[12.5px] font-semibold text-white transition-[background,transform] duration-200 hover:bg-emerald-700 active:scale-[0.97]"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(app.id, 'rejected')}
                        className="rounded-full bg-red-600 px-4 py-1.5 text-[12.5px] font-semibold text-white transition-[background,transform] duration-200 hover:bg-red-700 active:scale-[0.97]"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>

                {/* Notices */}
                {acceptNotice && 'error' in acceptNotice && (
                  <div className="mt-3 rounded-[14px] border border-red-200/80 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                    {acceptNotice.error}
                  </div>
                )}
                {acceptNotice && 'inviteSent' in acceptNotice && acceptNotice.inviteSent && acceptNotice.inviteEmail && (
                  <div className="mt-3 rounded-[14px] border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
                    <p className="font-semibold">Invite sent</p>
                    <p className="mt-0.5">Signup instructions sent to <span className="font-medium">{acceptNotice.inviteEmail}</span>.</p>
                  </div>
                )}
                {acceptNotice && 'inviteSent' in acceptNotice && !acceptNotice.inviteSent && acceptNotice.inviteUrl && (
                  <div className="mt-3 rounded-[14px] border border-amber-200/80 bg-amber-50 px-4 py-3 text-[13px] text-amber-900 space-y-2">
                    <p className="font-semibold">Email could not be sent automatically</p>
                    <p>Copy this link for the applicant:</p>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 rounded-xl p-[3px] ring-1 ring-amber-200/80 bg-amber-100/40">
                        <input
                          readOnly
                          value={acceptNotice.inviteUrl}
                          className="w-full rounded-[9px] bg-white px-3 py-1.5 text-[12px] text-neutral-600 truncate outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => copyDiligenceInviteLink(app.id, acceptNotice.inviteUrl!)}
                        className="shrink-0 rounded-full bg-amber-700 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-amber-800 active:scale-[0.97]"
                      >
                        {diligenceInviteCopiedId === app.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {thisInFlight && (
                  <div className="mt-3 rounded-[14px] border border-teal-100 bg-teal-50/60 px-4 py-3 text-[13px] text-[#0f766e]">
                    {d === 'queued'
                      ? 'Queued — will start shortly (screening + AI synthesis).'
                      : 'Running — background screening and multi-agent analysis in progress…'}
                  </div>
                )}
                {otherInFlight && !thisInFlight && (
                  <div className="mt-3 rounded-[14px] border border-teal-100 bg-teal-50/40 px-4 py-3 text-[13px] text-[#0f766e]">
                    Another applicant&apos;s full diligence is queued or running. Only one diligence runs at a time.
                  </div>
                )}

                {/* AI fast score insights */}
                {app.ai_insights && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Fast score insights</p>
                    <p className="text-[13.5px] leading-relaxed text-neutral-700 whitespace-pre-wrap">{app.ai_insights}</p>
                  </div>
                )}

                {/* Diligence report */}
                {app.diligence_error && d === 'failed' && (
                  <div className="mt-3 rounded-[14px] border border-red-200/80 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                    {cleanDiligenceError(app.diligence_error)}
                  </div>
                )}
                {d === 'complete' && !report && (
                  <div className="mt-3 rounded-[14px] border border-red-200/80 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                    Diligence marked complete but no report was stored.
                  </div>
                )}
                {d === 'complete' && report && <DiligenceReportSections report={report} />}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}

function cleanDiligenceError(raw: string): string {
  const firstLine = raw.split('\n')[0] ?? raw
  return firstLine.length > 150 ? firstLine.slice(0, 147) + '…' : firstLine
}

function DiligenceReportSections({ report }: { report: Record<string, unknown> }) {
  const exec = String(report.executive_summary ?? '')
  const fin = String(report.financial_fit ?? '')
  const stab = String(report.stability ?? '')
  const flags = Array.isArray(report.risk_flags) ? (report.risk_flags as string[]) : []
  const follow = Array.isArray(report.recommended_follow_ups) ? (report.recommended_follow_ups as string[]) : []
  const disclaimer = String(report.disclaimer ?? '')
  const det = report.deterministic as Record<string, unknown> | undefined
  const vendor = report.vendor as Record<string, unknown> | undefined
  const agentSections = report.agent_sections as { financial_agent?: string; risk_agent?: string } | undefined

  return (
    <div className="mt-4 space-y-4 rounded-[16px] bg-emerald-50/50 p-5 ring-1 ring-emerald-100/80">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-emerald-800">Full diligence report</p>

      {agentSections && (agentSections.financial_agent || agentSections.risk_agent) && (
        <div className="space-y-2 rounded-[12px] bg-white/70 p-4 ring-1 ring-emerald-100/60">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">LangGraph sub-agents</p>
          {agentSections.financial_agent && (
            <details className="text-[13px]">
              <summary className="cursor-pointer font-semibold text-neutral-800">Financial agent</summary>
              <p className="mt-2 leading-relaxed text-neutral-600 whitespace-pre-wrap pl-1">{agentSections.financial_agent}</p>
            </details>
          )}
          {agentSections.risk_agent && (
            <details className="text-[13px]">
              <summary className="cursor-pointer font-semibold text-neutral-800">Risk / stability agent</summary>
              <p className="mt-2 leading-relaxed text-neutral-600 whitespace-pre-wrap pl-1">{agentSections.risk_agent}</p>
            </details>
          )}
        </div>
      )}

      {exec && (
        <section>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Executive summary</h4>
          <p className="text-[13.5px] leading-relaxed text-neutral-700 whitespace-pre-wrap">{exec}</p>
        </section>
      )}
      {fin && (
        <section>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Financial fit</h4>
          <p className="text-[13.5px] leading-relaxed text-neutral-700 whitespace-pre-wrap">{fin}</p>
        </section>
      )}
      {stab && (
        <section>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Stability</h4>
          <p className="text-[13.5px] leading-relaxed text-neutral-700 whitespace-pre-wrap">{stab}</p>
        </section>
      )}

      {det && (
        <section>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Deterministic snapshot</h4>
          <ul className="space-y-1 text-[13px] text-neutral-600">
            {det.estimated_dti_percent != null && <li>Est. DTI (incl. rent): <strong>{String(det.estimated_dti_percent)}%</strong></li>}
            {det.rent_to_income_ratio != null && <li>Rent / income: <strong>{String(det.rent_to_income_ratio)}%</strong></li>}
            {det.rent_affordability_note != null && det.rent_affordability_note !== '' && <li>{String(det.rent_affordability_note)}</li>}
          </ul>
        </section>
      )}

      {vendor && (
        <section>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Screening provider snapshot</h4>
          <ul className="space-y-1 text-[13px] text-neutral-600">
            {Array.isArray(vendor.summary_flags) && <li>Flags: {(vendor.summary_flags as string[]).join('; ') || '—'}</li>}
            {vendor.credit_band != null && <li>Credit band: <strong>{String(vendor.credit_band)}</strong></li>}
            {vendor.criminal_hits != null && <li>Criminal hits: <strong>{String(vendor.criminal_hits)}</strong></li>}
            {vendor.eviction_hits != null && <li>Eviction hits: <strong>{String(vendor.eviction_hits)}</strong></li>}
          </ul>
        </section>
      )}

      {flags.length > 0 && (
        <section>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Risk flags</h4>
          <ul className="space-y-1">
            {flags.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-[13.5px] text-neutral-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {follow.length > 0 && (
        <section>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Recommended follow-ups</h4>
          <ul className="space-y-1">
            {follow.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-[13.5px] text-neutral-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f766e]" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {disclaimer && (
        <p className="border-t border-emerald-100/80 pt-3 text-[11.5px] text-neutral-400">{disclaimer}</p>
      )}
    </div>
  )
}
