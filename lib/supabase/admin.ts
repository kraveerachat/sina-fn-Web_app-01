// ═══════════════════════════════════════════════════
// SINA_FN — Supabase Admin Client (server-only)
// ═══════════════════════════════════════════════════
// Uses the SERVICE ROLE key, so it BYPASSES Row Level
// Security. NEVER import this into a client component or
// expose the key to the browser — it is read from a
// server-only env var (no NEXT_PUBLIC_ prefix).
//
// Used by trusted server routes (e.g. the receipt-scan
// endpoint the mobile Edge Node calls) to update rows on
// behalf of a user without a browser session.
//
// The client is created LAZILY so a missing key only fails
// the request that needs it, not `next build` or unrelated
// routes.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('[supabase/admin] NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!serviceRoleKey) {
    throw new Error(
      '[supabase/admin] SUPABASE_SERVICE_ROLE_KEY is not set — add it to .env.local'
    );
  }

  cached = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
