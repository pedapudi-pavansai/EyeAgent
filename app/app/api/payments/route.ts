import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { property_id, amount, period_start } = await req.json()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Prevent duplicate payment for the same month
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('tenant_id', user.id)
    .eq('property_id', property_id)
    .eq('period_start', period_start)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Rent already paid for this month' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({ tenant_id: user.id, property_id, amount, period_start })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ payment: data })
}
