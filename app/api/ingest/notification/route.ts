import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// ═══════════════════════════════════════════════════════════════════
// Notification Ingestion Gateway
//
// The Android Edge Node POSTs captured bank-debit notifications here
// instead of writing to Supabase directly. This keeps the service-role
// key server-side only and lets RLS stay strict — the mobile binary
// never holds DB credentials.
//
// Auth: when INGEST_API_SECRET is set, callers MUST send a matching
// `x-ingest-secret` header (shared secret, Zero Trust). If it is unset
// the route still works but logs a warning, so local dev isn't blocked
// before the secret is provisioned.
// ═══════════════════════════════════════════════════════════════════

export const runtime = 'nodejs';

const BodySchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().positive(),
  bank_ref: z.string().min(1).max(128),
  raw_text: z.string().max(4000).optional(),
});

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.INGEST_API_SECRET;
  if (!expected) {
    console.warn(
      '[ingest] INGEST_API_SECRET is not set — endpoint is UNPROTECTED. Set it in .env.local.'
    );
    return true;
  }
  return req.headers.get('x-ingest-secret') === expected;
}

export async function POST(req: NextRequest) {
  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch (err) {
    console.error('[ingest] admin client unavailable:', err);
    return NextResponse.json(
      { success: false, message: 'Server is not configured for ingestion.' },
      { status: 500 }
    );
  }

  // ── Zero Trust: reject before reading the body ──
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body.', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // raw_text is accepted (and validated) for future audit use, but is
    // not persisted — there is no raw_text column on `transactions`.
    const { user_id, amount, bank_ref } = parsed.data;

    const { data, error } = await admin
      .from('transactions')
      .insert({
        user_id,
        amount,
        type: 'expense',
        status: 'pending_scan',
        source: 'mobile_listener',
        bank_ref,
        note: 'รายการอัตโนมัติรอการจัดการ',
        transaction_date: new Date().toISOString(),
        is_ai_generated: false,
      })
      .select('id, amount, status, bank_ref')
      .single();

    if (error) {
      throw new Error(`insert failed: ${error.message}`);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('[ingest] error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
