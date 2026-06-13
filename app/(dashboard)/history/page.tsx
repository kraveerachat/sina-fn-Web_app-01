'use client';

// ═══════════════════════════════════════════════════════════════════
// History — matches the design prototype (page_history.jsx):
// toolbar card (search inset + segmented date/type + clear chip),
// three stat cards (eyebrow + 30px tnum), then one card per day
// with an eyebrow day label and hairline-divided transaction rows.
// All filtering logic flows through the existing hooks untouched.
// ═══════════════════════════════════════════════════════════════════

import { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Sparkles, ChevronDown, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { formatCurrency, formatTime } from '@/lib/utils';
import { categoryEmojiMap } from '@/store/appStore';
import { getWalletVisuals } from '@/lib/banks';
import WalletIconDisplay from '@/components/ui/WalletIconDisplay';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';

gsap.registerPlugin(ScrollTrigger);

type DateFilter = 'all' | 'today' | 'week' | 'month';
type TypeFilter = 'all' | 'income' | 'expense';

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all',   label: 'ทั้งหมด' },
  { value: 'today', label: 'วันนี้' },
  { value: 'week',  label: 'สัปดาห์นี้' },
  { value: 'month', label: 'เดือนนี้' },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all',     label: 'ทั้งหมด' },
  { value: 'income',  label: 'รายรับ' },
  { value: 'expense', label: 'รายจ่าย' },
];

