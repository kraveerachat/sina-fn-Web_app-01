'use client';

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, X, Save, Trash2, Loader2, AlertCircle,
  TrendingDown, Calendar, Percent, DollarSign,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import CyberCard from '@/components/ui/CyberCard';
import SectionHeader from '@/components/ui/SectionHeader';
import ScrambleText from '@/components/ui/ScrambleText';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useAuth } from '@/hooks/useAuth';
import { useDebts } from '@/hooks/useDebts';
import { createDebt, deleteDebt, formatSupabaseError } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

// ── Magnetic row wrapper ──
function MagneticRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const mag = useMagnetic(0.12);
  return (
    <motion.div
      style={{ x: mag.x, y: mag.y }}
      onMouseMove={mag.onMouseMove}
      onMouseLeave={mag.onMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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

  const totalDebt = useMemo(() => debts.reduce((s, d) => s + d.remaining_amount, 0), [debts]);
  const totalMinPayment = useMemo(() => debts.reduce((s, d) => s + (d.minimum_payment ?? 0), 0), [debts]);

  // ── GSAP stagger ──
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      const rows = gsap.utils.toArray<HTMLElement>('.debt-row', pageRef.current);
      if (rows.length === 0) return;
      gsap.set(rows, { y: 25, opacity: 0 });
      gsap.to(rows, {
        y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: pageRef.current, start: 'top 85%', once: true },
      });
    },
    { scope: pageRef, dependencies: [loading, debts] }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-7 h-7 text-[var(--cyber-green)] animate-spin" />
      </div>
    );
  }

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

  return (
    <div ref={pageRef} className="flex flex-col h-full space-y-6 pb-20 lg:pb-6">
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-red)] hud-dot" />
            <span className="text-[10px] tracking-[3px] text-[var(--cyber-red)] font-mono uppercase">DEBT MANAGEMENT</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--cyber-text)]">แผนชำระหนี้</h1>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 rounded-xl bg-[var(--cyber-red)]/10 text-[var(--cyber-red)] border border-[var(--cyber-red)]/20 px-4 py-2 hover:bg-[var(--cyber-red)]/20 transition-all text-sm font-mono uppercase shrink-0"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'ยกเลิก' : 'เพิ่มหนี้'}
        </button>
      </div>

      {/* ── Hero: Total Debt ── */}
      <CyberCard glow variant="danger" className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-red)] animate-pulse" />
          <span className="text-[11px] tracking-[3px] text-[var(--cyber-red)] font-mono uppercase">
            TOTAL OUTSTANDING DEBT
          </span>
        </div>
        <ScrambleText
          text={formatCurrency(totalDebt)}
          duration={600}
          className="text-4xl md:text-5xl font-bold font-mono text-[var(--cyber-red)]"
        />
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <TrendingDown size={14} className="text-[var(--cyber-amber)]" />
            <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-wider">Min Monthly</span>
            <ScrambleText
              text={formatCurrency(totalMinPayment)}
              duration={400}
              delay={200}
              className="text-sm font-mono font-bold text-[var(--cyber-amber)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-[var(--cyber-text-secondary)]" />
            <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-wider">Accounts</span>
            <span className="text-sm font-mono font-bold text-[var(--cyber-text)]">{debts.length}</span>
          </div>
        </div>
      </CyberCard>

      {/* ── Add form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleAdd} className="glass-card border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-4">
              <h2 className="text-[var(--cyber-text)] text-sm font-mono uppercase border-b border-white/[0.06] pb-2">เพิ่มหนี้ใหม่</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase">ชื่อหนี้</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น สินเชื่อบ้าน SCB"
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-red)]/40 transition-all" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase">ยอดรวม (฿)</label>
                  <input type="number" value={newTotal} onChange={(e) => setNewTotal(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-red)]/40 font-mono" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase">ยอดคงเหลือ (฿)</label>
                  <input type="number" value={newRemaining} onChange={(e) => setNewRemaining(e.target.value)}
                    placeholder="เท่ากับยอดรวม"
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-red)]/40 font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase">ดอกเบี้ย (%/ปี)</label>
                  <input type="number" step="0.1" value={newRate} onChange={(e) => setNewRate(e.target.value)}
                    placeholder="0.0"
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-red)]/40 font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase">ยอดจ่ายขั้นต่ำ (฿)</label>
                  <input type="number" value={newMinPayment} onChange={(e) => setNewMinPayment(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-red)]/40 font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase">วันครบกำหนด (วันที่)</label>
                  <input type="number" min={1} max={31} value={newDueDay} onChange={(e) => setNewDueDay(e.target.value)}
                    placeholder="1-31"
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-red)]/40 font-mono" />
                </div>
              </div>
              <div className="flex justify-end border-t border-white/[0.06] pt-3">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[var(--cyber-red)] text-white px-6 py-2 text-sm font-mono font-bold uppercase shadow-[0_0_15px_rgba(251,113,133,0.25)] hover:opacity-80 transition-all disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} บันทึก
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Debt list ── */}
      <SectionHeader title="DEBT ACCOUNTS" subtitle={`${debts.length} รายการ`} accent />

      <div className="flex flex-col gap-3">
        {debts.map((debt) => {
          const paidPct = debt.total_amount > 0
            ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100
            : 0;

          return (
            <MagneticRow key={debt.id} className="debt-row">
              <CyberCard noPadding className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: Icon + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--cyber-red)]/10 flex items-center justify-center shrink-0">
                      <CreditCard size={18} className="text-[var(--cyber-red)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[var(--cyber-text)] truncate">{debt.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {debt.interest_rate != null && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--cyber-amber)]">
                            <Percent size={10} /> {debt.interest_rate}%
                          </span>
                        )}
                        {debt.due_day != null && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--cyber-text-secondary)]">
                            <Calendar size={10} /> วันที่ {debt.due_day}
                          </span>
                        )}
                        {debt.minimum_payment != null && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--cyber-text-secondary)]">
                            <DollarSign size={10} /> ขั้นต่ำ {formatCurrency(debt.minimum_payment)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Balance + Delete */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-wider">คงเหลือ</p>
                      <p className="text-lg font-mono font-bold text-[var(--cyber-red)]">
                        {formatCurrency(debt.remaining_amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(debt.id)}
                      className="p-2 rounded-lg text-[var(--cyber-text-muted)] hover:text-[var(--cyber-red)] hover:bg-[var(--cyber-red)]/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-wider">
                      ชำระแล้ว {paidPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] font-mono text-[var(--cyber-text-muted)]">
                      {formatCurrency(debt.total_amount - debt.remaining_amount)} / {formatCurrency(debt.total_amount)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--cyber-red)] to-[var(--cyber-amber)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${paidPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    />
                  </div>
                </div>
              </CyberCard>
            </MagneticRow>
          );
        })}

        {debts.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/[0.08] rounded-2xl glass-card">
            <AlertCircle className="text-[var(--cyber-text-muted)] mb-2" size={24} />
            <p className="text-[var(--cyber-text-secondary)] text-sm font-mono uppercase tracking-wide">
              ไม่มีหนี้ — กด &quot;เพิ่มหนี้&quot; เพื่อเริ่มติดตาม
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
