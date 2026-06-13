import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// ═══════════════════════════════════════════════════════════════════
// Pending transactions feed
//
// The mobile foreground UI polls this to show debits that were captured
// by the Edge Node but still need a receipt scan (status = pending_scan).
// Same Zero-Trust shared-secret gate as the ingestion route.
// ═══════════════════════════════════════════════════════════════════

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // never cache a live feed

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.INGEST_API_SECRET;
  if (!expected) {
    console.warn(
      '[pending] INGEST_API_SECRET is not set — endpoint is UNPROTECTED. Set it in .env.local.'
    );
    return true;
  }
  return req.headers.get('x-ingest-secret') === expected;
}

export async function GET(req: NextRequest) {
  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch (err) {
    console.error('[pending] admin client unavailable:', err);
    return NextResponse.json(
      { success: false, message: 'Server is not configured.' },
      { status: 500 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized.' },
      { status: 401 }
    );
  }

  try {
    const { data, error } = await admin
      .from('transactions')
      .select('id, amount, bank_ref, note, status, transaction_date, source')
      .eq('status', 'pending_scan')
      .order('transaction_date', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`query failed: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('[pending] error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
