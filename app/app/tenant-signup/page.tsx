import { createAdminClient } from '@/lib/supabase/admin'
import TenantSignupForm from '@/components/TenantSignupForm'

export default async function TenantSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
          <p className="text-gray-500 mt-2">This invite link is missing required information.</p>
        </div>
      </div>
    )
  }

  const admin = createAdminClient()
  const { data: invite } = await admin
    .from('tenant_invites')
    .select('email, used')
    .eq('token', token)
    .single()

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Invite</h1>
          <p className="text-gray-500 mt-2">This invite link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  if (invite.used) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Already Used</h1>
          <p className="text-gray-500 mt-2">This invite has already been used. Please sign in.</p>
          <a href="/login" className="mt-4 inline-block text-brand hover:underline">
            Sign in
          </a>
        </div>
      </div>
    )
  }

  return <TenantSignupForm token={token} email={invite.email} />
}
