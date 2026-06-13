'use client';

// ═══════════════════════════════════════════════════════════════════
// Monthly Bills — matches the design prototype (page_bills.jsx):
// three stat cards (total / paid / due), then a single "all bills"
// card listing each bill as a hairline-divided row with a status
// badge and a จ่าย / จ่ายแล้ว toggle pill. Supabase flows unchanged.
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Plus, X, Save, Loader2, Check, CalendarDays,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useAuth } from '@/hooks/useAuth';
import { useBills } from '@/hooks/useBills';
import { createBill, toggleBillPaid, formatSupabaseError } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/utils';
import type { MonthlyBill } from '@/types';

gsap.registerPlugin(ScrollTrigger);

type BillStatus = 'paid' | 'overdue' | 'upcoming';

function getBillStatus(bill: MonthlyBill): BillStatus {
  if (bill.is_paid) return 'paid';
  const today = new Date().getDate();
  return (bill.due_day ?? 1) < today ? 'overdue' : 'upcoming';
}

// prototype badge palette: paid=green, overdue=gold, upcoming=blue
const STATUS_META: Record<BillStatus, { label: string; cls: string }> = {
  paid:     { label: 'จ่ายแล้ว',  cls: 'bg-(--green-soft) text-(--green)' },
  overdue:  { label: 'เลยกำหนด', cls: 'bg-(--gold-soft) text-(--gold)' },
  upcoming: { label: 'รอจ่าย',    cls: 'bg-(--blue-soft) text-(--blue)' },
};

const inputCls =
  'w-full rounded-[14px] border border-(--border) bg-(--surface-2) px-3.5 py-2.5 text-sm text-(--text) outline-none transition-[border-color,box-shadow] focus:border-(--blue) focus:shadow-[0_0_0_3px_var(--blue-soft)] placeholder:text-(--text-3)';

export default function MonthlyBillsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { bills, loading, refetch } = useBills(userId);
  const pageRef = useRef<HTMLDivElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDay, setNewDueDay] = useState('');

  const totalMonthly = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills]);
  const totalPaid = useMemo(() => bills.filter((b) => b.is_paid).reduce((s, b) => s + b.amount, 0), [bills]);
  const totalDue = totalMonthly - totalPaid;

  const sortedBills = useMemo(
    () => [...bills].sort((a, b) => (a.due_day ?? 1) - (b.due_day ?? 1)),
    [bills]
  );

  const handleTogglePaid = async (id: string) => {
    try {
      await toggleBillPaid(id);
      await refetch();
      window.dispatchEvent(new Event('app_mutate'));
    } catch (err) {
      console.error('[MonthlyBills] toggle error:', formatSupabaseError(err));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || saving) return;

    try {
      setSaving(true);
      await createBill({
        user_id: userId,
        name: newName,
        amount: Number(newAmount),
        due_day: Number(newDueDay) || null,
        is_paid: false,
      }, userId);
      setIsAdding(false);
      setNewName(''); setNewAmount(''); setNewDueDay('');
      await refetch();
      window.dispatchEvent(new Event('app_mutate'));
    } catch (err) {
      console.error('[MonthlyBills] add error:', formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Stagger reveal ──
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const sections = gsap.utils.toArray<HTMLElement>('.bills-section', pageRef.current);
      if (sections.length === 0) return;
      gsap.fromTo(sections,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1, delay: 0.05 }
      );
    },
    { scope: pageRef, dependencies: [loading] }
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="cyber-skeleton h-16 w-1/3 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="cyber-skeleton h-24 rounded-3xl" />
          <div className="cyber-skeleton h-24 rounded-3xl" />
          <div className="cyber-skeleton h-24 rounded-3xl" />
        </div>
        <div className="cyber-skeleton h-80 rounded-3xl" />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col gap-4">
      {/* ── Page head ── */}
      <div className="mb-1 mt-1.5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.025em] text-(--text) lg:text-[30px]">
            บิลรายเดือน
          </h1>
          <p className="mt-1 text-[14.5px] text-(--text-2)">บิลประจำเดือน ไม่มีพลาดอีกต่อไป</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`press tap shrink-0 ${isAdding ? 'pill pill-ghost' : 'pill pill-primary'}`}
        >
          {isAdding ? <X /> : <Plus />}
          {isAdding ? 'ยกเลิก' : 'เพิ่มบิล'}
        </button>
      </div>

      {/* ── Summary stats ── */}
      <div className="bills-section grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
          <p className="eyebrow">รวมทั้งหมด</p>
          <p className="tnum mt-1.5 text-[30px] font-bold leading-none tracking-[-0.025em] text-(--text)">
            {formatCurrency(totalMonthly)}
          </p>
        </div>
        <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
          <p className="eyebrow">จ่ายแล้ว</p>
          <p className="tnum mt-1.5 text-[30px] font-bold leading-none tracking-[-0.025em] text-(--green)">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
          <p className="eyebrow">ค้างจ่าย</p>
          <p className="tnum mt-1.5 text-[30px] font-bold leading-none tracking-[-0.025em] text-(--gold)">
            {formatCurrency(totalDue)}
          </p>
        </div>
      </div>

      {/* ── Add form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleAdd} className="flex flex-col gap-4 rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-(--text)">เพิ่มบิลใหม่</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">ชื่อบิล</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น ค่าไฟ, Netflix" className={inputCls} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">จำนวนเงิน (฿)</label>
                  <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00" className={`${inputCls} tnum`} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">วันครบกำหนด (วันที่)</label>
                  <input type="number" min={1} max={31} value={newDueDay} onChange={(e) => setNewDueDay(e.target.value)}
                    placeholder="1-31" className={`${inputCls} tnum`} required />
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

      {/* ── All bills card ── */}
      <div className="bills-section rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-sm font-semibold tracking-[-0.01em] text-(--text)">รายการบิล</p>
          <p className="tnum text-xs text-(--text-3)">{bills.length} รายการ</p>
        </div>

        {bills.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <span className="mb-3 text-3xl">🧾</span>
            <p className="text-sm text-(--text-2)">ยังไม่มีบิล</p>
            <p className="mt-1 text-xs text-(--text-3)">กด &quot;เพิ่มบิล&quot; เพื่อเริ่มติดตาม</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <AnimatePresence mode="popLayout">
              {sortedBills.map((bill) => {
                const status = getBillStatus(bill);
                const meta = STATUS_META[status];
                const isPaid = status === 'paid';
                return (
                  <motion.div
                    layout
                    key={bill.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 border-b border-(--border-2) py-3 last:border-b-0"
                  >
                    {/* Icon tile */}
                    <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-(--surface-2) text-(--text-2)">
                      <Receipt size={17} />
                    </div>

                    {/* Name + due day */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-(--text)">{bill.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-(--text-3)">
                        <CalendarDays size={12} />
                        ครบกำหนด ทุกวันที่ {bill.due_day ?? '—'}
                      </p>
                    </div>

                    {/* Status badge (desktop) */}
                    <span className={`hidden shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${meta.cls}`}>
                      {meta.label}
                    </span>

                    {/* Amount */}
                    <p className="tnum w-[88px] shrink-0 text-right text-[15px] font-semibold text-(--text)">
                      {formatCurrency(bill.amount)}
                    </p>

                    {/* Toggle */}
                    <button
                      onClick={() => handleTogglePaid(bill.id)}
                      className={`press tap pill pill-sm shrink-0 ${isPaid ? 'pill-soft' : 'pill-primary'}`}
                      style={{ minWidth: 88 }}
                    >
                      {isPaid ? (<><Check /> จ่ายแล้ว</>) : 'จ่าย'}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
