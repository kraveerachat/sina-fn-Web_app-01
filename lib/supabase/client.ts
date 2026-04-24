// ═══════════════════════════════════════════════════
// SINA_FN — Supabase Browser Client (SSR-compatible)
// ═══════════════════════════════════════════════════
// Uses createBrowserClient from @supabase/ssr so that
// auth tokens are stored in COOKIES (not localStorage).
// This allows proxy.ts to read the session server-side.

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
