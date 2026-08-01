'use client';

// ═══════════════════════════════════════════════════════════════════
// Monthly Bills — Enterprise AP & BNPL Installment System
//
// Features:
// 1. Recurring vs Installment (BNPL e.g. ShopeePayLater) bill types.
// 2. Segmented selector for form creation + precision auto-calculation.
// 3. Installment progress display (e.g. งวดที่ 2/10).
// 4. Strict Wallet Selection Modal when paying bills -> executes
//    atomic pay_bill_and_deduct_wallet RPC in Supabase.
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Plus, X, Save, Loader2, Check, CalendarDays, Wallet as WalletIcon, Layers, Repeat,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useAuth } from '@/hooks/useAuth';
import { useBills } from '@/hooks/useBills';
import { useWallets } from '@/hooks/useWallets';
import { createBill, payBillWithWallet, formatSupabaseError } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/utils';
import type { MonthlyBill } from '@/types';

gsap.registerPlugin(ScrollTrigger);

type BillStatus = 'paid' | 'overdue' | 'upcoming';

function getBillStatus(bill: MonthlyBill): BillStatus {
  if (bill.is_paid) return 'paid';
  const today = new Date().getDate();
  return (bill.due_day ?? 1) < today ? 'overdue' : 'upcoming';
}

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
  const { wallets } = useWallets(userId);
  const pageRef = useRef<HTMLDivElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [billType, setBillType] = useState<'recurring' | 'installment'>('recurring');
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDay, setNewDueDay] = useState('');

  // Installment specific states
  const [totalAmountInput, setTotalAmountInput] = useState('');
  const [totalInstallmentsInput, setTotalInstallmentsInput] = useState('');

  // Pay Modal state
  const [selectedPayBill, setSelectedPayBill] = useState<MonthlyBill | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);

  // Precision auto-calculate monthly amount for installments
  const calculatedMonthlyAmount = useMemo(() => {
    if (billType !== 'installment') return Number(newAmount) || 0;
    const total = parseFloat(totalAmountInput);
    const count = parseInt(totalInstallmentsInput, 10);
    if (!total || !count || count <= 0) return 0;
    // Strict precision round to 2 decimals
    return Math.round((total / count) * 100) / 100;
  }, [billType, newAmount, totalAmountInput, totalInstallmentsInput]);

  const totalMonthly = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills]);
  const totalPaid = useMemo(() => bills.filter((b) => b.is_paid).reduce((s, b) => s + b.amount, 0), [bills]);
  const totalDue = totalMonthly - totalPaid;

  const sortedBills = useMemo(
    () => [...bills].sort((a, b) => (a.due_day ?? 1) - (b.due_day ?? 1)),
    [bills]
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || saving) return;

    const amount = billType === 'installment' ? calculatedMonthlyAmount : Number(newAmount);
    if (!amount || amount <= 0) return;

    try {
      setSaving(true);
      await createBill({
        user_id: userId,
        name: newName,
        amount,
        due_day: Number(newDueDay) || null,
        is_paid: false,
        bill_type: billType,
        total_amount: billType === 'installment' ? Number(totalAmountInput) : null,
        total_installments: billType === 'installment' ? Number(totalInstallmentsInput) : null,
        current_installment: 1,
      }, userId);

      setIsAdding(false);
      setNewName(''); setNewAmount(''); setNewDueDay('');
      setTotalAmountInput(''); setTotalInstallmentsInput(''); setBillType('recurring');
      await refetch();
      window.dispatchEvent(new Event('app_mutate'));
    } catch (err) {
      console.error('[MonthlyBills] add error:', formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPayModal = (bill: MonthlyBill) => {
    if (bill.is_paid) return;
    setSelectedPayBill(bill);
    if (wallets.length > 0) {
      setSelectedWalletId(wallets[0].id);
    }
  };

  const handleConfirmPay = async () => {
    if (!selectedPayBill || !selectedWalletId || !userId || isPaying) return;

    try {
      setIsPaying(true);
      await payBillWithWallet(
        selectedPayBill.id,
        selectedWalletId,
        selectedPayBill.amount,
        userId
      );

      setSelectedPayBill(null);
      await refetch();
      window.dispatchEvent(new Event('app_mutate'));
    } catch (err) {
      console.error('[MonthlyBills] pay bill error:', formatSupabaseError(err));
      alert(`การจ่ายบิลล้มเหลว: ${formatSupabaseError(err)}`);
    } finally {
      setIsPaying(false);
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
            บิลรายเดือน & ผ่อนชำระ (BNPL)
          </h1>
          <p className="mt-1 text-[14.5px] text-(--text-2)">จัดการบิลประจำและค่างวดผ่อนชำระแบบเรียลไทม์</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`press tap shrink-0 ${isAdding ? 'pill pill-ghost' : 'pill pill-primary'}`}
        >
          {isAdding ? <X /> : <Plus />}
          {isAdding ? 'ยกเลิก' : 'เพิ่มบิล / ผ่อนชำระ'}
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

      {/* ── Add form with Segmented Control ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleAdd} className="flex flex-col gap-4 rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-(--text)">เพิ่มรายการใหม่</h2>
                
                {/* Segmented Control */}
                <div className="flex rounded-xl bg-(--surface-2) p-1 border border-(--border-2)">
                  <button
                    type="button"
                    onClick={() => setBillType('recurring')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${billType === 'recurring' ? 'bg-(--surface) text-(--text) shadow-xs' : 'text-(--text-3)'}`}
                  >
                    <Repeat size={13} /> บิลประจำเดือน
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillType('installment')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${billType === 'installment' ? 'bg-(--surface) text-(--text) shadow-xs' : 'text-(--text-3)'}`}
                  >
                    <Layers size={13} /> ผ่อนชำระ (BNPL)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">ชื่อรายการ / สินค้า</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder={billType === 'recurring' ? 'เช่น ค่าไฟ, Netflix' : 'เช่น ShopeePayLater - iPhone'} className={inputCls} required />
                </div>

                {billType === 'installment' ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-medium text-(--text-2)">ราคาทั้งหมด (฿)</label>
                      <input type="number" value={totalAmountInput} onChange={(e) => setTotalAmountInput(e.target.value)}
                        placeholder="12000" className={`${inputCls} tnum`} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-medium text-(--text-2)">จำนวนงวด (เดือน)</label>
                      <input type="number" min={1} max={120} value={totalInstallmentsInput} onChange={(e) => setTotalInstallmentsInput(e.target.value)}
                        placeholder="10" className={`${inputCls} tnum`} required />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[12.5px] font-medium text-(--text-2)">ค่างวดต่อเดือน (คำนวณอัตโนมัติ)</label>
                      <div className="flex items-center rounded-[14px] border border-(--border) bg-(--surface-3) px-3.5 py-2.5 text-sm font-bold text-(--blue)">
                        {formatCurrency(calculatedMonthlyAmount)} / เดือน
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-(--text-2)">จำนวนเงิน (฿)</label>
                    <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="0.00" className={`${inputCls} tnum`} required />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">วันครบกำหนดชำระ (วันที่)</label>
                  <input type="number" min={1} max={31} value={newDueDay} onChange={(e) => setNewDueDay(e.target.value)}
                    placeholder="1-31" className={`${inputCls} tnum`} required />
                </div>
              </div>

              <div className="flex justify-end border-t border-(--border-2) pt-4">
                <button type="submit" disabled={saving} className="pill pill-primary press tap">
                  {saving ? <Loader2 className="animate-spin" /> : <Save />} บันทึกรายการ
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All bills card ── */}
      <div className="bills-section rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-sm font-semibold tracking-[-0.01em] text-(--text)">รายการบิลทั้งหมด</p>
          <p className="tnum text-xs text-(--text-3)">{bills.length} รายการ</p>
        </div>

        {bills.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <span className="mb-3 text-3xl">🧾</span>
            <p className="text-sm text-(--text-2)">ยังไม่มีบิล</p>
            <p className="mt-1 text-xs text-(--text-3)">กด &quot;เพิ่มบิล / ผ่อนชำระ&quot; เพื่อเริ่มติดตาม</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <AnimatePresence mode="popLayout">
              {sortedBills.map((bill) => {
                const status = getBillStatus(bill);
                const meta = STATUS_META[status];
                const isPaid = status === 'paid';
                const isInstallment = bill.bill_type === 'installment';

                return (
                  <motion.div
                    layout
                    key={bill.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-wrap items-center gap-3 border-b border-(--border-2) py-3.5 last:border-b-0"
                  >
                    {/* Icon tile */}
                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl bg-(--surface-2) text-(--text-2)">
                      {isInstallment ? <Layers size={18} className="text-(--blue)" /> : <Receipt size={18} />}
                    </div>

                    {/* Name + due day + Installment info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-(--text)">{bill.name}</p>
                        {isInstallment && (
                          <span className="rounded-md bg-(--blue-soft) px-2 py-0.5 text-[10px] font-bold text-(--blue)">
                            ผ่อนชำระ
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-(--text-3)">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} />
                          ทุกวันที่ {bill.due_day ?? '—'}
                        </span>
                        {isInstallment && (
                          <span className="tnum font-medium text-(--gold)">
                            • งวดที่ {bill.current_installment}/{bill.total_installments}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`hidden shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${meta.cls}`}>
                      {meta.label}
                    </span>

                    {/* Amount */}
                    <div className="shrink-0 text-right">
                      <p className="tnum text-[15px] font-semibold text-(--text)">
                        {formatCurrency(bill.amount)}
                      </p>
                      {isInstallment && bill.total_amount && (
                        <p className="tnum text-[11px] text-(--text-3)">
                          จากทั้งหมด {formatCurrency(bill.total_amount)}
                        </p>
                      )}
                    </div>

                    {/* Pay button */}
                    <button
                      onClick={() => handleOpenPayModal(bill)}
                      disabled={isPaid}
                      className={`press tap pill pill-sm shrink-0 ${isPaid ? 'pill-soft opacity-70 cursor-default' : 'pill-primary'}`}
                      style={{ minWidth: 92 }}
                    >
                      {isPaid ? (<><Check /> จ่ายแล้ว</>) : 'จ่ายบิล'}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Select Wallet & Confirm Payment Modal ── */}
      <AnimatePresence>
        {selectedPayBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-(--border-2)">
                <h3 className="text-base font-semibold text-(--text)">เลือกกระเป๋าเงินเพื่อจ่ายบิล</h3>
                <button onClick={() => setSelectedPayBill(null)} className="text-(--text-3) hover:text-(--text)">
                  <X size={18} />
                </button>
              </div>

              <div className="py-4">
                <div className="rounded-2xl bg-(--surface-2) p-4 mb-4">
                  <p className="text-xs text-(--text-3)">รายการที่เลือก</p>
                  <p className="text-base font-semibold text-(--text) mt-0.5">{selectedPayBill.name}</p>
                  <p className="tnum text-lg font-bold text-(--blue) mt-1">
                    ยอดชำระ: {formatCurrency(selectedPayBill.amount)}
                  </p>
                </div>

                <label className="text-xs font-medium text-(--text-2) mb-2 block">
                  เลือกกระเป๋าเงินที่ใช้ตัดยอด:
                </label>

                {wallets.length === 0 ? (
                  <p className="text-sm text-(--gold)">ไม่พบกระเป๋าเงิน กรุณาเพิ่มกระเป๋าเงินก่อนชำระ</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {wallets.map((w) => (
                      <label
                        key={w.id}
                        onClick={() => setSelectedWalletId(w.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${selectedWalletId === w.id ? 'border-(--blue) bg-(--blue-soft)/20' : 'border-(--border-2) bg-(--surface-2)'}`}
                      >
                        <div className="flex items-center gap-3">
                          <WalletIcon size={18} className="text-(--blue)" />
                          <div>
                            <p className="text-sm font-medium text-(--text)">{w.name}</p>
                            <p className="tnum text-xs text-(--text-3)">คงเหลือ {formatCurrency(w.balance)}</p>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="pay_wallet"
                          checked={selectedWalletId === w.id}
                          onChange={() => setSelectedWalletId(w.id)}
                          className="accent-(--blue)"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-(--border-2)">
                <button
                  type="button"
                  onClick={() => setSelectedPayBill(null)}
                  className="pill pill-ghost press tap"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPay}
                  disabled={isPaying || !selectedWalletId}
                  className="pill pill-primary press tap min-w-[120px] justify-center"
                >
                  {isPaying ? <Loader2 className="animate-spin" /> : 'ยืนยันจ่ายเงิน'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
