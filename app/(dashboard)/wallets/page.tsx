'use client';

// ═══════════════════════════════════════════════════════════════════
// Wallets — matches the design prototype (page_wallets.jsx):
// page head + pill-primary add button, one summary card with three
// columns (assets / liabilities / net), then wallet tiles with a
// faint brand-radial tint, eyebrow balance label, and always-visible
// แก้ไข / แบ่ง pills (hover-only actions don't exist on touch).
// All Supabase flows (add / edit / split / delete) are unchanged.
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Save, X, Pencil, Scissors, Check,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { formatCurrency } from '@/lib/utils';
import type { Wallet } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { createWalletWithOpeningBalance, deleteWallet, formatSupabaseError } from '@/lib/supabase/queries';
import { THAI_BANKS, E_WALLETS, getWalletVisuals } from '@/lib/banks';
import WalletIconDisplay from '@/components/ui/WalletIconDisplay';
import { useAuth }   from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';

gsap.registerPlugin(ScrollTrigger);

// ─── Types ─────────────────────────────────────────────────────────────────
interface SplitState {
  walletId: string;
  walletName: string;
  originalBalance: number;
  nameA: string;
  balanceA: string;
  typeA: Wallet['type'];
  nameB: string;
  balanceB: string;
  typeB: Wallet['type'];
}

const typeIcon = (t: Wallet['type']) => ({
  bank: '🏦', cash: '💵', credit: '💳', ewallet: '📱', savings: '🏦',
})[t] ?? '💰';

const TYPE_LABEL: Record<string, string> = {
  bank: 'ธนาคาร', cash: 'เงินสด', credit: 'บัตรเครดิต',
  ewallet: 'อีวอลเล็ต', savings: 'ออมทรัพย์',
};

/* shared input style — token-based, blue focus ring */
const inputCls =
  'w-full rounded-[14px] border border-(--border) bg-(--surface-2) px-3.5 py-2.5 text-sm text-(--text) outline-none transition-[border-color,box-shadow] focus:border-(--blue) focus:shadow-[0_0_0_3px_var(--blue-soft)] placeholder:text-(--text-3)';

