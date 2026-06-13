'use client';

// ═══════════════════════════════════════════════════════════════════
// Dashboard Page — Bento Grid
//
// 12-column bento: blue hero (8) + wallets (4) on the first band,
// spending donut (7) + savings goals (5) on the second, recent
// transactions full-width below. Sections fade up with a gentle
// stagger; all data flows through the existing hooks untouched.
//
// FloatingDock lives in layout.tsx (outside transform context)
// and communicates via DockActionsContext.
// ═══════════════════════════════════════════════════════════════════

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useDockActions } from '@/hooks/useDockActions';
import BalanceHero from '@/components/dashboard/BalanceHero';
import WalletCarousel from '@/components/dashboard/WalletCarousel';
import SpendingBreakdown from '@/components/dashboard/SpendingBreakdown';
import CashFlowCard from '@/components/dashboard/CashFlowCard';
import GoalLines from '@/components/dashboard/GoalLines';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import TransactionList from '@/components/dashboard/TransactionList';
import QuickAddModal from '@/components/dashboard/QuickAddModal';
import AIChatBottomSheet from '@/components/ai/AIChatBottomSheet';
import { useDashboard } from '@/hooks/useDashboard';
import { useGoals } from '@/hooks/useGoals';

gsap.registerPlugin(ScrollTrigger);

function DashboardSkeleton() {
  return (
    <div className="bento">
      <div className="cyber-skeleton cell-8 h-[420px] rounded-3xl" />
      <div className="cyber-skeleton cell-4 h-[420px] rounded-3xl" />
      <div className="cyber-skeleton cell-4 h-[250px] rounded-3xl" />
      <div className="cyber-skeleton cell-8 h-[250px] rounded-3xl" />
      <div className="cyber-skeleton cell-7 h-[320px] rounded-3xl" />
      <div className="cyber-skeleton cell-5 h-[320px] rounded-3xl" />
    </div>
  );
}

export default function DashboardPage() {
  const { aiChatOpen, quickAddOpen, closeAiChat, closeQuickAdd, openQuickAdd } =
    useDockActions();

  // GSAP scope ref for section stagger animations
  const dashboardRef = useRef<HTMLDivElement>(null);

  const {
    wallets,
    transactions,
    recentTransactions,
    totalBalance,
    donutSegments,
    totalSpending,
    spendingByCategory,
    loading,
    refetch,
  } = useDashboard();

  const { goals, loading: goalsLoading } = useGoals();

  // ── Fluid reveal: the whole bento scales in from .97 while sections
  //    rise 20px with a 0.05s stagger (in-view immediately, below the
  //    fold via ScrollTrigger). The dashboard-dof CSS transition is
  //    suspended during the entrance so it doesn't fight GSAP, and
  //    transforms are cleared after so the DoF effect (chat open)
  //    keeps working. Skipped entirely on reduced motion. ──
  useGSAP(
    () => {
      const root = dashboardRef.current;
      if (!root || loading || goalsLoading) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      root.style.transition = 'none';
      gsap.fromTo(
        root,
        { scale: 0.97, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          onComplete: () => { root.style.transition = ''; },
        }
      );

      const sections = gsap.utils.toArray<HTMLElement>(
        '.dashboard-section',
        root
      );

      if (sections.length === 0) return;

      ScrollTrigger.batch(sections, {
        onEnter: (batch) => {
          gsap.fromTo(
            batch,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              ease: 'power3.out',
              stagger: 0.05,
              overwrite: 'auto',
              clearProps: 'transform',
            }
          );
        },
        start: 'top 92%',
        once: true,
      });

      return () => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    },
    { scope: dashboardRef, dependencies: [loading, goalsLoading] }
  );

  // ── Loading state — bento-shaped skeleton ──
  if (loading || goalsLoading) {
    return <DashboardSkeleton />;
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
      {/* Dashboard bento with DoF effect while chat is open */}
      <div
        ref={dashboardRef}
        className={`bento dashboard-dof ${
          aiChatOpen ? 'dashboard-dof--active' : ''
        }`}
      >
        {/* Balance Hero — trend chart + range control + send/request */}
        <div className="dashboard-section hero-glow cell-8">
          <BalanceHero
            totalBalance={totalBalance}
            transactions={transactions}
            onSend={openQuickAdd}
            onRequest={openQuickAdd}
          />
        </div>

        {/* Spending donut — narrow vertical cell */}
        <div className="dashboard-section cell-4 rounded-3xl glow-ambient glow-ambient-blue glow-ambient-hover">
          <SpendingBreakdown
            donutSegments={donutSegments}
            spendingByCategory={spendingByCategory}
            totalSpending={totalSpending}
            vertical
          />
        </div>

        {/* Wallets — narrow left cell (mirrors the prototype) */}
        <div className="dashboard-section cell-4 rounded-3xl glow-ambient glow-ambient-blue glow-ambient-hover">
          <WalletCarousel wallets={wallets} />
        </div>

        {/* Cash flow — last 7 days */}
        <div className="dashboard-section cell-8 rounded-3xl glow-ambient glow-ambient-green glow-ambient-hover">
          <CashFlowCard transactions={transactions} />
        </div>

        {/* Recent transactions — tall left column */}
        <div className="dashboard-section cell-7 rounded-3xl glow-ambient glow-ambient-neutral glow-ambient-hover">
          <TransactionList transactions={recentTx} />
        </div>

        {/* Goals + quick actions — stacked right column */}
        <div className="dashboard-section cell-5 flex flex-col gap-4">
          <div className="rounded-3xl glow-ambient glow-ambient-gold glow-ambient-hover">
            <GoalLines goals={goals.slice(0, 3)} />
          </div>
          <div className="rounded-3xl glow-ambient glow-ambient-gold glow-ambient-hover">
            <QuickActionsCard onQuickAdd={openQuickAdd} />
          </div>
        </div>

        {/* Footer */}
        <p className="cell-12 mt-2 text-center text-[12.5px] text-(--text-3)">
          Sina_FN · Personal Finance
        </p>
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
