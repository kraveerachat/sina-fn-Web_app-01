'use client';

// ═══════════════════════════════════════════════════════════════════
// Debts — matches the design prototype (page_debts.jsx):
// page head + pill-primary add button, summary card (green paid-off
// ring + total remaining + min/month + account count), then one tile
// per debt: tinted icon, due-day gold badge, remaining/min figures,
// and a green paid-off track. Add/delete Supabase flows unchanged.
// The prototype's "ชำระเงิน" button is omitted — no payment flow
// exists in the backend yet; no dead buttons.
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, X, Save, Trash2, Loader2,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Ring from '@/components/ui/Ring';
import { useAuth } from '@/hooks/useAuth';
import { useDebts } from '@/hooks/useDebts';
import { createDebt, deleteDebt, formatSupabaseError } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

// debts have no stored color — cycle a quiet palette for icon tints
const DEBT_COLORS = ['#b7892f', '#1f4287', '#5b6b86', '#8a6d57'];

const inputCls =
  'w-full rounded-[14px] border border-(--border) bg-(--surface-2) px-3.5 py-2.5 text-sm text-(--text) outline-none transition-[border-color,box-shadow] focus:border-(--blue) focus:shadow-[0_0_0_3px_var(--blue-soft)] placeholder:text-(--text-3)';

