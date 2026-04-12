import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

/** Refreshes the auth cookie on each matched request so Server Components see the same session as the browser. */
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in Vercel → Project → Settings → Environment Variables (Production & Preview).'
    )
    return new NextResponse('Server configuration error', { status: 500 })
  }

  // Do not refresh the session on sign-out — avoids racing with the route handler's cleared cookies.
  if (request.nextUrl.pathname === '/api/auth/signout') {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      // Next.js 15+ Edge: `request.cookies` is read-only — do not call `request.cookies.set`
      // (throws → Vercel MIDDLEWARE_INVOCATION_FAILED). Only mirror cookies onto the response.
      setAll(cookiesToSet, headers) {
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
        if (headers && typeof headers === 'object') {
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, String(value))
          })
        }
      },
    },
  })

  // getUser() only catches AuthError; network / 5xx from Auth can throw and take down Edge middleware.
  let user: User | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error && data.user) user = data.user
  } catch (err) {
    console.error('[middleware] supabase.auth.getUser failed', err)
  }

  const path = request.nextUrl.pathname

  const needsAuth =
    path.startsWith('/dashboard') ||
    path.startsWith('/onboarding') ||
    path.startsWith('/marketplace') ||
    path.startsWith('/portal') ||
    path.startsWith('/diligence') ||
    path.startsWith('/properties')

  if (!user && needsAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user) {
    return supabaseResponse
  }

  let profileRole: string | undefined
  try {
    const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!error && data) profileRole = data.role
  } catch (err) {
    console.error('[middleware] profiles lookup failed', err)
  }

  // Missing profile or non-tenant: /portal is tenant-only (same as profile?.role !== 'tenant')
  if (path.startsWith('/portal') && profileRole !== 'tenant') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const landlordArea =
    path.startsWith('/dashboard') ||
    path.startsWith('/onboarding') ||
    path.startsWith('/marketplace') ||
    path.startsWith('/diligence') ||
    path.startsWith('/properties')

  if (landlordArea && profileRole === 'tenant') {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
