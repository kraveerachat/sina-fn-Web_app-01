'use client';

// ═══════════════════════════════════════════════════════════════════
// Dashboard Page — Utopia Tokyo HUD
//
// §3: GSAP kinetic typography + staggered section reveals
// §4: ScrollTrigger-driven card entrances
// §5: Dashboard DoF effect when AI chat opens
//
// FloatingDock lives in layout.tsx (outside transform context)
// and communicates via DockActionsContext.
// ═══════════════════════════════════════════════════════════════════

import { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useDockActions } from '@/hooks/useDockActions';
import BalanceHero from '@/components/dashboard/BalanceHero';
import WalletCarousel from '@/components/dashboard/WalletCarousel';
import SpendingBreakdown from '@/components/dashboard/SpendingBreakdown';
import GoalGrid from '@/components/goals/GoalGrid';
import TransactionList from '@/components/dashboard/TransactionList';
import QuickAddModal from '@/components/dashboard/QuickAddModal';
import AIChatBottomSheet from '@/components/ai/AIChatBottomSheet';
import SectionHeader from '@/components/ui/SectionHeader';
import { useDashboard } from '@/hooks/useDashboard';
import { useGoals } from '@/hooks/useGoals';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export default function DashboardPage() {
  const { aiChatOpen, quickAddOpen, closeAiChat, closeQuickAdd } = useDockActions();

  // GSAP scope ref for section stagger animations
  const dashboardRef = useRef<HTMLDivElement>(null);

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

  // ── GSAP Stagger Reveals ──
  useGSAP(
    () => {
      if (!dashboardRef.current || loading || goalsLoading) return;

      const sections = gsap.utils.toArray<HTMLElement>(
        '.dashboard-section',
        dashboardRef.current
      );

      if (sections.length === 0) return;

      gsap.set(sections, { y: 30, opacity: 0 });

      gsap.to(sections, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.05,
      });
    },
    { scope: dashboardRef, dependencies: [loading, goalsLoading] }
  );

  // ── Loading State ──
  if (loading || goalsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-7 h-7 text-(--cyber-green) animate-spin" />
        <p className="text-xs text-(--cyber-text-secondary)">
          Loading your data...
        </p>
      </div>
    );
  }

  // ── Map transactions for TransactionList ──
  const recentTx = recentTransactions.map((t) => ({
    id: t.id,
    emoji: t.emoji,
    note: t.note,
    categoryName: t.categoryName,
    amount: t.amount,
    type: t.type as 'income' | 'expense' | 'transfer',
    transaction_date: t.transaction_date,
    walletName: t.walletName,
    walletType: t.walletType,
    is_ai_generated: t.is_ai_generated,
  }));

  return (
    <>
      {/* Dashboard content with DoF effect */}
      <div
        ref={dashboardRef}
        className={`space-y-6 pb-32 dashboard-dof ${
          aiChatOpen ? 'dashboard-dof--active' : ''
        }`}
      >
        {/* Balance Hero */}
        <div className="dashboard-section">
          <BalanceHero
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
          />
        </div>

        {/* Wallet Carousel */}
        <div className="dashboard-section">
          <WalletCarousel wallets={wallets} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Savings Goals Widget */}
          <div className="dashboard-section flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <SectionHeader title="Savings Goals" noDivider={true} mb="" />
              <Link
                href="/goals"
                className="text-[11px] font-medium text-(--cyber-cyan) hover:opacity-70 transition-opacity"
              >
                View All
              </Link>
            </div>
            <GoalGrid goals={goals.slice(0, 2)} columns={1} />
          </div>

          {/* Spending Donut Chart */}
          <div className="dashboard-section">
            <SectionHeader title="Spending Breakdown" />
            <SpendingBreakdown
              donutSegments={donutSegments}
              spendingByCategory={spendingByCategory}
              totalSpending={totalSpending}
            />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="dashboard-section">
          <TransactionList transactions={recentTx} />
        </div>
      </div>

      {/* Modals — controlled via DockActions context */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={closeQuickAdd}
        onSave={refetch}
      />

      <AIChatBottomSheet
        isOpen={aiChatOpen}
        onClose={closeAiChat}
        onSaved={refetch}
      />
    </>
  );
}
