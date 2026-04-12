'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, ServiceRequest, Payment } from '@/lib/types'
import ProfileAvatar from '@/components/ProfileAvatar'

interface Property {
  id: string
  address: string
  monthly_rent: number
}

interface Props {
  profile: Profile
  leasedProperty?: Property | null
  serviceRequests: ServiceRequest[]
  property: Property | null
  payments: Payment[]
}

const statusColors: Record<string, string> = {
  open: 'bg-orange-50 text-orange-700',
  in_progress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-[rgba(240,253,250,0.9)] text-[#0f766e]',
}

const statusLabel: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

const categories = ['Plumbing', 'HVAC', 'Electrical', 'Appliance', 'Pest Control', 'Other']

function getCurrentMonth() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatPeriod(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function TenantPortal({ profile, serviceRequests: initialRequests, property, payments: initialPayments }: Props) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [payments] = useState(initialPayments)
  const [category, setCategory] = useState('Plumbing')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  async function submitRequest() {
    if (!property) {
      setSubmitError('No property linked. Please contact your landlord.')
      return
    }
    setSubmitting(true)
    setSubmitError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const { error: insertError } = await supabase
      .from('service_requests')
      .insert({
        property_id: property.id,
        tenant_id: user.id,
        category,
        description,
        status: 'open',
      })

    if (insertError) {
      setSubmitError('Failed to submit. Please try again.')
      setSubmitting(false)
      return
    }

    // Optimistic update
    const optimistic: ServiceRequest = {
      id: crypto.randomUUID(),
      property_id: property.id,
      tenant_id: user.id,
      category,
      description,
      status: 'open',
      created_at: new Date().toISOString(),
    }
    setRequests([optimistic, ...requests])
    setDescription('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setSubmitting(false)

    // Refresh server data so requests persist on next load
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Nav */}
      <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-[#f1f5f9] bg-[rgba(248,250,252,0.85)] px-6 py-3 backdrop-blur-md shadow-[0px_1px_0px_rgba(25,28,29,0.04)]">
        <div className="flex items-center gap-3">
          <span className="font-manrope text-lg font-bold tracking-[0.2em] text-[#191c1d]">Keystone</span>
          {property && (
            <>
              <span className="text-[#e2e8f0]">/</span>
              <span className="text-sm text-[#94a3b8] truncate max-w-xs">{property.address}</span>
            </>
          )}
        </div>
        <form action="/api/auth/signout" method="post">
          <button className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#64748b] transition hover:bg-slate-100">
            Sign out
          </button>
        </form>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ProfileAvatar
            variant="tenant"
            size="sm"
            alt=""
            className="ring-2 ring-white shadow-md sm:h-11 sm:w-11"
          />
          <div>
            <h1 className="font-manrope text-3xl font-bold tracking-tight text-[#191c1d]">
              Hi, {profile.full_name?.split(' ')[0] ?? profile.email}
            </h1>
            <p className="mt-1 text-sm text-[#64748b]">Here&apos;s an overview of your tenancy.</p>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[#f1f5f9] p-5 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#94a3b8] mb-1">Monthly Rent</p>
            <p className="font-manrope text-3xl font-bold text-[#191c1d]">
              {property ? `$${property.monthly_rent.toLocaleString()}` : '—'}
            </p>
            <p className="text-xs text-[#94a3b8] mt-1">{getCurrentMonth()}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#f1f5f9] p-5 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#94a3b8] mb-1">Open Requests</p>
            <p className="font-manrope text-3xl font-bold text-[#191c1d]">
              {requests.filter(r => r.status === 'open').length}
            </p>
            <p className="text-xs text-[#94a3b8] mt-1">awaiting response</p>
          </div>
          <div className="bg-white rounded-xl border border-[#f1f5f9] p-5 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#94a3b8] mb-1">Resolved</p>
            <p className="font-manrope text-3xl font-bold text-[#191c1d]">
              {requests.filter(r => r.status === 'resolved').length}
            </p>
            <p className="text-xs text-[#94a3b8] mt-1">all time</p>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-xl border border-[#f1f5f9] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#f8fafc]">
            <h2 className="font-manrope font-bold text-[#191c1d]">Rent Payment</h2>
          </div>
          <div className="p-6">
            {property ? (
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 bg-[#f8fafc] rounded-xl p-5 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#94a3b8] mb-1">Monthly Rent</p>
                  <p className="font-manrope text-4xl font-bold text-[#191c1d]">${property.monthly_rent.toLocaleString()}</p>
                  <p className="text-sm text-[#64748b] mt-1">{getCurrentMonth()}</p>
                  <button
                    disabled
                    className="mt-4 w-full cursor-not-allowed rounded-lg bg-brand py-2.5 text-sm font-semibold text-white opacity-40"
                  >
                    Pay ${property.monthly_rent.toLocaleString()}
                  </button>
                  <p className="mt-1.5 text-center text-xs text-[#94a3b8]">Online payments coming soon</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#191c1d] mb-3">Payment History</p>
                  {payments.length === 0 ? (
                    <p className="text-sm text-[#94a3b8]">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-0">
                      {payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[#f8fafc] last:border-0">
                          <div>
                            <p className="text-sm text-[#191c1d]">{formatPeriod(p.period_start)}</p>
                            <p className="text-xs text-[#94a3b8]">{new Date(p.paid_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#191c1d]">${p.amount.toLocaleString()}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(240,253,250,0.9)] text-[#0f766e]">Paid</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#94a3b8] text-center py-4">No property linked yet. Contact your landlord.</p>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Submit form — 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#f1f5f9] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#f8fafc]">
              <h2 className="font-manrope font-bold text-[#191c1d]">Report an Issue</h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">Submit a maintenance or service request</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wide text-[#64748b] mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#191c1d] focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wide text-[#64748b] mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={5}
                  className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#191c1d] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <button
                onClick={submitRequest}
                disabled={submitting || !description.trim()}
                className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
              {submitted && (
                <div className="flex items-center gap-2 bg-[rgba(240,253,250,0.9)] text-[#0f766e] rounded-xl px-3 py-2.5 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Request submitted successfully.
                </div>
              )}
              {submitError && (
                <p className="text-sm text-red-600">{submitError}</p>
              )}
            </div>
          </div>

          {/* Request history — 3 cols */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-[#f1f5f9] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#f8fafc] flex items-center justify-between">
              <h2 className="font-manrope font-bold text-[#191c1d]">Request History</h2>
              <span className="text-xs bg-[#f1f5f9] text-[#64748b] px-2.5 py-1 rounded-full font-medium">
                {requests.length} {requests.length === 1 ? 'request' : 'requests'}
              </span>
            </div>
            <div className="divide-y divide-[#f8fafc] max-h-[480px] overflow-y-auto">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-12 h-12 bg-[#f1f5f9] rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#475569]">No requests yet</p>
                  <p className="text-xs text-[#94a3b8] mt-1">Submitted issues will appear here</p>
                </div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="px-6 py-4 hover:bg-[#f8fafc] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rounded bg-brand-subtle px-2 py-0.5 text-xs font-semibold text-brand">
                            {req.category}
                          </span>
                          <span className="text-xs text-[#94a3b8]">
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#3e4948] line-clamp-2">{req.description}</p>
                        {req.landlord_notes && (
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-brand-subtle px-3 py-2">
                            <svg
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-foreground/70"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <p className="text-xs text-brand-foreground">{req.landlord_notes}</p>
                          </div>
                        )}
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                        {statusLabel[req.status] ?? req.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
