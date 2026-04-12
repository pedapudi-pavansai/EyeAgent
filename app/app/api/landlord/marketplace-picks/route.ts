import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPersonalizedMarketplacePicks } from '@/lib/marketplace/getPersonalizedMarketplacePicks'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await getPersonalizedMarketplacePicks(supabase, user.id, 12)

  return NextResponse.json({
    picks: result.picks,
    defaultFilters: result.defaultFilters,
    personalized: result.personalized,
  })
}
