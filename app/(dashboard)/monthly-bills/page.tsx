'use client';

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Plus, X, Save, Loader2, AlertCircle,
  CheckCircle2, AlertTriangle, Clock, Zap,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import CyberCard from '@/components/ui/CyberCard';
import SectionHeader from '@/components/ui/SectionHeader';
import ScrambleText from '@/components/ui/ScrambleText';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useHolographicTilt } from '@/hooks/useHolographicTilt';
import { useAuth } from '@/hooks/useAuth';
import { useBills } from '@/hooks/useBills';
import { createBill, toggleBillPaid, formatSupabaseError } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/utils';
import type { MonthlyBill } from '@/types';

gsap.registerPlugin(ScrollTrigger);

// ── Get bill status ──
function getBillStatus(bill: MonthlyBill): 'paid' | 'overdue' | 'upcoming' {
  if (bill.is_paid) return 'paid';
  const today = new Date().getDate();
  return (bill.due_day ?? 1) < today ? 'overdue' : 'upcoming';
}

const statusConfig = {
  paid:     { label: 'จ่ายแล้ว', labelEN: 'PAID',     icon: CheckCircle2,  color: 'var(--color-success)', bg: 'var(--color-success)' },
  overdue:  { label: 'เลยกำหนด', labelEN: 'OVERDUE',   icon: AlertTriangle, color: 'var(--cyber-red)',     bg: 'var(--cyber-red)' },
  upcoming: { label: 'รอจ่าย',   labelEN: 'UPCOMING',  icon: Clock,         color: 'var(--cyber-amber)',   bg: 'var(--cyber-amber)' },
} as const;

