import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTenantInviteEmail } from '@/lib/email/send-tenant-invite'
import { isValidEmail } from '@/lib/email/validate-email'
import { getPublicOrigin } from '@/lib/public-url'

type AppRow = {
  property_id: string
  email: string | null
  full_name: string | null
  properties: { address: string } | null
}

export async function POST(req: NextRequest) {
  const { application_id, applicant_id } = await req.json()
  if (!application_id) {
    return NextResponse.json({ error: 'application_id is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: rawRow, error: fetchError } = await supabase
    .from('applications')
    .select('property_id, email, full_name, properties ( address )')
    .eq('id', application_id)
    .single()

  const appRow = rawRow as AppRow | null

  if (fetchError || !appRow) {
    return NextResponse.json({ error: fetchError?.message || 'Application not found' }, { status: 404 })
  }

  const hasApplicant = Boolean(applicant_id)
  if (!hasApplicant) {
    const email = (appRow.email ?? '').trim()
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Application has no valid email for tenant invite' },
        { status: 400 }
      )
    }
  }

  const { error: appError } = await supabase
    .from('applications')
    .update({ status: 'accepted' })
    .eq('id', application_id)

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 })
  }

  const { error: rejectOthersError } = await supabase
    .from('applications')
    .update({ status: 'rejected' })
    .eq('property_id', appRow.property_id)
    .neq('id', application_id)

  if (rejectOthersError) {
    return NextResponse.json({ error: rejectOthersError.message }, { status: 500 })
  }

  const admin = createAdminClient()


  if (applicant_id) {
    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: 'tenant' })
      .eq('id', applicant_id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  // Create a tenant invite so the applicant can sign up
  const { data: invite, error: inviteError } = await admin
    .from('tenant_invites')
    .insert({ application_id, email: appRow.email })
    .select('token')
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: inviteError?.message ?? 'Failed to create invite' }, { status: 500 })
  }

  const inviteUrl = `${getPublicOrigin(req)}/tenant-signup?token=${invite.token}`
  const inviteEmail = (appRow.email ?? '').trim()
  const propertyAddress = appRow.properties?.address

  const sendResult = await sendTenantInviteEmail({
    to: inviteEmail,
    inviteUrl,
    applicantName: appRow.full_name ?? undefined,
    propertyAddress,
  })

  if (sendResult.ok) {
    return NextResponse.json({ success: true, inviteSent: true, inviteEmail })
  }

  console.error('[accept] Tenant invite email failed:', sendResult.error)
  return NextResponse.json({
    success: true,
    inviteSent: false,
    inviteEmail,
    inviteUrl,
  })
}