/* ── Segmented control (uses .seg from globals.css) ── */
function Seg<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={o.value === value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Pill dropdown — for the long category / wallet lists ── */
function Dropdown({
  value, options, onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
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
        className="press tap flex items-center gap-2 rounded-full border border-(--border-2) bg-(--surface-2) px-3.5 py-2 text-[12.5px] font-medium text-(--text-2) transition-colors hover:text-(--text)"
      >
        <span className="max-w-[140px] truncate">{selected?.label ?? 'เลือก'}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-(--text-3) transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 max-h-64 w-max min-w-[160px] overflow-y-auto rounded-2xl border border-(--border) bg-(--surface) py-1.5 shadow-(--shadow-lg)">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`block w-full px-3.5 py-2 text-left text-[13px] transition-colors ${
                opt.value === value
                  ? 'bg-(--blue-soft) font-medium text-(--blue)'
                  : 'text-(--text-2) hover:bg-(--surface-2) hover:text-(--text)'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Day label — วันนี้ / เมื่อวาน / Thai date ── */
function dayLabel(dateKey: string): string {
  const d = new Date(dateKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(d);
  that.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diff === 0) return 'วันนี้';
  if (diff === 1) return 'เมื่อวาน';
  return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { transactions, loading } = useTransactions(user?.id);
  const { wallets } = useWallets(user?.id);

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const pageRef = useRef<HTMLDivElement>(null);

  const categoryOptions = useMemo(() => {
    const cats = [...new Set(transactions.map((t) => t.categoryName).filter(Boolean))].sort();
    return [{ value: 'all', label: 'ทุกหมวด' }, ...cats.map((c) => ({ value: c, label: c }))];
  }, [transactions]);

  const walletOptions = useMemo(
    () => [
      { value: 'all', label: 'ทุกกระเป๋า' },
      ...wallets.map((w) => ({ value: w.id, label: w.name })),
    ],
    [wallets]
  );

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
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (walletFilter !== 'all' && tx.walletId !== walletFilter) return false;
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
  }, [transactions, search, dateFilter, typeFilter, walletFilter, categoryFilter, dateBounds]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    filtered.forEach((tx) => {
      const d = new Date(tx.transaction_date);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
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

  const hasActiveFilters =
    dateFilter !== 'all' || typeFilter !== 'all' || walletFilter !== 'all' ||
    categoryFilter !== 'all' || search !== '';

  const clearFilters = () => {
    setSearch(''); setDateFilter('all'); setTypeFilter('all');
    setWalletFilter('all'); setCategoryFilter('all');
  };

  // ── Staggered row reveal per day group ──
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const dateGroups = gsap.utils.toArray<HTMLElement>('.history-date-group', pageRef.current);
      dateGroups.forEach((group) => {
        const rows = gsap.utils.toArray<HTMLElement>('.history-tx-row', group);
        if (rows.length === 0) return;
        gsap.fromTo(rows,
          { y: 16, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.05,
            scrollTrigger: { trigger: group, start: 'top 90%', once: true },
          }
        );
      });
    },
    { scope: pageRef, dependencies: [grouped, loading] }
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="cyber-skeleton h-16 w-1/3 rounded-2xl" />
        <div className="cyber-skeleton h-20 rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="cyber-skeleton h-24 rounded-3xl" />
          <div className="cyber-skeleton h-24 rounded-3xl" />
          <div className="cyber-skeleton h-24 rounded-3xl" />
        </div>
        <div className="cyber-skeleton h-[400px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col gap-4">
      {/* ── Page head ── */}
      <div className="mb-1 mt-1.5">
        <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.025em] text-(--text) lg:text-[30px]">
          ประวัติ
        </h1>
        <p className="mt-1 text-[14.5px] text-(--text-2)">ทุกความเคลื่อนไหวของเงินคุณ</p>
      </div>

      {/* ── Toolbar card: search + segmented filters ── */}
      <div className="rounded-3xl border border-(--border) bg-(--surface) p-4 shadow-(--shadow)">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-[1_1_220px] items-center gap-2.5 rounded-[14px] border border-(--border-2) bg-(--surface-2) px-3.5">
            <Search size={17} className="shrink-0 text-(--text-3)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา…"
              className="w-full bg-transparent py-3 text-[15px] text-(--text) outline-none placeholder:text-(--text-3)"
            />
          </div>
          <Seg options={DATE_OPTIONS} value={dateFilter} onChange={setDateFilter} />
          <Seg options={TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} />
          <Dropdown value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
          <Dropdown value={walletFilter} options={walletOptions} onChange={setWalletFilter} />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="press tap flex items-center gap-1.5 rounded-full border border-(--border-2) bg-(--surface-2) px-3 py-2 text-[12.5px] font-medium text-(--text-2) transition-colors hover:text-(--text)"
            >
              <X size={13} /> ล้าง
            </button>
          )}
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-3)">
            จำนวนรายการ
          </p>
          <p className="tnum mt-1.5 text-[30px] font-bold leading-none tracking-[-0.02em] text-(--text)">
            {stats.total}
          </p>
        </div>
        <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-3)">
            รายรับ
          </p>
          <p className="tnum mt-1.5 text-[30px] font-bold leading-none tracking-[-0.02em] text-(--green)">
            +{formatCurrency(stats.income)}
          </p>
        </div>
        <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-3)">
            รายจ่าย
          </p>
          <p className="tnum mt-1.5 text-[30px] font-bold leading-none tracking-[-0.02em] text-(--expense)">
            −{formatCurrency(stats.expense)}
          </p>
        </div>
      </div>

      {/* ── Grouped transactions — one card per day ── */}
      {Object.entries(grouped).length === 0 ? (
        <div className="rounded-3xl border border-(--border) bg-(--surface) p-12 text-center shadow-(--shadow)">
          <p className="text-sm text-(--text-3)">
            {transactions.length === 0 ? 'ยังไม่มีรายการ' : 'ไม่พบรายการ'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-[13px] font-medium text-(--blue) transition-opacity hover:opacity-70"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      ) : (
        Object.entries(grouped).map(([dateKey, txs]) => (
          <div
            key={dateKey}
            className="history-date-group rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-3)">
                {dayLabel(dateKey)}
              </p>
              <p className="tnum text-xs text-(--text-3)">{txs.length} รายการ</p>
            </div>

            <div className="flex flex-col">
              {txs.map((tx) => {
                const isAi = tx.is_ai_generated === true;
                const isIncome = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    className="history-tx-row flex items-center gap-3 border-b border-(--border-2) py-3 last:border-b-0"
                  >
                    {/* Icon tile */}
                    {tx.walletType === 'bank' ? (
                      <div className="shrink-0">
                        <WalletIconDisplay
                          visuals={getWalletVisuals(tx.walletName, tx.walletType)}
                          size={38}
                        />
                      </div>
                    ) : (
                      <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-(--surface-2) text-[17px]">
                        {tx.emoji || categoryEmojiMap[tx.categoryName] || '💸'}
                      </div>
                    )}

                    {/* Title + meta */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-(--text)">{tx.note}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-(--text-3)">
                        <span className="truncate">{tx.categoryName}</span>
                        {tx.walletName && (
                          <span className="shrink-0 truncate">· {tx.walletName}</span>
                        )}
                        {isAi && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--gold-soft) px-1.5 py-px text-[10.5px] font-semibold text-(--gold)">
                            <Sparkles size={10} /> AI
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount + time */}
                    <div className="shrink-0 text-right">
                      <p
                        className={`tnum text-[14.5px] font-semibold tracking-[-0.01em] ${
                          isIncome ? 'text-(--green)' : 'text-(--text)'
                        }`}
                      >
                        {isIncome ? '+' : '−'}
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-(--text-3)">
                        {formatTime(tx.transaction_date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
