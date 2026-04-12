import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runScoringAgent } from '@/lib/ai/scoring-agent'

export async function POST(req: NextRequest) {
  let body: {
    property_id?: string
    token?: string
    full_name?: string
    email?: string
    phone?: string
    employer?: string
    job_title?: string
    annual_income?: number
    fico_score?: number
    monthly_debts?: number
    rental_history?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    property_id,
    token,
    full_name,
    email,
    phone,
    employer,
    job_title,
    annual_income,
    fico_score,
    monthly_debts,
    rental_history,
  } = body

  if (!property_id || !token) {
    return NextResponse.json({ error: 'property_id and token are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: tokenRow, error: tokenError } = await admin
    .from('application_tokens')
    .select('id, expires_at')
    .eq('token', token)
    .eq('property_id', property_id)
    .maybeSingle()

  if (tokenError || !tokenRow || new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired application link' }, { status: 403 })
  }

  const { data: inserted, error: insertError } = await admin
    .from('applications')
    .insert({
      property_id,
      full_name: full_name ?? '',
      email: email ?? '',
      phone: phone ?? '',
      employer: employer ?? '',
      job_title: job_title ?? '',
      annual_income: annual_income ?? 0,
      fico_score: fico_score ?? 0,
      monthly_debts: monthly_debts ?? 0,
      rental_history: rental_history ?? [],
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to save application' },
      { status: 500 }
    )
  }

  try {
    await runScoringAgent(inserted.id)
  } catch {
    // Application row exists; scoring can be retried manually if needed
  }

  return NextResponse.json({ id: inserted.id })
}
