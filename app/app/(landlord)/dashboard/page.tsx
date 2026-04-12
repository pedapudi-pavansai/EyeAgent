import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, PlusCircle } from 'lucide-react'
import { assignDistinctPropertyImageUrls } from '@/lib/property-image'
import DashboardShell from '@/components/landlord/DashboardShell'
import DashboardPropertyGallery from '@/components/landlord/DashboardPropertyGallery'
import DashboardApplicantsRow from '@/components/landlord/DashboardApplicantsRow'
import DashboardMarketplaceRow from '@/components/landlord/DashboardMarketplaceRow'
import { getPersonalizedMarketplacePicks } from '@/lib/marketplace/getPersonalizedMarketplacePicks'
import type { Application } from '@/lib/types'

export const dynamic = 'force-dynamic'

function KpiTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    /* Double-bezel KPI tile */
    <div className="rounded-[20px] p-[4px] ring-1 ring-black/[0.05] bg-black/[0.025]">
      <div className="flex h-full flex-col justify-between rounded-[16px] bg-white px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{label}</p>
        <div className="mt-3">
          <p className={`font-manrope text-[2rem] font-bold tabular-nums leading-none tracking-tight ${accent ? 'text-[#0f766e]' : 'text-neutral-900'}`}>
            {value}
          </p>
          {sub && <p className="mt-1 text-[12px] text-neutral-400">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: properties, error: propertiesError }, { data: profile }, picksBundle] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('full_name, business_name, role').eq('id', user.id).single(),
    getPersonalizedMarketplacePicks(supabase, user.id, 6),
  ])

  const propertyIds = (properties || []).map(p => p.id)
  const [{ data: applications }, { data: serviceRequests }] =
    propertyIds.length > 0
      ? await Promise.all([
          supabase
            .from('applications')
            .select('*')
            .in('property_id', propertyIds)
            .order('submitted_at', { ascending: false }),
          supabase
            .from('service_requests')
            .select('property_id')
            .in('property_id', propertyIds),
        ])
      : [{ data: [] }, { data: [] }]

  const propertiesWithTenants = new Set((serviceRequests || []).map((r: { property_id: string }) => r.property_id))
  const propertyMap = Object.fromEntries((properties || []).map(p => [p.id, p.address]))
  const enrichedApplications = ((applications || []) as Application[]).map(app => ({
    ...app,
    property_address: propertyMap[app.property_id] || 'Unknown property',
  }))

  const list = properties || []
  const total = list.length
  const isLandlord = profile?.role === 'landlord'

  /* KPI metrics */
  const openApps = enrichedApplications.filter(
    a => a.status === 'pending' || a.status === 'under_review'
  ).length
  const occupiedCount = list.filter(
    p =>
      enrichedApplications.some(a => a.property_id === p.id && a.status === 'accepted') ||
      propertiesWithTenants.has(p.id)
  ).length
  const totalValue = list.reduce((acc, p) => acc + (Number(p.purchase_price) || 0), 0)

  const topListings = picksBundle.picks
  const hasLandlordSignals = picksBundle.personalized

  const propertyPlaceholderById = assignDistinctPropertyImageUrls(propertyIds)
  const listingPlaceholderById = assignDistinctPropertyImageUrls(topListings.map(l => l.id))
  const topListingsWithImages = topListings.map(l => ({
    ...l,
    photo_url: listingPlaceholderById[l.id] ?? l.photo_url,
  }))

  const galleryItems = list.map(property => ({
    property,
    distinctPlaceholderUrl: propertyPlaceholderById[property.id],
    appCount: enrichedApplications.filter(
      a => a.property_id === property.id && (a.status === 'pending' || a.status === 'under_review')
    ).length,
    occupied:
      enrichedApplications.some(a => a.property_id === property.id && a.status === 'accepted') ||
      propertiesWithTenants.has(property.id),
  }))

  const totalValueFormatted =
    totalValue >= 1_000_000
      ? `$${(totalValue / 1_000_000).toFixed(1)}M`
      : totalValue > 0
        ? `$${(totalValue / 1000).toFixed(0)}k`
        : '—'

  return (
    <DashboardShell
      fullName={profile?.full_name}
      businessName={profile?.business_name}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col px-6 pb-20 pt-8 sm:px-8">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f766e]">
              Portfolio overview
            </p>
            <h1 className="font-manrope text-[2rem] font-bold leading-tight tracking-[-0.025em] text-neutral-900 sm:text-[2.25rem]">
              Dashboard
            </h1>
          </div>
          <Link
            href="/onboarding"
            className="group flex w-fit items-center gap-2.5 rounded-full bg-brand pl-5 pr-2 py-2 text-[14px] font-semibold text-white shadow-[0_2px_12px_rgba(15,118,110,0.22)] transition-[background,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-hover active:scale-[0.98]"
          >
            Add asset
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-[transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-110">
              <PlusCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </span>
          </Link>
        </div>

        {/* ── KPI strip ── */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="Total properties" value={String(total)} sub={total === 1 ? '1 asset' : `${total} assets`} />
          <KpiTile label="Open applications" value={String(openApps)} accent={openApps > 0} />
          <KpiTile
            label="Occupancy"
            value={total > 0 ? `${Math.round((occupiedCount / total) * 100)}%` : '—'}
            sub={total > 0 ? `${occupiedCount} of ${total} occupied` : undefined}
            accent
          />
          <KpiTile label="Total asset value" value={totalValueFormatted} />
        </div>

        {/* ── Error banners ── */}
        {propertiesError && (
          <div className="mt-6 rounded-[16px] border border-red-200/80 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
            Could not load properties: {propertiesError.message}
          </div>
        )}
        {!propertiesError && profile && !isLandlord && profile.role === 'applicant' && (
          <div className="mt-6 rounded-[16px] border border-amber-200/80 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-950">
            You&apos;re signed in as an <strong>applicant</strong>. This portfolio lists only properties where your
            account is the <strong>landlord</strong>.
          </div>
        )}

        {/* ── Properties + Applicants ── */}
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)] lg:gap-x-8">
          <section aria-labelledby="properties-row-heading" className="min-w-0">
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="properties-row-heading"
                className="font-manrope text-[18px] font-bold tracking-[-0.02em] text-neutral-900"
              >
                Current properties
              </h2>
              {total > 0 && (
                <span className="text-[12px] font-medium text-neutral-400">{total} total</span>
              )}
            </div>

            {total > 0 ? (
              <DashboardPropertyGallery items={galleryItems} />
            ) : (
              /* Empty state — double-bezel */
              <div className="rounded-[20px] p-[4px] ring-1 ring-black/[0.05] bg-black/[0.025]">
                <div className="flex flex-col items-center rounded-[16px] bg-white px-6 py-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-50 ring-1 ring-black/[0.06]">
                    <svg className="h-7 w-7 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
                    </svg>
                  </div>
                  <p className="mt-5 font-manrope text-[15px] font-bold text-neutral-800">No properties yet</p>
                  <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-neutral-400">
                    Add your first asset to start tracking occupancy, applications, and value.
                  </p>
                  {isLandlord && (
                    <p className="mx-auto mt-3 max-w-sm text-left text-[12px] leading-relaxed text-neutral-400">
                      If you added rows directly in Supabase, set{' '}
                      <code className="rounded bg-neutral-100 px-1 py-0.5 text-[11px]">landlord_id</code>{' '}
                      to your user id from <strong>Authentication → Users</strong>.
                    </p>
                  )}
                  <Link
                    href="/onboarding"
                    className="group mt-6 flex items-center gap-2 rounded-full bg-brand pl-5 pr-2 py-2 text-[13.5px] font-semibold text-white shadow-[0_2px_12px_rgba(15,118,110,0.22)] transition-[background,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-hover active:scale-[0.98]"
                  >
                    Add first asset
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-[transform] duration-300 group-hover:translate-x-0.5 group-hover:scale-110">
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </section>

          <div className="min-w-0 lg:border-l lg:border-black/[0.05] lg:pl-8">
            <DashboardApplicantsRow applications={enrichedApplications} compact />
          </div>
        </div>

        {/* ── Marketplace picks ── */}
        <DashboardMarketplaceRow
          listings={topListingsWithImages}
          personalized={hasLandlordSignals}
          className="mt-12 border-t border-black/[0.04] pt-10"
        />

      </div>
    </DashboardShell>
  )
}
