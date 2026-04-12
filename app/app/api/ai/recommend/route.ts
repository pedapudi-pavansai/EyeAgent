import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runRecommendationAgent } from '@/lib/ai/recommendation-agent'

export async function POST(req: NextRequest) {
  const { landlord_id } = await req.json()
  if (!landlord_id) return NextResponse.json({ error: 'Missing landlord_id' }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (landlord_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'landlord') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const results = await runRecommendationAgent(landlord_id)
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Recommendation failed' }, { status: 500 })
  }
}
