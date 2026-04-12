import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runScoringAgent } from '@/lib/ai/scoring-agent'

export async function POST(req: NextRequest) {
  const { application_id } = await req.json()
  if (!application_id) return NextResponse.json({ error: 'Missing application_id' }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: visible, error: visErr } = await supabase
    .from('applications')
    .select('id')
    .eq('id', application_id)
    .maybeSingle()

  if (visErr || !visible) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  try {
    await runScoringAgent(application_id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
}
