import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findAuthUserIdByEmail, isDuplicateAuthEmailError } from '@/lib/auth/find-auth-user-by-email'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'token and password are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: invite, error: inviteError } = await admin
    .from('tenant_invites')
    .select('id, email, used, application_id')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid invite link' }, { status: 400 })
  }

  if (invite.used) {
    return NextResponse.json({ error: 'This invite link has already been used' }, { status: 400 })
  }

  const email = invite.email.trim()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  let userId: string

  if (authError) {
    if (!isDuplicateAuthEmailError(authError)) {
      return NextResponse.json({ error: authError.message ?? 'Failed to create account' }, { status: 500 })
    }

    const existingId = await findAuthUserIdByEmail(admin, email)
    if (!existingId) {
      return NextResponse.json(
        {
          error:
            'An account with this email already exists. Sign in with your existing password, or use the password reset link on the login page.',
        },
        { status: 409 }
      )
    }

    const { error: updateErr } = await admin.auth.admin.updateUserById(existingId, {
      password,
      email_confirm: true,
    })
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message ?? 'Failed to set password' }, { status: 500 })
    }
    userId = existingId
  } else {
    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }
    userId = authData.user.id
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      role: 'tenant',
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  await admin.from('applications').update({ applicant_id: userId }).eq('id', invite.application_id)

  await admin.from('tenant_invites').update({ used: true }).eq('id', invite.id)

  return NextResponse.json({ success: true })
}
