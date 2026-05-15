'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Search, ArrowUpRight, ArrowDownRight, Tag,
  Loader2, Filter, ChevronDown, X, Zap,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { formatCurrency } from '@/lib/utils';
import { categoryEmojiMap } from '@/store/appStore';
import { getWalletVisuals } from '@/lib/banks';
import WalletIconDisplay from '@/components/ui/WalletIconDisplay';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import SectionHeader from '@/components/ui/SectionHeader';

gsap.registerPlugin(ScrollTrigger);

type DateFilter = 'all' | 'today' | 'week' | 'month';

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all',   label: 'ทั้งหมด' },
  { value: 'today', label: 'วันนี้' },
  { value: 'week',  label: 'สัปดาห์นี้' },
  { value: 'month', label: 'เดือนนี้' },
];

function Dropdown({
  value, options, onChange, placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm text-[var(--cyber-text)] hover:border-white/[0.15] transition-all min-w-[120px] justify-between"
      >
        <span className="truncate">{selected?.label ?? placeholder ?? 'Select'}</span>
        <ChevronDown size={14} className={`shrink-0 text-[var(--cyber-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <div className="absolute z-50 mt-1 w-full min-w-[160px] py-1 rounded-xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.40)] overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  opt.value === value
                    ? 'bg-[var(--cyber-green)]/10 text-[var(--cyber-green)] font-medium'
                    : 'text-[var(--cyber-text-secondary)] hover:bg-white/[0.05] hover:text-[var(--cyber-text)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(user?.id);
  const { wallets } = useWallets(user?.id);

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [typeWalletFilter, setTypeWalletFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const pageRef = useRef<HTMLDivElement>(null);

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(transactions.map((t) => t.categoryName).filter(Boolean))].sort();
    return [{ value: 'all', label: 'ทุกหมวด' }, ...cats.map((c) => ({ value: c, label: c }))];
  }, [transactions]);

  const typeWalletOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: 'all', label: 'ทั้งหมด' },
      { value: 'income', label: 'รายรับ' },
      { value: 'expense', label: 'รายจ่าย' },
    ];
    if (wallets.length > 0) {
      opts.push({ value: '---', label: '──────' });
      wallets.forEach((w) => opts.push({ value: `wallet:${w.id}`, label: w.name }));
    }
    return opts;
  }, [wallets]);

  const dateBounds = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { todayStart, weekStart, monthStart };
  }, []);

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (search) {
          const q = search.toLowerCase();
          if (!tx.note.toLowerCase().includes(q) && !tx.categoryName.toLowerCase().includes(q)) return false;
        }
        if (typeWalletFilter !== 'all') {
          if (typeWalletFilter === 'income' && tx.type !== 'income') return false;
          if (typeWalletFilter === 'expense' && tx.type !== 'expense') return false;
          if (typeWalletFilter.startsWith('wallet:')) {
            if (tx.walletId !== typeWalletFilter.replace('wallet:', '')) return false;
          }
        }
        if (categoryFilter !== 'all' && tx.categoryName !== categoryFilter) return false;
        if (dateFilter !== 'all') {
          const txDate = new Date(tx.transaction_date);
          if (dateFilter === 'today' && txDate < dateBounds.todayStart) return false;
          if (dateFilter === 'week' && txDate < dateBounds.weekStart) return false;
          if (dateFilter === 'month' && txDate < dateBounds.monthStart) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [transactions, search, dateFilter, typeWalletFilter, categoryFilter, dateBounds]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    filtered.forEach((tx) => {
      const key = new Date(tx.transaction_date).toLocaleDateString('th-TH', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      if (!g[key]) g[key] = [];
      g[key].push(tx);
    });
    return g;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: filtered.length,
    income: filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }), [filtered]);

  const hasActiveFilters = dateFilter !== 'all' || typeWalletFilter !== 'all' || categoryFilter !== 'all' || search !== '';

  const clearFilters = () => {
    setSearch(''); setDateFilter('all'); setTypeWalletFilter('all'); setCategoryFilter('all');
  };

  // ── GSAP ScrollTrigger Stagger for date groups ──
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      const dateGroups = gsap.utils.toArray<HTMLElement>('.history-date-group', pageRef.current);
      dateGroups.forEach((group) => {
        const rows = gsap.utils.toArray<HTMLElement>('.history-tx-row', group);
        if (rows.length === 0) return;
        gsap.set(rows, { y: 20, opacity: 0 });
        gsap.to(rows, {
          y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.06,
          scrollTrigger: { trigger: group, start: 'top 90%', once: true },
        });
      });
    },
    { scope: pageRef, dependencies: [grouped, loading] }
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 className="w-7 h-7 text-[var(--cyber-green)] animate-spin" />
        <p className="text-xs text-[var(--cyber-text-secondary)]">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col space-y-5 pb-20 lg:pb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-green)] hud-dot" />
          <span className="cyber-label-green">TRANSACTION LEDGER</span>
        </div>
        <h1 className="text-xl font-bold text-[var(--cyber-text)]">History</h1>
        <p className="text-xs text-[var(--cyber-text-secondary)] mt-0.5">{transactions.length} transactions total</p>
      </div>

      {/* Filter panel — glassmorphism */}
      <div className="rounded-2xl border border-white/[0.06] glass-card p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cyber-text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-[var(--cyber-text)] placeholder-[var(--cyber-text-muted)] focus:border-[var(--cyber-green)]/40 outline-none transition-all" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown value={dateFilter} options={DATE_OPTIONS} onChange={(v) => setDateFilter(v as DateFilter)} placeholder="Date" />
          <Dropdown value={typeWalletFilter} options={typeWalletOptions.filter((o) => o.value !== '---')} onChange={setTypeWalletFilter} placeholder="Type / Wallet" />
          <Dropdown value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} placeholder="Category" />
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs text-[var(--cyber-text-muted)] hover:text-[var(--cyber-red)] transition-colors">
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats bar — glassmorphism */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Transactions', value: stats.total.toString(), color: 'text-[var(--cyber-text)]' },
          { label: 'Income', value: `+${formatCurrency(stats.income)}`, color: 'text-[var(--color-success)]' },
          { label: 'Expense', value: `-${formatCurrency(stats.expense)}`, color: 'text-[var(--cyber-red)]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] glass-card p-3 text-center">
            <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
            <p className="text-[10px] text-[var(--cyber-text-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Transaction list — magnetic glass rows */}
      <div className="space-y-5">
        {Object.entries(grouped).length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] glass-card">
            <Filter className="text-[var(--cyber-text-muted)] mb-3" size={20} />
            <p className="text-sm text-[var(--cyber-text-secondary)]">{transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-[var(--cyber-green)] mt-2 hover:opacity-70 transition-opacity">Clear filters</button>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date} className="space-y-1.5 history-date-group">
              <SectionHeader title={date} noDivider={false} mb="mb-2" />
              {txs.map((tx) => {
                const isAi = tx.is_ai_generated === true;
                return (
                  <div key={tx.id} className={`history-tx-row group flex items-center gap-3 rounded-xl p-3.5 bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 cursor-pointer ${isAi ? 'ai-sparkle' : ''}`}>
                    {tx.walletType === 'bank' ? (
                      <div className="shrink-0"><WalletIconDisplay visuals={getWalletVisuals(tx.walletName, tx.walletType)} size={40} /></div>
                    ) : (
                      <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-white/[0.04] group-hover:bg-white/[0.06] border border-transparent text-lg rounded-xl transition-colors">{tx.emoji || categoryEmojiMap[tx.categoryName] || '💸'}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-[var(--cyber-text)] truncate">{tx.note}</p>
                        {isAi && <Zap size={10} className="text-[var(--cyber-cyan)] shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--cyber-text-muted)] flex items-center gap-1"><Tag size={9} /> {tx.categoryName}</span>
                        <span className="text-[var(--cyber-text-muted)]">&middot;</span>
                        <span className="text-[10px] text-[var(--cyber-text-muted)]">{new Date(tx.transaction_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold font-mono flex items-center justify-end gap-1 ${tx.type === 'income' ? 'text-[var(--color-success)]' : 'text-[var(--cyber-red)]'}`}>
                        {tx.type === 'income' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] text-[var(--cyber-text-muted)] mt-0.5">{tx.walletName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