// ── Holographic Bill Card ──
function HoloBillCard({
  bill,
  onTogglePaid,
}: {
  bill: MonthlyBill;
  onTogglePaid: (id: string) => void;
}) {
  const status = getBillStatus(bill);
  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;
  const mag = useMagnetic(0.15);

  const { ref, cardStyle, sheenStyle, glowStyle, onMouseMove, onMouseLeave } =
    useHolographicTilt<HTMLDivElement>({
      maxTilt: 5,
      speed: 0.12,
      sheenColor: `${status === 'paid' ? 'rgba(52,211,153,' : status === 'overdue' ? 'rgba(251,113,133,' : 'rgba(251,191,36,'}0.08)`,
      glowColor: `${status === 'paid' ? 'rgba(52,211,153,' : status === 'overdue' ? 'rgba(251,113,133,' : 'rgba(251,191,36,'}0.15)`,
    });

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={cardStyle}
      className="bill-card bg-black/20 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3 group hover:border-white/[0.15] transition-all relative overflow-hidden"
    >
      <div style={sheenStyle} />
      <div style={glowStyle} />

      <div className="relative z-[1] flex flex-col gap-3 flex-1">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon size={14} style={{ color: cfg.color }} />
            <span className="text-[9px] font-mono uppercase tracking-[2px]" style={{ color: cfg.color }}>
              {cfg.labelEN}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)]">
            วันที่ {bill.due_day ?? '—'}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold text-[var(--cyber-text)]">{bill.name}</h3>

        {/* Amount */}
        <p className="text-2xl font-mono font-bold text-[var(--cyber-text)]">
          {formatCurrency(bill.amount)}
        </p>

        {/* Pay / Undo button */}
        {!bill.is_paid ? (
          <motion.button
            onMouseMove={mag.onMouseMove}
            onMouseLeave={mag.onMouseLeave}
            onClick={() => onTogglePaid(bill.id)}
            className="mt-auto flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-mono font-bold uppercase transition-all"
            style={{
              x: mag.x, y: mag.y,
              backgroundColor: `color-mix(in srgb, ${cfg.bg} 15%, transparent)`,
              color: cfg.color,
              border: `1px solid color-mix(in srgb, ${cfg.bg} 25%, transparent)`,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap size={14} /> จ่ายเลย
          </motion.button>
        ) : (
          <button
            onClick={() => onTogglePaid(bill.id)}
            className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] py-2.5 text-sm font-mono text-[var(--cyber-text-secondary)] uppercase hover:text-[var(--cyber-text)] hover:border-white/[0.12] transition-all"
          >
            <X size={14} /> ยกเลิกการจ่าย
          </button>
        )}
      </div>
    </div>
  );
}

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
  const totalUnpaid = totalMonthly - totalPaid;
  const overdueBills = useMemo(() => bills.filter((b) => getBillStatus(b) === 'overdue'), [bills]);

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

  // GSAP stagger
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      const cards = gsap.utils.toArray<HTMLElement>('.bill-card', pageRef.current);
      if (cards.length === 0) return;
      gsap.set(cards, { y: 25, opacity: 0 });
      gsap.to(cards, {
        y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.07,
        scrollTrigger: { trigger: pageRef.current, start: 'top 85%', once: true },
      });
    },
    { scope: pageRef, dependencies: [loading, bills] }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-7 h-7 text-[var(--cyber-green)] animate-spin" />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col h-full space-y-6 pb-20 lg:pb-6">
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-amber)] hud-dot" />
            <span className="text-[10px] tracking-[3px] text-[var(--cyber-amber)] font-mono uppercase">RECURRING BILLS</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--cyber-text)]">บิลรายเดือน</h1>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 rounded-xl bg-[var(--cyber-amber)]/10 text-[var(--cyber-amber)] border border-[var(--cyber-amber)]/20 px-4 py-2 hover:bg-[var(--cyber-amber)]/20 transition-all text-sm font-mono uppercase shrink-0"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'ยกเลิก' : 'เพิ่มบิล'}
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CyberCard noPadding className="p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--cyber-amber)]" />
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={14} className="text-[var(--cyber-amber)]" />
            <p className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase tracking-[2px]">ทั้งหมด (TOTAL)</p>
          </div>
          <ScrambleText text={formatCurrency(totalMonthly)} duration={400} className="text-2xl font-bold font-mono text-[var(--cyber-amber)]" />
        </CyberCard>

        <CyberCard noPadding variant="success" className="p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-success)]" />
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className="text-[var(--color-success)]" />
            <p className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase tracking-[2px]">จ่ายแล้ว (PAID)</p>
          </div>
          <ScrambleText text={formatCurrency(totalPaid)} duration={400} delay={100} className="text-2xl font-bold font-mono text-[var(--color-success)]" />
        </CyberCard>

        <CyberCard noPadding variant={overdueBills.length > 0 ? 'danger' : 'default'} className="p-4 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${overdueBills.length > 0 ? 'bg-[var(--cyber-red)]' : 'bg-[var(--cyber-text-muted)]'}`} />
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className={overdueBills.length > 0 ? 'text-[var(--cyber-red)]' : 'text-[var(--cyber-text-secondary)]'} />
            <p className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase tracking-[2px]">ค้างจ่าย (UNPAID)</p>
          </div>
          <ScrambleText
            text={formatCurrency(totalUnpaid)}
            duration={400}
            delay={200}
            className={`text-2xl font-bold font-mono ${overdueBills.length > 0 ? 'text-[var(--cyber-red)]' : 'text-[var(--cyber-text)]'}`}
          />
        </CyberCard>
      </div>

      {/* ── Add form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleAdd} className="glass-card border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-4">
              <h2 className="text-[var(--cyber-text)] text-sm font-mono uppercase border-b border-white/[0.06] pb-2">เพิ่มบิลใหม่</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase">ชื่อบิล</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น ค่าไฟ, Netflix"
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-amber)]/40 transition-all" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase">จำนวนเงิน (฿)</label>
                  <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-amber)]/40 font-mono" required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[var(--cyber-text-secondary)] font-mono uppercase">วันครบกำหนด (วันที่)</label>
                  <input type="number" min={1} max={31} value={newDueDay} onChange={(e) => setNewDueDay(e.target.value)}
                    placeholder="1-31"
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-amber)]/40 font-mono" required />
                </div>
              </div>
              <div className="flex justify-end border-t border-white/[0.06] pt-3">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[var(--cyber-amber)] text-[var(--cyber-bg)] px-6 py-2 text-sm font-mono font-bold uppercase shadow-[0_0_15px_rgba(251,191,36,0.25)] hover:opacity-80 transition-all disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} บันทึก
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bills grid ── */}
      <SectionHeader title="MONTHLY BILLS" subtitle={`${bills.length} รายการ`} accent />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {[...bills]
            .sort((a, b) => (a.due_day ?? 1) - (b.due_day ?? 1))
            .map((bill) => (
              <motion.div
                layout
                key={bill.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <HoloBillCard bill={bill} onTogglePaid={handleTogglePaid} />
              </motion.div>
            ))}
        </AnimatePresence>

        {bills.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/[0.08] rounded-2xl glass-card">
            <AlertCircle className="text-[var(--cyber-text-muted)] mb-2" size={24} />
            <p className="text-[var(--cyber-text-secondary)] text-sm font-mono uppercase tracking-wide">
              ยังไม่มีบิล — กด &quot;เพิ่มบิล&quot; เพื่อเริ่มติดตาม
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
