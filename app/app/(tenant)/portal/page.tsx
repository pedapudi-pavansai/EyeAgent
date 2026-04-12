import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TenantPortal from '@/components/TenantPortal'

export const dynamic = 'force-dynamic'

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'tenant') redirect('/dashboard')

  const { data: application } = await supabase
    .from('applications')
    .select('property_id')
    .eq('applicant_id', user.id)
    .eq('status', 'accepted')
    .single()

  const property = application
    ? (await supabase.from('properties').select('id, address, monthly_rent').eq('id', application.property_id).single()).data
    : null

  const { data: serviceRequests } = await supabase
    .from('service_requests')
    .select('*')
    .eq('tenant_id', user.id)
    .order('created_at', { ascending: false })

  const { data: payments } = application
    ? await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', user.id)
        .order('period_start', { ascending: false })
        .limit(12)
    : { data: [] }

  return (
    <TenantPortal
      profile={profile}
      serviceRequests={serviceRequests || []}
      property={property}
      payments={payments || []}
    />
  )
}
