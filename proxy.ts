// ═══════════════════════════════════════════════════════════════════
// SINA_FN — Route Protection Proxy (Next.js 16)
//
// Three user scenarios:
//
// 1. NEW USER (unregistered):
//    /login → /onboarding/welcome → /register → /onboarding/pin-setup → /login
//
// 2. EXISTING USER (new session):
//    /login → successful auth → /pin-verify → Dashboard
//
// 3. RETURNING USER (active session, locked/idle):
//    → /pin-verify → Dashboard
//
// Decision matrix:
//
//   State ╲ Route       │ Public*         │ /onboarding/pin-setup │ /pin-verify │ Dashboard/*
//   ────────────────────┼─────────────────┼───────────────────────┼─────────────┼────────────
//   No session          │ ✅ allow        │ → /login              │ → /login    │ → /login
//   Session, no PIN     │ → /onboard/pin  │ ✅ allow              │ → /onb/pin  │ → /onb/pin
//   Session, PIN, !cookie│ → /pin-verify  │ → /pin-verify         │ ✅ allow    │ → /pin-verify
//   Fully verified      │ → /             │ → /                   │ → /         │ ✅ allow
//
//   * Public = /login, /register, /onboarding/welcome
//
// Loop prevention: safeRedirect() never redirects to the current pathname.
// ═══════════════════════════════════════════════════════════════════

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Route classification ─────────────────────────────────────────
// Public: accessible WITHOUT a session (pre-login & pre-register)
const PUBLIC_ROUTES = ['/login', '/register', '/onboarding/welcome'];

function isPublicRoute(p: string)    { return PUBLIC_ROUTES.includes(p); }
function isPinSetupRoute(p: string)  { return p === '/onboarding/pin-setup'; }
function isPinVerifyRoute(p: string) { return p === '/pin-verify'; }

// ── Safe redirect (prevents infinite loops) ──────────────────────
function safeRedirect(request: NextRequest, target: string): NextResponse {
  if (request.nextUrl.pathname === target) return NextResponse.next({ request });
  return NextResponse.redirect(new URL(target, request.url));
}

// ── Proxy ─────────────────────────────────────────────────────────
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, images, API routes, and files with extensions
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ── Build mutable response (required so @supabase/ssr can refresh cookies) ─
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
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

  // ── 1. Validate session via getUser() (secure, hits Supabase auth) ─
  const { data: { user } } = await supabase.auth.getUser();

  // ── 2. NOT AUTHENTICATED ───────────────────────────────────────────
  if (!user) {
    if (isPublicRoute(pathname)) return response;
    return safeRedirect(request, '/onboarding/welcome');
  }

  // ── 3. AUTHENTICATED — fetch profile to check PIN state ────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('pin_hash')
    .eq('id', user.id)
    .single();

  const hasPinSet      = !!profile?.pin_hash;
  const hasPinVerified = request.cookies.get('pin_verified')?.value === 'true';

  // ── 4. PIN not set → must complete PIN setup ───────────────────────
  //    This covers freshly registered users who haven't set a PIN yet.
  if (!hasPinSet) {
    if (isPinSetupRoute(pathname)) return response;
    return safeRedirect(request, '/onboarding/pin-setup');
  }

  // ── 5. PIN set but not verified this session ───────────────────────
  //    Covers: new login, returning user with expired/missing cookie,
  //    or app lock after idle timeout.
  if (!hasPinVerified) {
    if (isPinVerifyRoute(pathname)) return response;
    return safeRedirect(request, '/pin-verify');
  }

  // ── 6. FULLY VERIFIED — redirect away from auth/onboarding pages ──
  //    Prevent verified users from accessing login/register/pin screens.
  if (isPublicRoute(pathname) || isPinSetupRoute(pathname) || isPinVerifyRoute(pathname)) {
    return safeRedirect(request, '/');
  }

  // ── 7. All good — serve the requested dashboard page ───────────────
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
