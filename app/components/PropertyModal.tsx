'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Banknote,
  Building2,
  Landmark,
  Layers,
  Trash2,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react'
import type { Property, Application, ServiceRequest, Profile } from '@/lib/types'
import ApplicantCard from './ApplicantCard'
import ServiceRequestCard from './ServiceRequestCard'
import TenantDetailPanel from './TenantDetailPanel'
import { cn } from '@/lib/utils'

type TabId = 'overview' | 'applications' | 'tenant' | 'service'

interface Props {
  property: Property
  applications: Application[]
  serviceRequests: ServiceRequest[]
  tenantProfile: Profile | null
  /** Dataset placeholder when property.photo_url is empty */
  placeholderHeroUrl: string
}

function formatUsd(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function PropertyModal({
  property,
  applications,
  serviceRequests,
  tenantProfile,
  placeholderHeroUrl,
}: Props) {
  const acceptedApplication = useMemo(() => {
    // Only consider an application as a tenant if they've actually created an account (applicant_id set)
    const accepted = applications.filter(a => a.status === 'accepted' && a.applicant_id)
    if (accepted.length === 0) return null
    return [...accepted].sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )[0]
  }, [applications])

  const hasTenant = acceptedApplication != null
  const pendingApplications = applications.filter(a => a.status !== 'accepted')

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [deleteState, setDeleteState] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const router = useRouter()

  async function handleDelete() {
    if (deleteState === 'idle') { setDeleteState('confirm'); return }
    setDeleteState('deleting')
    await fetch(`/api/properties/${property.id}`, { method: 'DELETE' })
    router.push('/dashboard')
    router.refresh()
  }

  const resolvedTab = useMemo((): TabId => {
    if (hasTenant && activeTab === 'applications') return 'tenant'
    return activeTab
  }, [hasTenant, activeTab])

  const heroUrl = property.photo_url ?? placeholderHeroUrl
  const hasPhoto = Boolean(heroUrl)

  const tabs: { id: TabId; label: string; icon: typeof Building2; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    ...(hasTenant
      ? ([{ id: 'tenant' as const, label: 'Tenant', icon: Users }] as const)
      : ([
          {
            id: 'applications' as const,
            label: 'Applications',
            icon: UserPlus,
            count: pendingApplications.length,
          },
        ] as const)),
    { id: 'service', label: 'Service', icon: Wrench, count: serviceRequests.length },
  ]

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[min(100vw,880px)] -translate-x-1/2 bg-[radial-gradient(ellipse_75%_55%_at_50%_-15%,rgba(20,184,166,0.14),transparent)]"
        aria-hidden
      />

      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[13px] text-[#64748b]">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 font-semibold text-[#115e59] shadow-sm transition hover:border-[#0f766e]/35 hover:bg-[#f8fafc]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
            Dashboard
          </Link>
          <span className="text-[#cbd5e1]" aria-hidden>
            /
          </span>
          <span className="font-medium text-[#334155]">Property details</span>
        </nav>

        <div className="flex items-center gap-2">
          {deleteState === 'confirm' && (
            <span className="text-[13px] font-medium text-[#dc2626]">Are you sure?</span>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteState === 'deleting'}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-semibold shadow-sm transition',
              deleteState === 'confirm'
                ? 'border-[#dc2626] bg-[#dc2626] text-white hover:bg-[#b91c1c]'
                : 'border-[#e2e8f0] bg-white text-[#dc2626] hover:border-[#dc2626]/35 hover:bg-[#fef2f2]',
              deleteState === 'deleting' && 'cursor-not-allowed opacity-60'
            )}
          >
            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            {deleteState === 'deleting' ? 'Deleting…' : deleteState === 'confirm' ? 'Confirm delete' : 'Delete property'}
          </button>
          {deleteState === 'confirm' && (
            <button
              type="button"
              onClick={() => setDeleteState('idle')}
              className="rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-[13px] font-semibold text-[#475569] shadow-sm transition hover:bg-[#f8fafc]"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <article className="overflow-hidden rounded-[28px] border border-[#e2e8f0]/90 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.14)]">
        <div className="relative min-h-[220px] w-full sm:min-h-[280px]">
          {hasPhoto ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroUrl}
                alt={property.address}
                width={1920}
                height={640}
                decoding="async"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/88 via-[#0f172a]/35 to-[#0f172a]/15"
                aria-hidden
              />
            </>
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#f0fdfa] via-[#f8fafc] to-[#e2e8f0]"
              aria-hidden
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f766e]/10 text-[#115e59]">
                <Building2 className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-sm font-medium text-[#64748b]">No photo yet</p>
            </div>
          )}

          <div className="relative flex h-full min-h-[220px] flex-col justify-end p-6 sm:min-h-[280px] sm:p-10">
            <p
              className={
                hasPhoto
                  ? 'text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75'
                  : 'text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748b]'
              }
            >
              Portfolio property
            </p>
            <h1
              className={
                hasPhoto
                  ? 'mt-2 font-manrope text-[clamp(1.5rem,4vw,2.125rem)] font-bold leading-tight tracking-[-0.03em] text-white'
                  : 'mt-2 font-manrope text-[clamp(1.5rem,4vw,2.125rem)] font-bold leading-tight tracking-[-0.03em] text-[#191c1d]'
              }
            >
              {property.address}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={
                  hasPhoto
                    ? 'inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[13px] font-semibold text-white backdrop-blur-sm'
                    : 'inline-flex items-center rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-[13px] font-semibold text-[#334155] shadow-sm'
                }
              >
                {property.property_type}
              </span>
              <span
                className={
                  hasPhoto
                    ? 'inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[13px] font-medium text-white/95 backdrop-blur-sm'
                    : 'inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-[13px] font-medium text-[#475569]'
                }
              >
                <Layers className="h-3.5 w-3.5 opacity-90" strokeWidth={2} />
                {property.unit_count} unit{property.unit_count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-[#e2e8f0] bg-[#f8fafc]/80 lg:grid-cols-4">
          <div className="flex flex-col justify-center border-b border-[#e2e8f0] p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">
              <Banknote className="h-3.5 w-3.5 text-[#0f766e]" strokeWidth={2} />
              Monthly rent
            </span>
            <p className="mt-2 font-manrope text-xl font-bold tracking-tight text-[#191c1d] sm:text-2xl">
              {formatUsd(property.monthly_rent)}
            </p>
          </div>
          <div className="flex flex-col justify-center border-b border-[#e2e8f0] p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">
              <Landmark className="h-3.5 w-3.5 text-[#0f766e]" strokeWidth={2} />
              Purchase price
            </span>
            <p className="mt-2 font-manrope text-xl font-bold tracking-tight text-[#191c1d] sm:text-2xl">
              {formatUsd(property.purchase_price)}
            </p>
          </div>
          <div className="flex flex-col justify-center border-r border-[#e2e8f0] p-5 sm:p-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">Units</span>
            <p className="mt-2 font-manrope text-xl font-bold tracking-tight text-[#191c1d] sm:text-2xl">
              {property.unit_count}
            </p>
          </div>
          <div className="flex flex-col justify-center p-5 sm:p-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">Type</span>
            <p className="mt-2 text-lg font-semibold leading-snug text-[#191c1d]">{property.property_type}</p>
          </div>
        </div>

        <div className="border-b border-[#e2e8f0] bg-white px-4 py-3 sm:px-6">
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Property sections"
          >
            {tabs.map(({ id, label, icon: Icon, count }) => {
              const selected = resolvedTab === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition',
                    selected
                      ? 'bg-brand-hover text-white shadow-md shadow-[#0f766e]/20'
                      : 'border border-transparent bg-[#f8fafc] text-[#475569] hover:border-[#e2e8f0] hover:bg-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                  {label}
                  {count != null && (
                    <span
                      className={cn(
                        'ml-0.5 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
                        selected ? 'bg-white/20 text-white' : 'bg-[#e2e8f0] text-[#475569]'
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {resolvedTab === 'overview' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#e2e8f0] bg-gradient-to-b from-[#fafbfc] to-white p-6 shadow-sm">
                <h2 className="font-manrope text-lg font-bold text-[#191c1d]">At a glance</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-[#475569]">
                  Financials and structure for this address. Switch to{' '}
                  <span className="font-semibold text-[#115e59]">
                    {hasTenant ? 'Tenant' : 'Applications'}
                  </span>{' '}
                  or <span className="font-semibold text-[#115e59]">Service</span> to manage people and maintenance.
                </p>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#e2e8f0]/80 bg-white p-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Listed rent</dt>
                    <dd className="mt-1 font-manrope text-lg font-bold text-[#191c1d]">{formatUsd(property.monthly_rent)}</dd>
                  </div>
                  <div className="rounded-xl border border-[#e2e8f0]/80 bg-white p-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Basis (purchase)</dt>
                    <dd className="mt-1 font-manrope text-lg font-bold text-[#191c1d]">{formatUsd(property.purchase_price)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {resolvedTab === 'applications' && !hasTenant && (
            <div className="space-y-4">
              {pendingApplications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#e2e8f0] bg-[#fafbfc] px-6 py-14 text-center">
                  <UserPlus className="mx-auto h-10 w-10 text-[#94a3b8]" strokeWidth={1.25} />
                  <p className="mt-4 text-[15px] font-semibold text-[#334155]">No applications yet</p>
                  <p className="mt-1 text-sm text-[#64748b]">When renters apply, they will appear here for review.</p>
                </div>
              ) : (
                pendingApplications.map(app => <ApplicantCard key={app.id} application={app} />)
              )}
            </div>
          )}

          {resolvedTab === 'tenant' && hasTenant && acceptedApplication && (
            <TenantDetailPanel application={acceptedApplication} profile={tenantProfile} />
          )}

          {resolvedTab === 'service' && (
            <div className="space-y-4">
              {serviceRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#e2e8f0] bg-[#fafbfc] px-6 py-14 text-center">
                  <Wrench className="mx-auto h-10 w-10 text-[#94a3b8]" strokeWidth={1.25} />
                  <p className="mt-4 text-[15px] font-semibold text-[#334155]">No service requests</p>
                  <p className="mt-1 text-sm text-[#64748b]">Maintenance tickets from tenants show up in this list.</p>
                </div>
              ) : (
                serviceRequests.map(req => <ServiceRequestCard key={req.id} serviceRequest={req} />)
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
