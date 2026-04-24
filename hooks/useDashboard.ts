// ═══════════════════════════════════════════════════════════════════
// hooks/useDashboard.ts — Composite Dashboard Hook
//
// Combines useAuth + useWallets + useTransactions + useBudgets and
// pre-computes all derived values the Dashboard page needs.
//
// This is the primary hook for app/(dashboard)/page.tsx.
// The page becomes ~50 lines of pure layout after using this hook.
//
// Usage:
//   const {
//     wallets, transactions, budgets,
//     totalBalance, totalIncome, totalExpense,
//     spendingByCategory, donutSegments,
//     loading, error, refetch
//   } = useDashboard();
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useCallback, useMemo } from 'react';
import { useAuth }         from './useAuth';
import { useWallets }      from './useWallets';
import { useTransactions } from './useTransactions';
import { useBudgets }      from './useBudgets';
import { categoryColors }  from '@/lib/design-tokens';

// ── Donut Segment Shape ────────────────────────────────────────────
export interface DonutSegment {
  category: string;
  value: number;
  color: string;
  dashLength: number;
  dashOffset: number;
}

// ── Full Dashboard Hook Return Type ────────────────────────────────
export interface UseDashboardResult {
  // ── Auth ──
  userId: string | null;

  // ── Raw Data ──
  wallets:      ReturnType<typeof useWallets>['wallets'];
  transactions: ReturnType<typeof useTransactions>['transactions'];
  budgets:      ReturnType<typeof useBudgets>['budgets'];

  // ── Computed Financials ──
  /** Sum of all wallet balances */
  totalBalance: number;
  /** Sum of all income transactions this month */
  totalIncome: number;
  /** Sum of all expense transactions this month */
  totalExpense: number;
  /** Net = totalIncome - totalExpense */
  netCashFlow: number;

  // ── Spending Breakdown (for charts) ──
  /** Record<categoryName, totalAmount> — expenses only */
  spendingByCategory: Record<string, number>;
  /** Pre-calculated SVG donut segments, ready to render */
  donutSegments: DonutSegment[];
  /** Total spending amount (sum of all expense categories) */
  totalSpending: number;

  // ── Recent Transactions (last 8) ──
  recentTransactions: ReturnType<typeof useTransactions>['transactions'];

  // ── State ──
  loading: boolean;
  /** Non-null when any fetch fails */
  error: string | null;
  /** Refreshes wallets, transactions, and budgets simultaneously */
  refetch: () => void;
}

// SVG donut circumference for r=38
const DONUT_CIRCUMFERENCE = 2 * Math.PI * 38;

export function useDashboard(): UseDashboardResult {
  // ── Data Layers ──
  const { user }                                             = useAuth();
  const { wallets, loading: wLoading, error: wError, refetch: rWallets }         = useWallets(user?.id);
  const { transactions, loading: tLoading, error: tError, refetch: rTxns }       = useTransactions(user?.id);
  const { budgets, loading: bLoading, error: bError, refetch: rBudgets }         = useBudgets(user?.id);

  // ── Combined loading / error ──
  const loading = wLoading || tLoading || bLoading;
  const error   = wError ?? tError ?? bError ?? null;

  // ── Combined refetch ──
  const refetch = useCallback(() => {
    rWallets();
    rTxns();
    rBudgets();
  }, [rWallets, rTxns, rBudgets]);

  // ── Financial Derived Values ──
  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  const totalIncome = useMemo(
    () => transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () => transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const netCashFlow = totalIncome - totalExpense;

  // ── Spending Breakdown ──
  const spendingByCategory = useMemo(
    () => transactions
      .filter((t) => t.type === 'expense')
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
        return acc;
      }, {}),
    [transactions]
  );

  // ── Pre-computed Donut Segments for SVG chart ──
  const { donutSegments, totalSpending } = useMemo(() => {
    const entries = Object.entries(spendingByCategory)
      .sort(([, a], [, b]) => b - a);

    const total = entries.reduce((s, [, v]) => s + v, 0);

    // Build segments with immutable running-offset (no mutation inside map)
    const segments = entries.reduce<{ list: DonutSegment[]; offset: number }>(
      ({ list, offset }, [cat, val]) => {
        const pct        = total > 0 ? val / total : 0;
        const dashLength = pct * DONUT_CIRCUMFERENCE;
        return {
          list: [
            ...list,
            {
              category:   cat,
              value:      val,
              color:      categoryColors[cat] ?? '#6B7280',
              dashLength,
              dashOffset: offset,
            },
          ],
          offset: offset - dashLength,
        };
      },
      { list: [], offset: 0 }
    ).list;

    return { donutSegments: segments, totalSpending: total };
  }, [spendingByCategory]);

  // ── Recent Transactions (last 8) ──
  const recentTransactions = useMemo(
    () => transactions.slice(0, 8),
    [transactions]
  );

  return {
    userId: user?.id ?? null,
    wallets,
    transactions,
    budgets,
    totalBalance,
    totalIncome,
    totalExpense,
    netCashFlow,
    spendingByCategory,
    donutSegments,
    totalSpending,
    recentTransactions,
    loading,
    error,
    refetch,
  };
}
