import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { id, status, landlord_notes } = await req.json()
  const supabase = await createClient()

  await supabase
    .from('service_requests')
    .update({ status, landlord_notes })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
