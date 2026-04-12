import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** All applications across landlord properties (for diligence UI polling). */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: properties } = await supabase.from('properties').select('id, address').eq('landlord_id', user.id)

  const propertyIds = (properties || []).map(p => p.id)
  if (propertyIds.length === 0) {
    return NextResponse.json({ applications: [] })
  }

  const { data: applications, error } = await supabase
    .from('applications')
    .select('*')
    .in('property_id', propertyIds)
    .order('submitted_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const pmap = Object.fromEntries((properties || []).map(p => [p.id, p.address]))
  const enriched = (applications || []).map(a => ({
    ...a,
    property_address: pmap[a.property_id] || 'Unknown property',
  }))

  return NextResponse.json({ applications: enriched })
}
