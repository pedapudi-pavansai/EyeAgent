import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/landlord/DashboardShell'
import DiligenceList from '@/components/DiligenceList'

export default async function DiligencePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: properties }, { data: profile }] = await Promise.all([
    supabase.from('properties').select('id, address').eq('landlord_id', user.id),
    supabase.from('profiles').select('full_name, business_name').eq('id', user.id).single(),
  ])

  const propertyIds = (properties || []).map(p => p.id)
  const { data: applications } =
    propertyIds.length > 0
      ? await supabase
          .from('applications')
          .select('*')
          .in('property_id', propertyIds)
          .order('submitted_at', { ascending: false })
      : { data: [] }

  const pmap = Object.fromEntries((properties || []).map(p => [p.id, p.address]))
  const enriched = (applications || []).map(app => ({
    ...app,
    property_address: pmap[app.property_id] || 'Unknown property',
  }))

  return (
    <DashboardShell
      fullName={profile?.full_name}
      businessName={profile?.business_name}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col px-6 pb-20 pt-8 sm:px-8">
        <section aria-labelledby="diligence-heading" className="border-b border-black/[0.04] pb-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-stretch lg:gap-10">
            <div className="flex min-h-0 min-w-0 flex-col">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f766e]">
                Applicant screening
              </p>
              <h1
                id="diligence-heading"
                className="font-manrope text-[2rem] font-bold leading-tight tracking-[-0.025em] text-neutral-900 sm:text-[2.25rem]"
              >
                Due diligence
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-500">
                Fast scoring estimates risk from application data. Full diligence runs a background screening plus AI
                synthesis — once per application.
              </p>
            </div>

            {/* Workflow aside — double-bezel */}
            <div className="rounded-[20px] p-[4px] ring-1 ring-black/[0.05] bg-black/[0.025]">
              <aside
                className="flex h-full min-h-0 w-full flex-col rounded-[16px] bg-white px-6 py-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]"
                aria-label="Recommended workflow"
              >
                <p className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Typical workflow
                </p>
                <ol className="mt-5 flex flex-1 flex-col justify-center gap-5 text-[13.5px] leading-snug text-neutral-600">
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0f766e]/10 font-manrope text-[11px] font-bold text-[#115e59]">
                      1
                    </span>
                    <span>
                      <span className="font-semibold text-neutral-900">Fast score</span> — quick AI risk estimate from
                      the application file.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0f766e]/10 font-manrope text-[11px] font-bold text-[#115e59]">
                      2
                    </span>
                    <span>
                      <span className="font-semibold text-neutral-900">Full diligence & decide</span> — screening plus
                      structured report (one run at a time), then accept or reject when under review.
                    </span>
                  </li>
                </ol>
              </aside>
            </div>
          </div>
        </section>

        <div className="mt-10">
          <DiligenceList initialApplications={enriched} />
        </div>
      </div>
    </DashboardShell>
  )
}
