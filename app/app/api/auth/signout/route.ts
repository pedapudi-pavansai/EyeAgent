import { createClient } from '@/lib/supabase/server'
import { getPublicOrigin } from '@/lib/public-url'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', getPublicOrigin(req)))
}
