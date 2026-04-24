import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip static/api assets ──────────────────────────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ── Route flags ─────────────────────────────────────────────────────────
  const isAuthPage   = pathname === '/login' || pathname === '/register';
  const isOnboarding = pathname.startsWith('/onboarding');
  const isPinVerify  = pathname === '/pin-verify';
  const isDashboard  = pathname === '/' || pathname.startsWith('/settings') ||
                       pathname.startsWith('/wallets') || pathname.startsWith('/history') ||
                       pathname.startsWith('/budgets') || pathname.startsWith('/ai-chat') ||
                       pathname.startsWith('/net-worth') || pathname.startsWith('/debt-timeline') ||
                       pathname.startsWith('/monthly-bills');

  // ── Build mutable response (required so @supabase/ssr can refresh cookies) ─
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Write refreshed auth cookies back to response
          cookiesToSet.forEach(({ name, value, options: _opts }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // ── Get authenticated user (reads from Supabase cookies set by createBrowserClient) ─
  const { data: { user } } = await supabase.auth.getUser();

  // ── 1. Not logged in ─────────────────────────────────────────────────────
  if (!user) {
    if (isAuthPage || isOnboarding) return response; // allow login/register/onboarding
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── 2. Logged in → check profile ─────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, pin_hash')
    .eq('id', user.id)
    .single();

  // ── 3. Logged in + on auth page → redirect away ───────────────────────────
  if (isAuthPage) {
    if (!profile)          return NextResponse.redirect(new URL('/onboarding/welcome', request.url));
    if (!profile.pin_hash) return NextResponse.redirect(new URL('/onboarding/pin-setup', request.url));
    return NextResponse.redirect(new URL('/pin-verify', request.url));
  }

  // ── 4. Onboarding access control ─────────────────────────────────────────
  if (isOnboarding) {
    if (profile?.pin_hash) return NextResponse.redirect(new URL('/pin-verify', request.url));
    if (profile && pathname !== '/onboarding/pin-setup') {
      return NextResponse.redirect(new URL('/onboarding/pin-setup', request.url));
    }
    return response;
  }

  // ── 5. No profile → must complete onboarding ─────────────────────────────
  if (!profile) {
    return NextResponse.redirect(new URL('/onboarding/welcome', request.url));
  }

  // ── 6. Has profile but no PIN → must set PIN ──────────────────────────────
  if (!profile.pin_hash) {
    return NextResponse.redirect(new URL('/onboarding/pin-setup', request.url));
  }

  // ── 7. Has PIN + on pin-verify → allow ────────────────────────────────────
  if (isPinVerify) return response;

  // ── 8. Has PIN + dashboard → require pin_verified cookie ──────────────────
  if (isDashboard) {
    const pinVerified = request.cookies.get('pin_verified')?.value;
    if (!pinVerified) return NextResponse.redirect(new URL('/pin-verify', request.url));
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
