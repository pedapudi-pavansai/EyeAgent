'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Application, ApplicationStatus } from '@/lib/types'
import ProfileAvatar from '@/components/ProfileAvatar'

interface Props {
  application: Application
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

function ScoreBadge({ score }: { score?: number }) {
  if (!score) return <span className="text-xs text-gray-400">Scoring...</span>
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
  return <span className={`font-bold text-lg ${color}`}>{score}</span>
}

export default function ApplicantCard({ application }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<ApplicationStatus>(application.status)
  const [inviteMeta, setInviteMeta] = useState<{
    inviteSent: boolean
    inviteEmail?: string
    inviteUrl?: string
  } | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)

  async function handleAccept() {
    setLoading(true)
    const res = await fetch('/api/applications/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: application.id, applicant_id: application.applicant_id }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('accepted')
      if (typeof data.inviteSent === 'boolean') {
        setInviteMeta({
          inviteSent: data.inviteSent,
          inviteEmail: data.inviteEmail,
          inviteUrl: data.inviteUrl,
        })
      } else {
        setInviteMeta(null)
      }
    }
    setLoading(false)
  }

  async function copyInviteLink() {
    const url = inviteMeta?.inviteUrl
    if (!url) return
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/plain': Promise.resolve(new Blob([url], { type: 'text/plain' })) })
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
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 3000)
  }

  async function handleReject() {
    setLoading(true)
    const res = await fetch('/api/applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: application.id }),
    })
    if (res.ok) {
      setStatus('rejected')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ProfileAvatar variant="tenant" size="sm" alt="" className="ring-1 ring-gray-200" />
          <div>
            <p className="font-medium text-gray-900">{application.full_name}</p>
            <p className="text-xs text-gray-500">{application.email} · {new Date(application.submitted_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={application.ai_score} />
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
            {status.replace('_', ' ')}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-brand hover:underline"
          >
            {expanded ? 'Hide' : 'View'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Employer:</span> {application.employer}</div>
            <div><span className="text-gray-500">Job:</span> {application.job_title}</div>
            <div><span className="text-gray-500">Income:</span> ${application.annual_income?.toLocaleString()}/yr</div>
            <div><span className="text-gray-500">FICO:</span> {application.fico_score}</div>
            <div><span className="text-gray-500">Monthly Debts:</span> ${application.monthly_debts?.toLocaleString()}</div>
            <div><span className="text-gray-500">Phone:</span> {application.phone}</div>
          </div>

          {application.ai_insights && (
            <div className="rounded-lg bg-brand-subtle p-3">
              <p className="mb-1 text-xs font-semibold text-brand-foreground">AI Insights</p>
              <p className="text-sm text-brand">{application.ai_insights}</p>
            </div>
          )}

          {(status === 'pending' || status === 'under_review') && (
            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}

          {status === 'accepted' && inviteMeta?.inviteSent && inviteMeta.inviteEmail && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-800 mb-1">Invite sent</p>
              <p className="text-xs text-green-700">
                We emailed signup instructions to <span className="font-medium">{inviteMeta.inviteEmail}</span>.
              </p>
            </div>
          )}

          {status === 'accepted' && inviteMeta && !inviteMeta.inviteSent && inviteMeta.inviteUrl && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-900 mb-2">Email could not be sent automatically</p>
              <p className="text-xs text-amber-800 mb-2">
                Copy this link and send it to the applicant so they can set up their tenant account.
              </p>
              <div className="flex gap-2 items-center">
                <input
                  readOnly
                  value={inviteMeta.inviteUrl}
                  className="flex-1 text-xs px-2 py-1.5 border border-amber-300 rounded bg-white text-gray-700 truncate"
                />
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="px-3 py-1.5 bg-amber-700 text-white text-xs rounded-lg hover:bg-amber-800 transition whitespace-nowrap"
                >
                  {inviteCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
