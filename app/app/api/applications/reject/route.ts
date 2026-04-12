import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { application_id } = await req.json()
  const supabase = await createClient()

  await supabase
    .from('applications')
    .update({ status: 'rejected' })
    .eq('id', application_id)

  return NextResponse.json({ success: true })
}
