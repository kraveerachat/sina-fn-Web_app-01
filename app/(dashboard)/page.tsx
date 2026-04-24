'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import BalanceHero       from '@/components/dashboard/BalanceHero';
import WalletCarousel    from '@/components/dashboard/WalletCarousel';
import BudgetEnvelopes   from '@/components/dashboard/BudgetEnvelopes';
import TransactionList   from '@/components/dashboard/TransactionList';
import QuickAddModal     from '@/components/dashboard/QuickAddModal';
import SectionHeader     from '@/components/ui/SectionHeader';
import { useDashboard }  from '@/hooks/useDashboard';

// ── Animation Variants ──
const containerVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function DashboardPage() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // ── All data and derived values come from useDashboard ──
  // No direct Supabase calls. No useState for data. No useEffect for fetching.
  const {
    wallets,
    recentTransactions,
    budgets,
    totalBalance,
    totalIncome,
    totalExpense,
    donutSegments,
    totalSpending,
    spendingByCategory,
    loading,
    refetch,
  } = useDashboard();

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-8 h-8 text-[var(--cyber-green)] animate-spin" />
        <p className="cyber-label text-[var(--cyber-green)] status-blip">
          INITIALIZING DATA...
        </p>
      </div>
    );
  }

  // ── Map budgets to the shape BudgetEnvelopes expects ──
  const budgetEnvelopes = budgets.map((b) => ({
    id:           b.id,
    categoryName: b.categoryName,
    icon:         b.icon,
    spent:        b.spent,
    limit:        b.limit,
    color:        b.color,
  }));

  // ── Map transactions for TransactionList ──
  const recentTx = recentTransactions.map((t) => ({
    id:               t.id,
    emoji:            t.emoji,
    note:             t.note,
    categoryName:     t.categoryName,
    amount:           t.amount,
    type:             t.type as 'income' | 'expense' | 'transfer',
    transaction_date: t.transaction_date,
  }));

  // ── Donut chart circumference ──
  const CIRCUMFERENCE = 2 * Math.PI * 38;

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 pb-24"
      >
        {/* Balance Hero */}
        <motion.div variants={itemVariants}>
          <BalanceHero
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
          />
        </motion.div>

        {/* Wallet Carousel */}
        <motion.div variants={itemVariants}>
          <WalletCarousel wallets={wallets} />
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Envelopes */}
          <motion.div variants={itemVariants}>
            <BudgetEnvelopes budgets={budgetEnvelopes} />
          </motion.div>

          {/* Spending Donut Chart */}
          <motion.div variants={itemVariants}>
            <SectionHeader title="SPENDING BREAKDOWN" />
            <div className="border border-[var(--cyber-border)] bg-[var(--cyber-surface)] p-5 flex flex-col items-center justify-center min-h-[220px]">
              {totalSpending > 0 ? (
                <>
                  {/* SVG Donut */}
                  <div className="relative w-36 h-36 mb-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--cyber-surface-alt)" strokeWidth="10" />
                      {donutSegments.map((seg, i) => (
                        <circle
                          key={i}
                          cx="50" cy="50" r="38"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="10"
                          strokeDasharray={`${seg.dashLength} ${CIRCUMFERENCE - seg.dashLength}`}
                          strokeDashoffset={seg.dashOffset}
                          className="transition-all duration-700"
                        />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="cyber-label">TOTAL</span>
                      <span className="text-base font-bold font-mono text-[var(--cyber-text)] mt-0.5">
                        ฿{totalSpending.toLocaleString('th-TH')}
                      </span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 w-full max-w-[240px]">
                    {Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a).map(([cat, val]) => (
                      <div key={cat} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 shrink-0"
                          style={{ backgroundColor: donutSegments.find(s => s.category === cat)?.color ?? 'var(--cyber-text-secondary)' }}
                        />
                        <span className="cyber-label truncate">{cat}</span>
                        <span className="cyber-label text-[var(--cyber-text)] ml-auto">
                          ฿{val.toLocaleString('th-TH')}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="cyber-label text-[var(--cyber-text-muted)]">NO SPENDING DATA</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants}>
          <TransactionList transactions={recentTx} />
        </motion.div>
      </motion.div>

      {/* Sticky Quick Add Button */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', damping: 20 }}
        className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-30 p-4 pointer-events-none"
      >
        <div className="max-w-[1200px] mx-auto">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="
              pointer-events-auto w-full flex items-center justify-center gap-2.5
              rounded-none bg-[var(--cyber-green)] text-[var(--cyber-bg)]
              font-bold font-mono text-sm tracking-[3px] uppercase py-4
              shadow-[0_0_30px_var(--cyber-green-glow),0_-8px_30px_var(--cyber-green-glow)]
              hover:shadow-[0_0_40px_var(--cyber-green-glow-sm)]
              transition-all duration-300 hover:scale-[1.005] active:scale-[0.998]
            "
          >
            <Plus size={18} strokeWidth={3} />
            QUICK ADD // บันทึกด่วน
          </button>
        </div>
      </motion.div>

      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSave={refetch}
      />
    </>
  );
}