// ─── Component ──────────────────────────────────────────────────────────────
export default function WalletsPage() {
  const { user }                                        = useAuth();
  const { wallets, loading, refetch: refetchWallets }   = useWallets(user?.id);
  const userId = user?.id ?? null;
  const pageRef = useRef<HTMLDivElement>(null);

  const [isAdding, setIsAdding] = useState(false);

  // Add form
  const [newName,    setNewName]    = useState('');
  const [newType,    setNewType]    = useState<Wallet['type']>('bank');
  const [newBalance, setNewBalance] = useState('');

  // Inline edit
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editBalance,  setEditBalance]  = useState('');
  const [editName,     setEditName]     = useState('');

  // Split wallet
  const [split, setSplit] = useState<SplitState | null>(null);

  // Bank sub-selection (only when type === 'bank')
  const [selectedBank, setSelectedBank] = useState('');

  // ── Add wallet — uses createWalletWithOpeningBalance for data integrity ──
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = Number(newBalance);
    if (!newName || isNaN(balance) || !userId) return;

    const walletName = ((newType === 'bank' || newType === 'ewallet') && selectedBank) ? selectedBank : newName;

    try {
      await createWalletWithOpeningBalance(
        { name: walletName, type: newType, balance, icon: typeIcon(newType), user_id: userId },
        userId
      );
      setIsAdding(false); setNewName(''); setNewBalance(''); setNewType('bank'); setSelectedBank('');
      await refetchWallets();
    } catch (err) {
      console.error('[WalletsPage] add wallet error:', (err as Error).message ?? formatSupabaseError(err));
    }
  };

  // ── Delete wallet ──────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteWallet(id);
      await refetchWallets();
    } catch (err) {
      console.error('[WalletsPage] delete wallet error:', (err as Error).message ?? formatSupabaseError(err));
    }
  };

  // ── Open inline edit ──────────────────────────────────────────────────────
  const startEdit = (w: Wallet) => {
    setEditingId(w.id);
    setEditName(w.name);
    setEditBalance(String(w.balance));
    setSplit(null);
  };

  // ── Save inline edit — TODO Phase 3: move to updateWallet() in queries.ts ──
  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('wallets').update({
      name: editName, balance: Number(editBalance),
      updated_at: new Date().toISOString(),
    }).eq('id', editingId);
    if (error) { console.error('Edit wallet error:', error); return; }
    setEditingId(null);
    await refetchWallets();
  };

  // ── Open split dialog ─────────────────────────────────────────────────────
  const startSplit = (w: Wallet) => {
    setEditingId(null);
    setSplit({
      walletId: w.id,
      walletName: w.name,
      originalBalance: w.balance,
      nameA: w.name,
      balanceA: String(Math.floor(w.balance / 2)),
      typeA: w.type,
      nameB: '',
      balanceB: String(w.balance - Math.floor(w.balance / 2)),
      typeB: 'cash',
    });
  };

  // ── Confirm split ─────────────────────────────────────────────────────────
  const confirmSplit = async () => {
    if (!split || !userId) return;
    const { walletId, nameA, balanceA, typeA, nameB, balanceB, typeB } = split;
    if (!nameB) return;

    const aBalance = Number(balanceA);
    const bBalance = Number(balanceB);

    const { error: errA } = await supabase.from('wallets').update({
      name: nameA,
      balance: aBalance,
      type: typeA,
      icon: typeIcon(typeA),
      updated_at: new Date().toISOString(),
    }).eq('id', walletId);

    if (errA) { console.error('[WalletsPage] split update A error:', errA); return; }

    try {
      await createWalletWithOpeningBalance(
        { name: nameB, type: typeB, balance: bBalance, icon: typeIcon(typeB), user_id: userId },
        userId
      );
    } catch (err) {
      console.error('[WalletsPage] split create B error:', err); return;
    }

    setSplit(null);
    await refetchWallets();
  };

  // ── Stagger reveal for wallet tiles ──
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      const cards = gsap.utils.toArray<HTMLElement>('.wallet-card', pageRef.current);
      if (cards.length === 0) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(cards,
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.07,
          scrollTrigger: { trigger: pageRef.current, start: 'top 85%', once: true },
        }
      );
    },
    { scope: pageRef, dependencies: [loading, wallets] }
  );

  const assets      = wallets.filter((w) => w.balance >= 0).reduce((s, w) => s + w.balance, 0);
  const liabilities = wallets.filter((w) => w.balance < 0).reduce((s, w) => s + Math.abs(w.balance), 0);
  const netBalance  = assets - liabilities;

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="cyber-skeleton h-16 w-1/3 rounded-2xl" />
        <div className="cyber-skeleton h-28 rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="cyber-skeleton h-52 rounded-3xl" />
          <div className="cyber-skeleton h-52 rounded-3xl" />
          <div className="cyber-skeleton h-52 rounded-3xl" />
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
            กระเป๋าเงิน
          </h1>
          <p className="mt-1 text-[14.5px] text-(--text-2)">
            จัดการกระเป๋าเงินทุกใบในที่เดียว · {wallets.length} บัญชี
          </p>
        </div>
        <button
          onClick={() => { setIsAdding(!isAdding); setEditingId(null); setSplit(null); }}
          className={`press tap shrink-0 ${isAdding ? 'pill pill-ghost' : 'pill pill-primary'}`}
        >
          {isAdding ? <X /> : <Plus />}
          {isAdding ? 'ยกเลิก' : 'เพิ่มบัญชี'}
        </button>
      </div>

      {/* ── Summary — single card, three columns ── */}
      <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
        <div className="flex flex-wrap justify-between gap-5">
          <div className="flex-[1_1_160px]">
            <p className="eyebrow">สินทรัพย์</p>
            <p className="tnum mt-1.5 text-[28px] font-bold leading-none tracking-[-0.025em] text-(--green)">
              +{formatCurrency(assets)}
            </p>
          </div>
          <div className="flex-[1_1_160px]">
            <p className="eyebrow">หนี้สิน</p>
            <p className="tnum mt-1.5 text-[28px] font-bold leading-none tracking-[-0.025em] text-(--expense)">
              −{formatCurrency(liabilities)}
            </p>
          </div>
          <div className="flex-[1_1_160px]">
            <p className="eyebrow">สุทธิ</p>
            <p className="tnum mt-1.5 text-[28px] font-bold leading-none tracking-[-0.025em] text-(--blue)">
              {formatCurrency(netBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Add form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-(--text)">เพิ่มบัญชีใหม่</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">
                    ชื่อเรียกบัญชี
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={selectedBank ? `${selectedBank} (ปรับชื่อได้)` : 'เช่น KBank เงินเก็บ, เงินสดในกระเป๋า'}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">ประเภท</label>
                  <select value={newType} onChange={(e) => { setNewType(e.target.value as Wallet['type']); setSelectedBank(''); }}
                    className={inputCls}>
                    <option value="bank">🏦 ธนาคาร</option>
                    <option value="cash">💵 เงินสด</option>
                    <option value="credit">💳 บัตรเครดิต</option>
                    <option value="ewallet">📱 E-Wallet</option>
                  </select>
                </div>
                {newType === 'bank' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-(--text-2)">เลือกธนาคาร</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => {
                        setSelectedBank(e.target.value);
                        if (e.target.value) setNewName(e.target.value);
                      }}
                      className={inputCls}
                    >
                      <option value="">— ระบุชื่อเอง —</option>
                      {THAI_BANKS.map((b) => (
                        <option key={b.name} value={b.name}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {newType === 'ewallet' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-(--text-2)">เลือก E-Wallet</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => {
                        setSelectedBank(e.target.value);
                        if (e.target.value) setNewName(e.target.value);
                      }}
                      className={inputCls}
                    >
                      <option value="">— ระบุชื่อเอง —</option>
                      {E_WALLETS.map((w) => (
                        <option key={w.name} value={w.name}>{w.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium text-(--text-2)">ยอดเงินเริ่มต้น (฿)</label>
                  <input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} placeholder="0.00"
                    className={`${inputCls} tnum`} required />
                </div>
              </div>
              <div className="flex justify-end border-t border-(--border-2) pt-4">
                <button type="submit" className="pill pill-primary press tap">
                  <Save /> บันทึกบัญชี
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Split panel ── */}
      <AnimatePresence>
        {split && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="space-y-4 rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold tracking-[-0.01em] text-(--text)">
                    แบ่งกระเป๋า — {split.walletName}
                  </p>
                  <p className="tnum mt-0.5 text-xs text-(--text-3)">
                    ยอดรวมเดิม {formatCurrency(split.originalBalance)}
                  </p>
                </div>
                <button
                  onClick={() => setSplit(null)}
                  className="press tap flex h-9 w-9 items-center justify-center rounded-full border border-(--border) bg-(--surface) text-(--text-2) hover:bg-(--surface-2)"
                  aria-label="ปิด"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Wallet A */}
                <div className="inset space-y-2.5 p-3.5">
                  <p className="text-xs font-semibold text-(--green)">กระเป๋า A (เดิม)</p>
                  <input value={split.nameA} onChange={(e) => setSplit((s) => s ? { ...s, nameA: e.target.value } : s)}
                    className={inputCls} placeholder="ชื่อกระเป๋า A" />
                  <select value={split.typeA} onChange={(e) => setSplit((s) => s ? { ...s, typeA: e.target.value as Wallet['type'] } : s)}
                    className={inputCls}>
                    <option value="bank">🏦 ธนาคาร</option><option value="cash">💵 เงินสด</option>
                    <option value="credit">💳 บัตรเครดิต</option><option value="ewallet">📱 E-Wallet</option>
                  </select>
                  <input type="number" value={split.balanceA}
                    onChange={(e) => {
                      const a = Number(e.target.value);
                      setSplit((s) => s ? { ...s, balanceA: e.target.value, balanceB: String(Math.max(0, s.originalBalance - a)) } : s);
                    }}
                    className={`${inputCls} tnum`} />
                </div>

                {/* Wallet B */}
                <div className="inset space-y-2.5 p-3.5">
                  <p className="text-xs font-semibold text-(--blue)">กระเป๋า B (ใหม่)</p>
                  <input value={split.nameB} onChange={(e) => setSplit((s) => s ? { ...s, nameB: e.target.value } : s)}
                    className={inputCls} placeholder="ชื่อกระเป๋า B" />
                  <select value={split.typeB} onChange={(e) => setSplit((s) => s ? { ...s, typeB: e.target.value as Wallet['type'] } : s)}
                    className={inputCls}>
                    <option value="bank">🏦 ธนาคาร</option><option value="cash">💵 เงินสด</option>
                    <option value="credit">💳 บัตรเครดิต</option><option value="ewallet">📱 E-Wallet</option>
                  </select>
                  <input type="number" value={split.balanceB}
                    onChange={(e) => {
                      const b = Number(e.target.value);
                      setSplit((s) => s ? { ...s, balanceB: e.target.value, balanceA: String(Math.max(0, s.originalBalance - b)) } : s);
                    }}
                    className={`${inputCls} tnum`} />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-(--border-2) pt-3.5">
                <p className={`tnum text-xs ${
                  Number(split.balanceA) + Number(split.balanceB) !== split.originalBalance
                    ? 'font-semibold text-(--red)'
                    : 'text-(--text-2)'
                }`}>
                  รวม {formatCurrency(Number(split.balanceA) + Number(split.balanceB))} / {formatCurrency(split.originalBalance)}
                </p>
                <button onClick={confirmSplit} disabled={!split.nameB} className="pill pill-gold press tap">
                  <Scissors /> ยืนยันการแบ่ง
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Wallet tiles ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {wallets.map((wallet) => {
            const visuals = getWalletVisuals(wallet.name, wallet.type);
            const neg = wallet.balance < 0;
            return (
              <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                key={wallet.id}
              >
                <div className="wallet-card press relative flex h-full flex-col overflow-hidden rounded-[20px] border border-(--border) bg-(--surface) p-[18px] shadow-(--shadow) transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-lg)">
                  {/* faint brand tint, top-right (prototype) */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{ background: `radial-gradient(120px 120px at 100% 0%, ${visuals.color}, transparent)` }}
                  />

                  {/* Header row */}
                  <div className="relative mb-4 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <WalletIconDisplay visuals={visuals} size={40} />
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold text-(--text)">{wallet.name}</h3>
                        <p className="truncate text-xs text-(--text-3)">
                          {visuals.bankLabel ?? TYPE_LABEL[wallet.type] ?? wallet.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(wallet.id)}
                      title="ลบบัญชี"
                      aria-label="ลบบัญชี"
                      className="press tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-(--text-3) transition-colors hover:bg-(--red-soft) hover:text-(--red)"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Balance / inline edit */}
                  {editingId === wallet.id ? (
                    <div className="relative space-y-2.5">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)}
                        className={inputCls} placeholder="ชื่อบัญชี" />
                      <div className="flex items-center gap-2">
                        <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)}
                          className={`${inputCls} tnum flex-1`} />
                        <button onClick={saveEdit} aria-label="บันทึก"
                          className="press tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--green) text-white hover:brightness-105">
                          <Check size={15} strokeWidth={3} />
                        </button>
                        <button onClick={() => setEditingId(null)} aria-label="ยกเลิก"
                          className="press tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--border) bg-(--surface-2) text-(--text-2)">
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="eyebrow relative">ยอดคงเหลือ</p>
                      <p className={`tnum relative mt-1 text-[27px] font-bold leading-none tracking-[-0.025em] ${
                        neg ? 'text-(--expense)' : 'text-(--text)'
                      }`}>
                        {formatCurrency(wallet.balance)}
                      </p>

                      {/* Actions — always visible (works on touch) */}
                      <div className="relative mt-4 flex gap-2">
                        <button onClick={() => startEdit(wallet)} className="pill pill-soft pill-sm press tap">
                          <Pencil /> แก้ไข
                        </button>
                        <button onClick={() => startSplit(wallet)} className="pill pill-soft pill-sm press tap">
                          <Scissors /> แบ่ง
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {wallets.length === 0 && !isAdding && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--border) bg-(--surface) py-12">
            <span className="mb-3 text-3xl">💳</span>
            <p className="text-sm text-(--text-2)">ยังไม่มีบัญชี</p>
            <p className="mt-1 text-xs text-(--text-3)">กด &quot;เพิ่มบัญชี&quot; เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>
    </div>
  );
}
