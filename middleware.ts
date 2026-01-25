import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/dashboard') || pathname.startsWith('/dashboard/api')) {
    return response
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }

  // Fetch profile - handle case where profile doesn't exist yet (e.g., anonymous user)
  const { data: rawProfile, error: profileError } = await supabase
    .from('profiles')
    .select('system_role, subscription_plan')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist (PGRST116 = no rows returned), allow access
  // Profile will be created by trigger or AuthContext
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('[Middleware] Error fetching profile:', profileError);
    // Continue anyway - profile might be created by trigger
  }

  const { data: navItems } = await supabase
    .from('navigation_items')
    .select('path, allowed_roles, is_active')

  if (!navItems || navItems.length === 0) {
    return response
  }

  const matches = navItems
    .filter(item => item.is_active)
    .filter(item => pathname === item.path || pathname.startsWith(`${item.path}/`))
    .sort((a, b) => (b.path?.length || 0) - (a.path?.length || 0))

  if (matches.length === 0) {
    return response
  }

  const tokens = new Set<string>()
  if (rawProfile?.subscription_plan) {
    tokens.add(rawProfile.subscription_plan.toUpperCase())
  }
  if (rawProfile?.system_role) {
    tokens.add(rawProfile.system_role.toUpperCase())
  }

  const isAllowed = matches[0].allowed_roles?.some(role => tokens.has(role.toUpperCase()))

  if (!isAllowed) {
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