export default function DebtTimelinePage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { debts, loading, refetch } = useDebts(userId);
  const pageRef = useRef<HTMLDivElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newRemaining, setNewRemaining] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newMinPayment, setNewMinPayment] = useState('');
  const [newDueDay, setNewDueDay] = useState('');

  const totalRemain = useMemo(() => debts.reduce((s, d) => s + d.remaining_amount, 0), [debts]);
  const totalMin = useMemo(() => debts.reduce((s, d) => s + (d.minimum_payment ?? 0), 0), [debts]);
  const totalOrig = useMemo(() => debts.reduce((s, d) => s + d.total_amount, 0), [debts]);
  const paidPct = totalOrig > 0 ? Math.round(((totalOrig - totalRemain) / totalOrig) * 100) : 0;

  // ── Stagger reveal ──
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rows = gsap.utils.toArray<HTMLElement>('.debt-row', pageRef.current);
      if (rows.length === 0) return;
      gsap.fromTo(rows,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.08, delay: 0.05 }
      );
    },
    { scope: pageRef, dependencies: [loading, debts] }
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || saving) return;

    const total = Number(newTotal);
    const remaining = Number(newRemaining) || total;

    try {
      setSaving(true);
      await createDebt({
        user_id: userId,
        name: newName,
        total_amount: total,
        remaining_amount: remaining,
        principal_amount: null,
        interest_rate: Number(newRate) || null,
        minimum_payment: Number(newMinPayment) || null,
        due_day: Number(newDueDay) || null,
        total_installments: null,
        remaining_installments: null,
      }, userId);
      setIsAdding(false);
      setNewName(''); setNewTotal(''); setNewRemaining(''); setNewRate(''); setNewMinPayment(''); setNewDueDay('');
      await refetch();
      window.dispatchEvent(new Event('app_mutate'));
    } catch (err) {
      console.error('[DebtTimeline] add error:', formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDebt(id);
      await refetch();
      window.dispatchEvent(new Event('app_mutate'));
    } catch (err) {
      console.error('[DebtTimeline] delete error:', formatSupabaseError(err));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="cyber-skeleton h-16 w-1/3 rounded-2xl" />
        <div className="cyber-skeleton h-32 rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="cyber-skeleton h-56 rounded-3xl" />
          <div className="cyber-skeleton h-56 rounded-3xl" />
          <div className="cyber-skeleton h-56 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col gap-4">
      {/* ── Page head ── */}
      <div className="mb-1 mt-1.5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.025em] text-(--text) lg:text-[30px]">
            หนี้สิน
          </h1>
          <p className="mt-1 text-[14.5px] text-(--text-2)">ปลดหนี้ทีละก้อน อย่างมีแผน</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`press tap shrink-0 ${isAdding ? 'pill pill-ghost' : 'pill pill-primary'}`}
        >
          {isAdding ? <X /> : <Plus />}
          {isAdding ? 'ยกเลิก' : 'เพิ่มหนี้'}
        </button>
      </div>

      {/* ── Summary card ── */}
      {debts.length > 0 && (
        <div className="debt-row rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-[18px]">
              <Ring pct={paidPct} color="var(--green)">
                <span className="tnum text-lg font-bold tracking-[-0.01em] text-(--text)">{paidPct}%</span>
              </Ring>
              <div>
                <p className="eyebrow">หนี้คงเหลือรวม</p>
                <p className="tnum mt-1 text-[30px] font-bold leading-none tracking-[-0.025em] text-(--expense)">
                  {formatCurrency(totalRemain)}
                </p>
              </div>
            </div>
            <div className="flex gap-[30px]">
              <div>
                <p className="text-xs text-(--text-3)">ขั้นต่ำ/เดือน</p>
                <p className="tnum mt-1 text-[22px] font-bold text-(--text)">{formatCurrency(totalMin)}</p>
              </div>
              <div>
                <p className="text-xs text-(--text-3)">จำนวนบัญชี</p>
                <p className="tnum mt-1 text-[22px] font-bold text-(--text)">{debts.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleAdd} className="flex flex-col gap-4 rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-(--text)">เพิ่มหนี้ใหม่</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">ชื่อหนี้</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น สินเชื่อบ้าน SCB" className={inputCls} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">ยอดรวม (฿)</label>
                  <input type="number" value={newTotal} onChange={(e) => setNewTotal(e.target.value)}
                    placeholder="0.00" className={`${inputCls} tnum`} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">ยอดคงเหลือ (฿)</label>
                  <input type="number" value={newRemaining} onChange={(e) => setNewRemaining(e.target.value)}
                    placeholder="เท่ากับยอดรวม" className={`${inputCls} tnum`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">ดอกเบี้ย (%/ปี)</label>
                  <input type="number" step="0.1" value={newRate} onChange={(e) => setNewRate(e.target.value)}
                    placeholder="0.0" className={`${inputCls} tnum`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">ยอดจ่ายขั้นต่ำ (฿)</label>
                  <input type="number" value={newMinPayment} onChange={(e) => setNewMinPayment(e.target.value)}
                    placeholder="0.00" className={`${inputCls} tnum`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">วันครบกำหนด (วันที่)</label>
                  <input type="number" min={1} max={31} value={newDueDay} onChange={(e) => setNewDueDay(e.target.value)}
                    placeholder="1-31" className={`${inputCls} tnum`} />
                </div>
              </div>
              <div className="flex justify-end border-t border-(--border-2) pt-4">
                <button type="submit" disabled={saving} className="pill pill-primary press tap">
                  {saving ? <Loader2 className="animate-spin" /> : <Save />} บันทึก
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Debt tiles ── */}
      {debts.length === 0 && !isAdding ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--border) bg-(--surface) py-12">
          <span className="mb-3 text-3xl">🎉</span>
          <p className="text-sm font-medium text-(--green)">ปลอดหนี้!</p>
          <p className="mt-1 text-xs text-(--text-3)">กด &quot;เพิ่มหนี้&quot; หากต้องการเริ่มติดตามหนี้สิน</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {debts.map((debt, i) => {
            const color = DEBT_COLORS[i % DEBT_COLORS.length];
            const pct = debt.total_amount > 0
              ? Math.round(((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100)
              : 0;
            return (
              <div
                key={debt.id}
                className="debt-row press flex flex-col rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow) transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-lg)"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px]"
                      style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
                    >
                      <CreditCard size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15.5px] font-semibold text-(--text)">{debt.name}</h3>
                      <p className="text-xs text-(--text-3)">
                        {debt.interest_rate != null ? `ดอกเบี้ย ${debt.interest_rate}%` : 'ไม่มีดอกเบี้ย'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(debt.id)}
                    title="ลบ"
                    aria-label="ลบหนี้"
                    className="press tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-(--text-3) transition-colors hover:bg-(--red-soft) hover:text-(--red)"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {debt.due_day != null && (
                  <span className="mb-4 inline-flex w-fit items-center rounded-full bg-(--gold-soft) px-2.5 py-1 text-[11px] font-semibold text-(--gold)">
                    ครบกำหนดทุกวันที่ {debt.due_day}
                  </span>
                )}

                {/* Figures */}
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="eyebrow">คงเหลือ</p>
                    <p className="tnum mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] text-(--expense)">
                      {formatCurrency(debt.remaining_amount)}
                    </p>
                  </div>
                  {debt.minimum_payment != null && (
                    <div className="text-right">
                      <p className="eyebrow">ขั้นต่ำ</p>
                      <p className="tnum mt-1 text-[16px] font-semibold leading-none text-(--text)">
                        {formatCurrency(debt.minimum_payment)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Paid-off track */}
                <div className="mt-4">
                  <div className="mb-[7px] flex items-center justify-between">
                    <span className="text-xs text-(--text-3)">ชำระแล้ว</span>
                    <span className="tnum text-[12.5px] font-semibold text-(--green)">{pct}%</span>
                  </div>
                  <div className="track green">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <p className="tnum mt-1.5 text-right text-[11px] text-(--text-3)">
                    {formatCurrency(debt.total_amount - debt.remaining_amount)} / {formatCurrency(debt.total_amount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
