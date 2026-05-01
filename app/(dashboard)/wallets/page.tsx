'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, AlertCircle, Save, X, ArrowUpRight, ArrowDownRight, Scale, Loader2,
  Pencil, Scissors, Check,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Wallet } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { createWalletWithOpeningBalance, deleteWallet, formatSupabaseError } from '@/lib/supabase/queries';
import { THAI_BANKS, getWalletVisuals } from '@/lib/banks';
import WalletIconDisplay from '@/components/ui/WalletIconDisplay';
import { useAuth }   from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';

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

// ─── Component ──────────────────────────────────────────────────────────────
export default function WalletsPage() {
  // ── Data via hooks — no direct supabase.auth calls ──
  const { user }                                        = useAuth();
  const { wallets, loading, refetch: refetchWallets }   = useWallets(user?.id);
  const userId = user?.id ?? null;

  // Local UI state for add/edit/split flows
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

    // When a specific Thai bank is chosen, use that bank's canonical name
    const walletName = (newType === 'bank' && selectedBank) ? selectedBank : newName;

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

    // Update original wallet (A) with new values
    const { error: errA } = await supabase.from('wallets').update({
      name: nameA,
      balance: aBalance,
      type: typeA,
      icon: typeIcon(typeA),
      updated_at: new Date().toISOString(),
    }).eq('id', walletId);

    if (errA) { console.error('[WalletsPage] split update A error:', errA); return; }

    // Create wallet B with opening balance transaction for data integrity
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

  // ── Totals ────────────────────────────────────────────────────────────────
  const assets      = wallets.filter((w) => w.balance >= 0).reduce((s, w) => s + w.balance, 0);
  const liabilities = wallets.filter((w) => w.balance < 0).reduce((s, w) => s + Math.abs(w.balance), 0);
  const netBalance  = assets - liabilities;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-7 h-7 text-[var(--cyber-green)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pb-20 lg:pb-6">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E040FB] hud-dot" />
            <span className="text-[10px] tracking-[3px] text-[#E040FB] font-mono uppercase">ASSET MANAGEMENT</span>
          </div>
          <h1 className="text-2xl font-bold text-[#E8EAF0]">บัญชีและกระเป๋าเงิน</h1>
        </div>
        <button
          onClick={() => { setIsAdding(!isAdding); setEditingId(null); setSplit(null); }}
          className="flex items-center gap-2 rounded-[6px] bg-[#E040FB]/10 text-[#E040FB] border border-[#E040FB]/20 px-4 py-2 hover:bg-[#E040FB]/20 transition-all text-sm font-mono uppercase shrink-0"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'ยกเลิก' : 'เพิ่มบัญชี'}
        </button>
      </div>

      {/* ── Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1F2328] border border-[#2A2F38] rounded-[8px] p-4 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#39FF14]" />
          <div className="flex items-center gap-2 mb-2"><ArrowUpRight size={14} className="text-[#39FF14]" />
            <p className="text-[#6B7280] text-[10px] font-mono uppercase tracking-[2px]">สินทรัพย์ (ASSETS)</p>
          </div>
          <span className="text-2xl font-bold font-mono text-[#39FF14]">{formatCurrency(assets, true)}</span>
        </div>
        <div className="bg-[#1F2328] border border-[#2A2F38] rounded-[8px] p-4 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#FF3B3B]" />
          <div className="flex items-center gap-2 mb-2"><ArrowDownRight size={14} className="text-[#FF3B3B]" />
            <p className="text-[#6B7280] text-[10px] font-mono uppercase tracking-[2px]">หนี้สิน (LIABILITIES)</p>
          </div>
          <span className="text-2xl font-bold font-mono text-[#FF3B3B]">{formatCurrency(liabilities, true)}</span>
        </div>
        <div className="bg-[#252A30] border border-[#E040FB]/50 rounded-[8px] p-4 flex flex-col justify-center relative overflow-hidden shadow-[0_0_15px_#E040FB15]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#E040FB] blur-[60px] opacity-20 pointer-events-none" />
          <div className="flex items-center gap-2 mb-2"><Scale size={14} className="text-[#E040FB]" />
            <p className="text-[#E8EAF0] text-[10px] font-mono uppercase tracking-[2px]">ความมั่งคั่งสุทธิ</p>
          </div>
          <span className="text-3xl font-bold font-mono text-[#E040FB]">{formatCurrency(netBalance, true)}</span>
        </div>
      </div>

      {/* ── Add form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleAddSubmit} className="bg-[#1F2328] border border-[#2A2F38] rounded-[8px] p-4 flex flex-col gap-4">
              <h2 className="text-[#E8EAF0] text-sm font-mono uppercase border-b border-[#2A2F38] pb-2">เพิ่มบัญชีใหม่</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#6B7280] font-mono uppercase">
                    ชื่อเรียกบัญชี
                    <span className="normal-case text-[#4B5563] ml-1">(เช่น KBank เงินเก็บ)</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={selectedBank ? `${selectedBank} (ปรับชื่อได้)` : 'เช่น KBank เงินเก็บ, เงินสดในกระเป๋า'}
                    className="rounded-[6px] border border-[#2A2F38] bg-[#252A30] px-3 py-2 text-sm text-[#E8EAF0] outline-none focus:border-[#E040FB] transition-all"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#6B7280] font-mono uppercase">ประเภท</label>
                  <select value={newType} onChange={(e) => { setNewType(e.target.value as Wallet['type']); setSelectedBank(''); }}
                    className="rounded-[6px] border border-[#2A2F38] bg-[#252A30] px-3 py-2 text-sm text-[#E8EAF0] outline-none focus:border-[#E040FB]">
                    <option value="bank">🏦 ธนาคาร</option>
                    <option value="cash">💵 เงินสด</option>
                    <option value="credit">💳 บัตรเครดิต</option>
                    <option value="ewallet">📱 E-Wallet</option>
                  </select>
                </div>
                {/* Bank sub-dropdown — only when type === bank */}
                {newType === 'bank' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#6B7280] font-mono uppercase">เลือกธนาคาร</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => {
                        setSelectedBank(e.target.value);
                        // Auto-fill name field with bank name
                        if (e.target.value) setNewName(e.target.value);
                      }}
                      className="rounded-[6px] border border-[#2A2F38] bg-[#252A30] px-3 py-2 text-sm text-[#E8EAF0] outline-none focus:border-[#E040FB]"
                    >
                      <option value="">— ระบุชื่อเอง —</option>
                      {THAI_BANKS.map((b) => (
                        <option key={b.name} value={b.name}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#6B7280] font-mono uppercase">ยอดเงินเริ่มต้น (฿)</label>
                  <input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} placeholder="0.00"
                    className="rounded-[6px] border border-[#2A2F38] bg-[#252A30] px-3 py-2 text-sm text-[#E8EAF0] outline-none focus:border-[#E040FB] font-mono" required />
                </div>
              </div>
              <div className="flex justify-end border-t border-[#2A2F38] pt-3">
                <button type="submit" className="flex items-center gap-2 rounded-[6px] bg-[#E040FB] text-[#1A1D21] px-6 py-2 text-sm font-mono font-bold uppercase shadow-[0_0_15px_#E040FB40] hover:bg-[#E040FB]/80 transition-all">
                  <Save size={16} /> บันทึกบัญชี
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Split modal ── */}
      <AnimatePresence>
        {split && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-[#1F2328] border border-[#FF9100]/40 rounded-[8px] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono tracking-[2px] text-[#FF9100] uppercase">แบ่งกระเป๋า (SPLIT WALLET)</p>
                  <p className="text-xs text-[#6B7280] font-mono mt-0.5">ยอดรวมเดิม: <span className="text-[#E8EAF0]">{formatCurrency(split.originalBalance)}</span></p>
                </div>
                <button onClick={() => setSplit(null)} className="text-[#6B7280] hover:text-[#E8EAF0]"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Wallet A */}
                <div className="space-y-2 rounded-[8px] border border-[#2A2F38] bg-[#252A30] p-3">
                  <p className="text-[9px] tracking-[2px] font-mono text-[#39FF14] uppercase">กระเป๋า A (เดิม)</p>
                  <input value={split.nameA} onChange={(e) => setSplit((s) => s ? { ...s, nameA: e.target.value } : s)}
                    className="w-full rounded-[6px] border border-[#2A2F38] bg-[#1F2328] px-3 py-2 text-sm text-[#E8EAF0] outline-none focus:border-[#39FF14] font-mono" placeholder="ชื่อกระเป๋า A" />
                  <select value={split.typeA} onChange={(e) => setSplit((s) => s ? { ...s, typeA: e.target.value as Wallet['type'] } : s)}
                    className="w-full rounded-[6px] border border-[#2A2F38] bg-[#1F2328] px-3 py-2 text-sm text-[#E8EAF0] outline-none focus:border-[#39FF14]">
                    <option value="bank">🏦 ธนาคาร</option><option value="cash">💵 เงินสด</option>
                    <option value="credit">💳 บัตรเครดิต</option><option value="ewallet">📱 E-Wallet</option>
                  </select>
                  <input type="number" value={split.balanceA}
                    onChange={(e) => {
                      const a = Number(e.target.value);
                      setSplit((s) => s ? { ...s, balanceA: e.target.value, balanceB: String(Math.max(0, s.originalBalance - a)) } : s);
                    }}
                    className="w-full rounded-[6px] border border-[#2A2F38] bg-[#1F2328] px-3 py-2 text-sm text-[#39FF14] outline-none focus:border-[#39FF14] font-mono" />
                </div>

                {/* Wallet B */}
                <div className="space-y-2 rounded-[8px] border border-[#2A2F38] bg-[#252A30] p-3">
                  <p className="text-[9px] tracking-[2px] font-mono text-[#00E5FF] uppercase">กระเป๋า B (ใหม่)</p>
                  <input value={split.nameB} onChange={(e) => setSplit((s) => s ? { ...s, nameB: e.target.value } : s)}
                    className="w-full rounded-[6px] border border-[#2A2F38] bg-[#1F2328] px-3 py-2 text-sm text-[#E8EAF0] outline-none focus:border-[#00E5FF] font-mono" placeholder="ชื่อกระเป๋า B" />
                  <select value={split.typeB} onChange={(e) => setSplit((s) => s ? { ...s, typeB: e.target.value as Wallet['type'] } : s)}
                    className="w-full rounded-[6px] border border-[#2A2F38] bg-[#1F2328] px-3 py-2 text-sm text-[#E8EAF0] outline-none focus:border-[#00E5FF]">
                    <option value="bank">🏦 ธนาคาร</option><option value="cash">💵 เงินสด</option>
                    <option value="credit">💳 บัตรเครดิต</option><option value="ewallet">📱 E-Wallet</option>
                  </select>
                  <input type="number" value={split.balanceB}
                    onChange={(e) => {
                      const b = Number(e.target.value);
                      setSplit((s) => s ? { ...s, balanceB: e.target.value, balanceA: String(Math.max(0, s.originalBalance - b)) } : s);
                    }}
                    className="w-full rounded-[6px] border border-[#2A2F38] bg-[#1F2328] px-3 py-2 text-sm text-[#00E5FF] outline-none focus:border-[#00E5FF] font-mono" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#2A2F38]">
                <p className={`text-[10px] font-mono ${Number(split.balanceA) + Number(split.balanceB) !== split.originalBalance ? 'text-[#FF3B3B]' : 'text-[#39FF14]'}`}>
                  รวม: {formatCurrency(Number(split.balanceA) + Number(split.balanceB))} / {formatCurrency(split.originalBalance)}
                </p>
                <button onClick={confirmSplit} disabled={!split.nameB}
                  className="flex items-center gap-2 rounded-[6px] bg-[#FF9100] text-[#1A1D21] px-5 py-2 text-sm font-mono font-bold uppercase hover:bg-[#FF9100]/80 transition-all disabled:opacity-40">
                  <Scissors size={14} /> ยืนยันการแบ่ง
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Wallet cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {wallets.map((wallet) => (
            <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              key={wallet.id}
              className="bg-[#252A30] border border-[#2A2F38] rounded-[8px] p-5 flex flex-col gap-3 group hover:border-[#E040FB]/30 transition-all relative overflow-hidden"
            >
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <WalletIconDisplay
                    visuals={getWalletVisuals(wallet.name, wallet.type)}
                    size={48}
                    className="transition-transform group-hover:scale-105"
                  />
                  <div>
                    <h3 className="text-[#E8EAF0] text-sm font-bold">{wallet.name}</h3>
                    <p className="text-[10px] font-mono text-[#6B7280] uppercase tracking-widest mt-0.5">
                      {getWalletVisuals(wallet.name, wallet.type).bankLabel ?? wallet.type}
                    </p>
                  </div>
                </div>
                {/* Action buttons — only show on hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(wallet)} title="แก้ไข" className="p-1.5 rounded-[4px] text-[#6B7280] hover:text-[#39FF14] hover:bg-[#39FF14]/10 transition-all">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => startSplit(wallet)} title="แบ่งกระเป๋า" className="p-1.5 rounded-[4px] text-[#6B7280] hover:text-[#FF9100] hover:bg-[#FF9100]/10 transition-all">
                    <Scissors size={13} />
                  </button>
                  <button onClick={() => handleDelete(wallet.id)} title="ลบ" className="p-1.5 rounded-[4px] text-[#6B7280] hover:text-[#FF3B3B] hover:bg-[#FF3B3B]/10 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Balance — inline edit when editing */}
              {editingId === wallet.id ? (
                <div className="space-y-2 border-t border-[#2A2F38] pt-3">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-[6px] border border-[#2A2F38] bg-[#1F2328] px-3 py-1.5 text-sm text-[#E8EAF0] outline-none focus:border-[#39FF14] font-mono" placeholder="ชื่อบัญชี" />
                  <div className="flex items-center gap-2">
                    <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)}
                      className="flex-1 rounded-[6px] border border-[#39FF14]/40 bg-[#1F2328] px-3 py-1.5 text-sm text-[#39FF14] outline-none focus:border-[#39FF14] font-mono" />
                    <button onClick={saveEdit} className="p-2 rounded-[6px] bg-[#39FF14] text-[#1A1D21] hover:bg-[#39FF14]/80 transition-all">
                      <Check size={14} strokeWidth={3} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-2 rounded-[6px] bg-[#1F2328] border border-[#2A2F38] text-[#6B7280] hover:text-[#E8EAF0] transition-all">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-right border-t border-[#2A2F38] pt-3">
                  <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-widest mb-1">ยอดคงเหลือ</p>
                  <div className={`text-2xl font-mono font-bold ${wallet.balance >= 0 ? 'text-[#39FF14]' : 'text-[#FF3B3B]'}`}>
                    {formatCurrency(wallet.balance)}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {wallets.length === 0 && !isAdding && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-[#2A2F38] rounded-[8px] bg-[#1F2328]">
            <AlertCircle className="text-[#374151] mb-2" size={24} />
            <p className="text-[#6B7280] text-sm font-mono uppercase tracking-wide">
              ยังไม่มีบัญชี — กด &quot;เพิ่มบัญชี&quot; เพื่อเริ่มต้น
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
