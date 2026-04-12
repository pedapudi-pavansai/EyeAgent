import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PropertyModal from '@/components/PropertyModal'
import DashboardShell from '@/components/landlord/DashboardShell'
import type { Profile } from '@/lib/types'
import { getPropertyImageUrl } from '@/lib/property-image'

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, business_name')
    .eq('id', user.id)
    .single()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('landlord_id', user.id)
    .single()

  if (!property) redirect('/dashboard')

  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .eq('property_id', id)
    .order('submitted_at', { ascending: false })

  const { data: serviceRequests } = await supabase
    .from('service_requests')
    .select('*')
    .eq('property_id', id)
    .order('created_at', { ascending: false })

  const apps = applications ?? []
  const acceptedApps = apps.filter(a => a.status === 'accepted')
  const primaryAccepted =
    acceptedApps.length > 0
      ? [...acceptedApps].sort(
          (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        )[0]
      : null

  let tenantProfile: Profile | null = null
  if (primaryAccepted?.applicant_id) {
    try {
      const admin = createAdminClient()
      const { data: prof } = await admin
        .from('profiles')
        .select('*')
        .eq('id', primaryAccepted.applicant_id)
        .single()
      tenantProfile = prof as Profile | null
    } catch {
      tenantProfile = null
    }
  }

  return (
    <DashboardShell
      fullName={profile?.full_name}
      businessName={profile?.business_name}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <PropertyModal
          property={property}
          applications={apps}
          serviceRequests={serviceRequests || []}
          tenantProfile={tenantProfile}
          placeholderHeroUrl={getPropertyImageUrl(property.id)}
        />
      </div>
    </DashboardShell>
  )
}
