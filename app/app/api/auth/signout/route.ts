import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Sign out must attach cleared auth cookies to the same Response we return.
 * Using the shared `createClient()` + `cookies()` from `next/headers` often fails to
 * persist Set-Cookie on redirects from Route Handlers.
 */
export async function POST(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)

  let response = NextResponse.redirect(loginUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.signOut()
  return response
}
