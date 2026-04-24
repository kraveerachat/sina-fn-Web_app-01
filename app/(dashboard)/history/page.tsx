'use client';

// ═══════════════════════════════════════════════════════════════════
// History Page — Transaction Log with Filtering
// Migrated: direct supabase → useAuth + useTransactions hooks
//           hex literals → CSS var tokens
// ═══════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { motion }            from 'framer-motion';
import { Search, ArrowUpRight, ArrowDownRight, Tag, Loader2, Filter } from 'lucide-react';
import { formatCurrency }    from '@/lib/utils';
import { categoryEmojiMap }  from '@/store/appStore';
import { useAuth }           from '@/hooks/useAuth';
import { useTransactions }   from '@/hooks/useTransactions';
import SectionHeader         from '@/components/ui/SectionHeader';

type DateFilter = 'all' | 'today' | 'week' | 'month';
type TypeFilter = 'all' | 'income' | 'expense';

export default function HistoryPage() {
  const { user }           = useAuth();
  const { transactions, loading } = useTransactions(user?.id);

  const [search,          setSearch]          = useState('');
  const [dateFilter,      setDateFilter]      = useState<DateFilter>('all');
  const [typeFilter,      setTypeFilter]      = useState<TypeFilter>('all');
  const [categoryFilter,  setCategoryFilter]  = useState('all');

  const categories = useMemo(() => (
    ['all', ...new Set(transactions.map((t) => t.categoryName).filter(Boolean))]
  ), [transactions]);

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((tx) => {
        const q = search.toLowerCase();
        if (q && !tx.note.toLowerCase().includes(q) && !tx.categoryName.toLowerCase().includes(q)) return false;
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && tx.categoryName !== categoryFilter) return false;
        if (dateFilter !== 'all') {
          const d = new Date(tx.transaction_date);
          d.setHours(0, 0, 0, 0);
          const today = new Date(); today.setHours(0, 0, 0, 0);
          if (dateFilter === 'today' && d.getTime() !== today.getTime()) return false;
          if (dateFilter === 'week') {
            const wk = new Date(today); wk.setDate(today.getDate() - 7);
            if (d < wk) return false;
          }
          if (dateFilter === 'month' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [transactions, search, dateFilter, typeFilter, categoryFilter]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-7 h-7 text-[var(--cyber-green)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-5 pb-20 lg:pb-6">
      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div className="h-7 w-0.5 bg-[var(--cyber-text)]" />
        <h1 className="text-2xl font-bold tracking-[4px] text-[var(--cyber-text)] uppercase font-mono">
          HISTORY
        </h1>
      </div>

      {/* Filter panel */}
      <div className="border border-[var(--cyber-border)] bg-[var(--cyber-surface)] p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cyber-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารายการ (Search)..."
            className="
              w-full pl-10 pr-4 py-2.5 rounded-none
              border border-[var(--cyber-border)] bg-[var(--cyber-surface-alt)]
              text-sm text-[var(--cyber-text)] placeholder-[var(--cyber-text-muted)]
              focus:border-[var(--cyber-green)]/40 outline-none transition-all font-mono
            "
          />
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-mono">
          {/* Date filter */}
          <div className="flex border border-[var(--cyber-border)] overflow-hidden">
            {(['all', 'today', 'week', 'month'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 uppercase transition-colors ${
                  dateFilter === f
                    ? 'bg-[var(--cyber-green)]/15 text-[var(--cyber-green)]'
                    : 'bg-[var(--cyber-surface-alt)] text-[var(--cyber-text-secondary)] hover:bg-[var(--cyber-border)]'
                }`}
              >
                {f === 'all' ? 'ทั้งหมด' : f === 'today' ? 'วันนี้' : f === 'week' ? 'สัปดาห์' : 'เดือนนี้'}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex border border-[var(--cyber-border)] overflow-hidden">
            {(['all', 'income', 'expense'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-3 py-1.5 uppercase transition-colors ${
                  typeFilter === f && f === 'income'  ? 'bg-[var(--cyber-green)]/15 text-[var(--cyber-green)]' :
                  typeFilter === f && f === 'expense' ? 'bg-[var(--cyber-red)]/15 text-[var(--cyber-red)]' :
                  typeFilter === f                    ? 'bg-[var(--cyber-green)]/15 text-[var(--cyber-green)]' :
                  'bg-[var(--cyber-surface-alt)] text-[var(--cyber-text-secondary)] hover:bg-[var(--cyber-border)]'
                }`}
              >
                {f === 'all' ? 'ทั้งหมด' : f === 'income' ? 'รายรับ' : 'รายจ่าย'}
              </button>
            ))}
          </div>
        </div>

        {/* Category chips */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`
                  px-3 py-1 text-[10px] font-mono uppercase border transition-all
                  ${categoryFilter === cat
                    ? 'bg-[var(--cyber-cyan)]/15 border-[var(--cyber-cyan)]/40 text-[var(--cyber-cyan)]'
                    : 'bg-[var(--cyber-surface-alt)] border-[var(--cyber-border)] text-[var(--cyber-text-secondary)] hover:border-[var(--cyber-text-muted)]'
                  }
                `}
              >
                {cat === 'all' ? 'ทุกหมวด' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 border border-[var(--cyber-border)] divide-x divide-[var(--cyber-border)]">
        {[
          { label: 'รายการทั้งหมด', value: filtered.length.toString(), color: 'text-[var(--cyber-text)]' },
          { label: 'รายรับ', value: `+${formatCurrency(filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))}`, color: 'text-[var(--cyber-green)]' },
          { label: 'รายจ่าย', value: `-${formatCurrency(filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}`, color: 'text-[var(--cyber-red)]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 bg-[var(--cyber-surface)] text-center">
            <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
            <p className="cyber-label mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div className="space-y-5">
        {Object.entries(grouped).length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center border border-dashed border-[var(--cyber-border)]">
            <Filter className="text-[var(--cyber-text-muted)] mb-3" size={22} />
            <p className="cyber-label">
              {transactions.length === 0 ? 'ยังไม่มีรายการ — บันทึกรายการแรกได้เลย!' : 'ไม่พบรายการที่ตรงกัน'}
            </p>
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
                    flex items-center gap-4
                    border border-[var(--cyber-border)] bg-[var(--cyber-surface-alt)] p-4
                    hover:border-[var(--cyber-green)]/20 hover:bg-[var(--cyber-surface)]
                    transition-all group
                  "
                >
                  {/* Emoji icon */}
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-[var(--cyber-bg)] border border-[var(--cyber-border)] text-xl group-hover:border-[var(--cyber-green)]/20 transition-colors">
                    {tx.emoji || categoryEmojiMap[tx.categoryName] || '💸'}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--cyber-text)] truncate">{tx.note}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="cyber-label flex items-center gap-1">
                        <Tag size={9} /> {tx.categoryName}
                      </span>
                      <span className="text-[var(--cyber-text-muted)]">·</span>
                      <span className="cyber-label">
                        {new Date(tx.transaction_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold font-mono flex items-center justify-end gap-1 ${
                      tx.type === 'income' ? 'text-[var(--cyber-green)]' : 'text-[var(--cyber-red)]'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="cyber-label mt-0.5">{tx.walletName}</p>
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
