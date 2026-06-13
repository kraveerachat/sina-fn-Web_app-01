import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// ═══════════════════════════════════════════════════════════════════
// Receipt Scan Endpoint — Enterprise Financial OCR (Gemini 2.5 Flash)
//
// The Android Edge Node POSTs a captured receipt photo for one pending
// transaction. We OCR it with a structured (generateObject) call, then
// patch the row with the itemised result.
//
//   POST { transaction_id, expected_amount, image_base64 }
//   → items[] + main_category, then transactions.items / status update.
//
// Auth: x-ingest-secret must match INGEST_API_SECRET. Service-role key
// and secrets NEVER appear in any response body.
// ═══════════════════════════════════════════════════════════════════

export const runtime = 'nodejs';
export const maxDuration = 60;

// ── Request contract from the mobile scanner ──
const RequestSchema = z.object({
  transaction_id: z.string().min(1),
  expected_amount: z.number().nonnegative(),
  image_base64: z.string().min(1),
});

// ── Structured output Gemini must produce ──
const ReceiptSchema = z.object({
  main_category: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      category: z.string(),
    }),
  ),
});

// Accept the photo whether or not the client kept the data-URL prefix.
function toDataUrl(input: string): string {
  return input.startsWith('data:') ? input : `data:image/jpeg;base64,${input}`;
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.INGEST_API_SECRET;
  if (!expected) {
    console.warn(
      '[scan-receipt] INGEST_API_SECRET is not set — endpoint is UNPROTECTED. Set it in .env.local.',
    );
    return true;
  }
  return req.headers.get('x-ingest-secret') === expected;
}

export async function POST(req: NextRequest) {
  // ── Server config ──
  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch (err) {
    console.error('[scan-receipt] admin client unavailable:', err);
    return NextResponse.json(
      { success: false, message: 'Server is not configured for receipt scanning.' },
      { status: 500 },
    );
  }

  // ── Zero Trust ──
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  // ── Validate payload ──
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: 'Invalid request body.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { transaction_id, expected_amount, image_base64 } = parsed.data;

  // ── Confirm the target row exists (and learn its current status) ──
  const { data: tx, error: txErr } = await admin
    .from('transactions')
    .select('id, status')
    .eq('id', transaction_id)
    .maybeSingle();

  if (txErr) {
    console.error('[scan-receipt] lookup failed:', txErr.message);
    return NextResponse.json(
      { success: false, message: 'Could not load the transaction.' },
      { status: 500 },
    );
  }
  if (!tx) {
    return NextResponse.json(
      { success: false, message: 'Transaction not found.' },
      { status: 404 },
    );
  }

  // ── AI OCR (structured) ──
  const systemPrompt = `คุณคือ Enterprise Financial OCR สแกนภาพใบเสร็จ สกัดรายการย่อย (items) โดยบังคับให้ผลรวมของทุกไอเทมต้องใกล้เคียงหรือเท่ากับ ${expected_amount} บาท หากเป็นสลิปโอนเงิน ให้ดึงข้อมูลมาเป็น 1 item. จำแนกหมวดหมู่หลัก (main_category) ของบิลใบนี้ ใช้ภาษาไทยสำหรับชื่อรายการและหมวดหมู่ amount เป็นตัวเลขบวกหน่วยบาท`;

  let aiResult: z.infer<typeof ReceiptSchema>;
  try {
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: ReceiptSchema,
      system: systemPrompt,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `ยอดที่หักจริง = ${expected_amount} บาท` },
            { type: 'image', image: toDataUrl(image_base64) },
          ],
        },
      ],
    });
    aiResult = object;
  } catch (err) {
    // The model could not read the image or produce the schema.
    console.warn('[scan-receipt] OCR failed:', err);
    return NextResponse.json(
      { success: false, message: 'อ่านภาพใบเสร็จไม่สำเร็จ กรุณาถ่ายใหม่ให้ชัดขึ้น' },
      { status: 400 },
    );
  }

  if (aiResult.items.length === 0) {
    return NextResponse.json(
      { success: false, message: 'ไม่พบรายการในใบเสร็จ กรุณาถ่ายใหม่' },
      { status: 400 },
    );
  }

  // ── Reconciliation: reject if the itemised total is too far off ──
  const itemsTotal = aiResult.items.reduce((s, i) => s + (i.amount || 0), 0);
  const difference = Math.abs(itemsTotal - expected_amount);
  const tolerance = Math.max(5, expected_amount * 0.1); // 10% or ฿5, whichever is larger
  if (expected_amount > 0 && difference > tolerance) {
    return NextResponse.json(
      {
        success: false,
        message: 'ยอดรวมรายการไม่ตรงกับยอดที่หักจริงมากเกินไป',
        reconciliation: { expected_amount, items_total: itemsTotal, difference },
      },
      { status: 400 },
    );
  }

  // ── Persist (service role). Complete the row only if it was pending. ──
  const updatePayload: { items: typeof aiResult.items; status?: string } = {
    items: aiResult.items,
  };
  if (tx.status === 'pending_scan') updatePayload.status = 'completed';

  const { data: updated, error: updErr } = await admin
    .from('transactions')
    .update(updatePayload)
    .eq('id', transaction_id)
    .select('id, items, status')
    .single();

  if (updErr) {
    console.error('[scan-receipt] update failed:', updErr.message);
    return NextResponse.json(
      { success: false, message: 'บันทึกผลการสแกนไม่สำเร็จ' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      transaction: updated,
      main_category: aiResult.main_category,
      items: aiResult.items,
      reconciliation: {
        expected_amount,
        items_total: itemsTotal,
        difference: Number(difference.toFixed(2)),
      },
    },
  });
}
