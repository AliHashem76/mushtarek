import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const homeFor = (role: string) => (role === 'super_admin' ? '/super-admin' : '/dashboard')

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const redirect = (to: string) => {
    const r = NextResponse.redirect(new URL(to, request.url))
    response.cookies.getAll().forEach((c) => r.cookies.set(c))
    return r
  }

  const path = request.nextUrl.pathname
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return path === '/login' ? response : redirect('/login')

  const { data: profile } = await supabase
    .from('providers')
    .select('role, subscription_status, expires_at')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    return redirect('/login?error=noprofile')
  }

  const expired = profile.expires_at && new Date(profile.expires_at) < new Date()
  if (profile.role === 'provider' && (profile.subscription_status === 'suspended' || expired)) {
    await supabase.auth.signOut()
    return redirect('/login?error=suspended')
  }

  const home = homeFor(profile.role)
  if (path === '/' || path === '/login') return redirect(home)
  if (path.startsWith('/super-admin') && profile.role !== 'super_admin') return redirect(home)
  if (path.startsWith('/dashboard') && profile.role === 'super_admin') return redirect(home)

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth/|logo.png|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
}
