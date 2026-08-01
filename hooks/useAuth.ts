// ═══════════════════════════════════════════════════════════════════
// hooks/useAuth.ts — Authentication State Hook
//
// Single abstraction for Supabase auth. Subscribe once, share state.
// Handles: current user, session, auth events, and sign-out flow.
//
// Usage:
//   const { user, loading, signOut } = useAuth();
//   if (loading) return <Loader />;
//   if (!user) return <LoginPage />;
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export interface AuthState {
  /** Authenticated Supabase user, or null if not logged in */
  user: User | null;
  /** Full Supabase session object — includes access_token, expires_at, etc. */
  session: Session | null;
  /** True while the initial auth check is in progress */
  loading: boolean;
  /** True if user is confirmed authenticated (not loading, user exists) */
  isAuthenticated: boolean;
  /** Sign out from Supabase and clear PIN cookie */
  signOut: () => Promise<void>;
  /** Re-check the current session (useful after token refresh) */
  refresh: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Initial session check ──
  const refresh = useCallback(async () => {
    try {
      // getUser() validates the JWT server-side — safer than getSession()
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      setUser(freshUser);

      // Also update session for access_token availability
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      setSession(freshSession);
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Get initial user on mount
    refresh();

    // 2. Subscribe to auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Ensure loading is cleared on any auth event
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [refresh]);

  // ── Sign out: clear Supabase session + PIN cookie ──
  const signOut = useCallback(async () => {
    // Clear PIN session cookies
    document.cookie = 'pin_verified=; path=/; max-age=0';
    document.cookie = 'auth-session=; path=/; max-age=0';
    // Sign out from Supabase (triggers onAuthStateChange → SIGNED_OUT)
    await supabase.auth.signOut();
    // Redirect to welcome onboarding
    window.location.href = '/onboarding/welcome';
  }, []);

  return {
    user,
    session,
    loading,
    isAuthenticated: !loading && user !== null,
    signOut,
    refresh,
  };
}
