'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence }               from 'framer-motion';
import {
  Search, ArrowUpRight, ArrowDownRight, Tag,
  Loader2, Filter, ChevronDown, X,
} from 'lucide-react';
import { formatCurrency }    from '@/lib/utils';
import { categoryEmojiMap }  from '@/store/appStore';
import { getWalletVisuals }  from '@/lib/banks';
import WalletIconDisplay     from '@/components/ui/WalletIconDisplay';
import { useAuth }           from '@/hooks/useAuth';
import { useTransactions }   from '@/hooks/useTransactions';
import { useWallets }        from '@/hooks/useWallets';
import SectionHeader         from '@/components/ui/SectionHeader';

// ── Filter types ──
type DateFilter = 'all' | 'today' | 'week' | 'month';

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all',   label: 'ทั้งหมด' },
  { value: 'today', label: 'วันนี้' },
  { value: 'week',  label: 'สัปดาห์นี้' },
  { value: 'month', label: 'เดือนนี้' },
];

// ── Reusable dropdown component ──
function Dropdown({
  value,
  options,
  onChange,
  placeholder,
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
        className="
          flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
          border border-[var(--cyber-border)] bg-[var(--cyber-surface)]
          text-[var(--cyber-text)] hover:border-[var(--border-light)]
          transition-all min-w-[120px] justify-between
        "
      >
        <span className="truncate">{selected?.label ?? placeholder ?? 'Select'}</span>
        <ChevronDown size={14} className={`shrink-0 text-[var(--cyber-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="
              absolute z-50 mt-1 w-full min-w-[160px] py-1 rounded-xl
              border border-[var(--cyber-border)] bg-[var(--cyber-surface)]
              shadow-[0_8px_32px_rgba(0,0,0,0.28)] overflow-hidden
            "
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`
                  w-full text-left px-3 py-2 text-xs transition-colors
                  ${opt.value === value
                    ? 'bg-[var(--cyber-green)]/10 text-[var(--cyber-green)] font-medium'
                    : 'text-[var(--cyber-text-secondary)] hover:bg-[var(--cyber-surface-alt)] hover:text-[var(--cyber-text)]'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ──
export default function HistoryPage() {
  const { user }                        = useAuth();
  const { transactions, loading }       = useTransactions(user?.id);
  const { wallets }                     = useWallets(user?.id);

  const [search,         setSearch]         = useState('');
  const [dateFilter,     setDateFilter]     = useState<DateFilter>('all');
  const [typeWalletFilter, setTypeWalletFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // ── Dynamic category options from real data ──
  const categoryOptions = useMemo(() => {
    const cats = [...new Set(transactions.map((t) => t.categoryName).filter(Boolean))].sort();
    return [
      { value: 'all', label: 'ทุกหมวด' },
      ...cats.map((c) => ({ value: c, label: c })),
    ];
  }, [transactions]);

  // ── Type + Wallet combined options ──
  const typeWalletOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: 'all',     label: 'ทั้งหมด' },
      { value: 'income',  label: 'รายรับ' },
      { value: 'expense', label: 'รายจ่าย' },
    ];
    if (wallets.length > 0) {
      opts.push({ value: '---', label: '──────' }); // visual separator
      wallets.forEach((w) => {
        opts.push({ value: `wallet:${w.id}`, label: w.name });
      });
    }
    return opts;
  }, [wallets]);

  // ── Date boundary helpers ──
  const dateBounds = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay()); // Sunday start
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { todayStart, weekStart, monthStart };
  }, []);

  // ── Filtered + sorted transactions ──
  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search
        if (search) {
          const q = search.toLowerCase();
          if (!tx.note.toLowerCase().includes(q) && !tx.categoryName.toLowerCase().includes(q)) return false;
        }

        // Type or wallet filter
        if (typeWalletFilter !== 'all') {
          if (typeWalletFilter === 'income' && tx.type !== 'income') return false;
          if (typeWalletFilter === 'expense' && tx.type !== 'expense') return false;
          if (typeWalletFilter.startsWith('wallet:')) {
            const wId = typeWalletFilter.replace('wallet:', '');
            if (tx.walletId !== wId) return false;
          }
        }

        // Category
        if (categoryFilter !== 'all' && tx.categoryName !== categoryFilter) return false;

        // Date
        if (dateFilter !== 'all') {
          const txDate = new Date(tx.transaction_date);
          if (dateFilter === 'today' && txDate < dateBounds.todayStart) return false;
          if (dateFilter === 'week'  && txDate < dateBounds.weekStart) return false;
          if (dateFilter === 'month' && txDate < dateBounds.monthStart) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [transactions, search, dateFilter, typeWalletFilter, categoryFilter, dateBounds]);

  // ── Group by date ──
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

  // ── Stats ──
  const stats = useMemo(() => ({
    total:   filtered.length,
    income:  filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }), [filtered]);

  const hasActiveFilters = dateFilter !== 'all' || typeWalletFilter !== 'all' || categoryFilter !== 'all' || search !== '';

  const clearFilters = () => {
    setSearch('');
    setDateFilter('all');
    setTypeWalletFilter('all');
    setCategoryFilter('all');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 className="w-7 h-7 text-[var(--cyber-green)] animate-spin" />
        <p className="text-xs text-[var(--cyber-text-secondary)]">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-5 pb-20 lg:pb-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold text-[var(--cyber-text)]">History</h1>
        <p className="text-xs text-[var(--cyber-text-secondary)] mt-0.5">
          {transactions.length} transactions total
        </p>
      </div>

      {/* Filter panel */}
      <div className="rounded-2xl border border-[var(--cyber-border)] bg-[var(--cyber-surface)] p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cyber-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="
              w-full pl-10 pr-4 py-2.5 rounded-xl
              border border-[var(--cyber-border)] bg-[var(--cyber-surface-alt)]
              text-sm text-[var(--cyber-text)] placeholder-[var(--cyber-text-muted)]
              focus:border-[var(--cyber-green)]/40 outline-none transition-all
            "
          />
        </div>

        {/* Dropdown row */}
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            value={dateFilter}
            options={DATE_OPTIONS}
            onChange={(v) => setDateFilter(v as DateFilter)}
            placeholder="Date"
          />
          <Dropdown
            value={typeWalletFilter}
            options={typeWalletOptions.filter((o) => o.value !== '---')}
            onChange={setTypeWalletFilter}
            placeholder="Type / Wallet"
          />
          <Dropdown
            value={categoryFilter}
            options={categoryOptions}
            onChange={setCategoryFilter}
            placeholder="Category"
          />

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs text-[var(--cyber-text-muted)] hover:text-[var(--cyber-red)] transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Transactions', value: stats.total.toString(), color: 'text-[var(--cyber-text)]' },
          { label: 'Income',  value: `+${formatCurrency(stats.income)}`,  color: 'text-[var(--color-success)]' },
          { label: 'Expense', value: `-${formatCurrency(stats.expense)}`, color: 'text-[var(--cyber-red)]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-[var(--cyber-border)] bg-[var(--cyber-surface)] p-3 text-center">
            <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
            <p className="text-[10px] text-[var(--cyber-text-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div className="space-y-5">
        {Object.entries(grouped).length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--cyber-border)] bg-[var(--cyber-surface)]">
            <Filter className="text-[var(--cyber-text-muted)] mb-3" size={20} />
            <p className="text-sm text-[var(--cyber-text-secondary)]">
              {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-[var(--cyber-green)] mt-2 hover:opacity-70 transition-opacity"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date} className="space-y-2">
              <SectionHeader title={date} noDivider={false} mb="mb-2" />
              {txs.map((tx) => (
                <motion.div
                  key={tx.id}
                  layoutId={tx.id}
                  className="
                    flex items-center gap-3
                    rounded-xl border border-[var(--cyber-border)] bg-[var(--cyber-surface)] p-3.5
                    hover:border-[var(--border-light)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.16)]
                    transition-all group
                  "
                >
                  {/* Bank Logo OR Category Emoji */}
                  {tx.walletType === 'bank' ? (
                    <div className="shrink-0">
                      <WalletIconDisplay
                        visuals={getWalletVisuals(tx.walletName, tx.walletType)}
                        size={40}
                      />
                    </div>
                  ) : (
                    <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-[var(--cyber-surface-alt)] border border-[var(--cyber-border)] text-lg rounded-xl">
                      {tx.emoji || categoryEmojiMap[tx.categoryName] || '💸'}
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--cyber-text)] truncate">{tx.note}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[var(--cyber-text-muted)] flex items-center gap-1">
                        <Tag size={9} /> {tx.categoryName}
                      </span>
                      <span className="text-[var(--cyber-text-muted)]">&middot;</span>
                      <span className="text-[10px] text-[var(--cyber-text-muted)]">
                        {new Date(tx.transaction_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold font-mono flex items-center justify-end gap-1 ${
                      tx.type === 'income' ? 'text-[var(--color-success)]' : 'text-[var(--cyber-red)]'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-[var(--cyber-text-muted)] mt-0.5">{tx.walletName}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
