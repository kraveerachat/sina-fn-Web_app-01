'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import BalanceHero          from '@/components/dashboard/BalanceHero';
import WalletCarousel       from '@/components/dashboard/WalletCarousel';
import SpendingBreakdown    from '@/components/dashboard/SpendingBreakdown';
import GoalGrid             from '@/components/goals/GoalGrid';
import TransactionList      from '@/components/dashboard/TransactionList';
import QuickAddModal        from '@/components/dashboard/QuickAddModal';
import SectionHeader        from '@/components/ui/SectionHeader';
import { useDashboard }     from '@/hooks/useDashboard';
import { useGoals }         from '@/hooks/useGoals';
import Link                 from 'next/link';

// ── Animation Variants ──
const containerVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.10, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function DashboardPage() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const {
    wallets,
    recentTransactions,
    totalBalance,
    totalIncome,
    totalExpense,
    donutSegments,
    totalSpending,
    spendingByCategory,
    loading,
    refetch,
  } = useDashboard();

  const { goals, loading: goalsLoading } = useGoals();

  // ── Loading State ──
  if (loading || goalsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-7 h-7 text-[var(--cyber-green)] animate-spin" />
        <p className="text-xs text-[var(--cyber-text-secondary)]">
          Loading your data...
        </p>
      </div>
    );
  }

  // ── Map transactions for TransactionList ──
  const recentTx = recentTransactions.map((t) => ({
    id:               t.id,
    emoji:            t.emoji,
    note:             t.note,
    categoryName:     t.categoryName,
    amount:           t.amount,
    type:             t.type as 'income' | 'expense' | 'transfer',
    transaction_date: t.transaction_date,
    walletName:       t.walletName,
    walletType:       t.walletType,
  }));

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
          {/* Savings Goals Widget */}
          <motion.div variants={itemVariants} className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <SectionHeader title="Savings Goals" noDivider={true} mb="" />
              <Link href="/goals" className="text-[11px] font-medium text-[var(--cyber-cyan)] hover:opacity-70 transition-opacity">
                View All
              </Link>
            </div>
            <GoalGrid goals={goals.slice(0, 2)} columns={1} />
          </motion.div>

          {/* Spending Donut Chart */}
          <motion.div variants={itemVariants}>
            <SectionHeader title="Spending Breakdown" />
            <SpendingBreakdown
              donutSegments={donutSegments}
              spendingByCategory={spendingByCategory}
              totalSpending={totalSpending}
            />
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants}>
          <TransactionList transactions={recentTx} />
        </motion.div>
      </motion.div>

      {/* Sticky Quick Add Button */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', damping: 24 }}
        className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-30 p-4 pointer-events-none"
      >
        <div className="max-w-[1200px] mx-auto">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="
              pointer-events-auto w-full flex items-center justify-center gap-2.5
              rounded-2xl bg-[var(--cyber-green)] text-white
              font-semibold text-sm py-4
              shadow-[0_4px_24px_var(--cyber-green-glow)]
              hover:opacity-90 transition-all duration-200
              active:scale-[0.99]
            "
          >
            <Plus size={18} strokeWidth={2.5} />
            Quick Add
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
