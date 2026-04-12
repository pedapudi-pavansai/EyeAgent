import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPublicOrigin } from '@/lib/public-url'

export async function POST(req: NextRequest) {
  const { property_id } = await req.json()
  if (!property_id) {
    return NextResponse.json({ error: 'property_id is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: owned, error: ownErr } = await supabase
    .from('properties')
    .select('id')
    .eq('id', property_id)
    .eq('landlord_id', user.id)
    .maybeSingle()

  if (ownErr || !owned) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('application_tokens')
    .insert({ property_id })
    .select('token')
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to create application link' },
      { status: 500 }
    )
  }
  if (!data?.token) {
    return NextResponse.json({ error: 'Failed to create application link' }, { status: 500 })
  }

  const origin = getPublicOrigin(req)
  const url = `${origin}/apply/${property_id}?token=${encodeURIComponent(data.token)}`
  return NextResponse.json({ url })
}
