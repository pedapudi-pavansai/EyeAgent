import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Resolves auth user id for an email: prefer profiles.email (indexed app data), then paginate auth admin list.
 */
export async function findAuthUserIdByEmail(admin: AdminClient, email: string): Promise<string | null> {
  const trimmed = email.trim()
  if (!trimmed) return null
  const normalized = trimmed.toLowerCase()

  const { data: profile } = await admin.from('profiles').select('id').ilike('email', trimmed).maybeSingle()

  if (profile?.id) return profile.id

  let page = 1
  const perPage = 1000
  for (let i = 0; i < 20; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data?.users?.length) break
    const found = data.users.find(u => u.email?.toLowerCase() === normalized)
    if (found) return found.id
    if (data.users.length < perPage) break
    page += 1
  }

  return null
}

export function isDuplicateAuthEmailError(err: { message?: string; status?: number }): boolean {
  const m = (err.message ?? '').toLowerCase()
  return (
    err.status === 422 ||
    m.includes('already been registered') ||
    m.includes('already registered') ||
    m.includes('user already registered') ||
    m.includes('email address is already')
  )
}
