import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/landlord/DashboardShell'
import MarketplacePageClient from './MarketplacePageClient'

export const dynamic = 'force-dynamic'

export default async function MarketplacePage() {
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

  return (
    <DashboardShell
      fullName={profile?.full_name}
      businessName={profile?.business_name}
    >
      <MarketplacePageClient />
    </DashboardShell>
  )
}
