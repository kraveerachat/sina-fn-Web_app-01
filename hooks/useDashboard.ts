// ═══════════════════════════════════════════════════════════════════
// hooks/useDashboard.ts — Composite Dashboard Hook
//
// Combines useAuth + useWallets + useTransactions + useBudgets and
// pre-computes all derived values the Dashboard page needs.
//
// Financial summaries (income, expense, spending breakdown) are
// scoped to the current calendar month. Recent transactions show
// the 5 most recent entries across all time.
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth }         from './useAuth';
import { useWallets }      from './useWallets';
import { useTransactions } from './useTransactions';
import { useBudgets }      from './useBudgets';
import { categoryColors }  from '@/lib/design-tokens';
import { recalculateWalletBalances } from '@/lib/supabase/queries';

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
  userId: string | null;
  wallets:      ReturnType<typeof useWallets>['wallets'];
  transactions: ReturnType<typeof useTransactions>['transactions'];
  budgets:      ReturnType<typeof useBudgets>['budgets'];

  /** Sum of all wallet balances */
  totalBalance: number;
  /** Sum of income transactions THIS MONTH */
  totalIncome: number;
  /** Sum of expense transactions THIS MONTH */
  totalExpense: number;
  /** Net = totalIncome - totalExpense (this month) */
  netCashFlow: number;

  /** Record<categoryName, totalAmount> — expenses this month only */
  spendingByCategory: Record<string, number>;
  /** Pre-calculated SVG donut segments */
  donutSegments: DonutSegment[];
  /** Total spending amount this month */
  totalSpending: number;

  /** 5 most recent transactions (all time) */
  recentTransactions: ReturnType<typeof useTransactions>['transactions'];

  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// SVG donut circumference for r=38
const DONUT_CIRCUMFERENCE = 2 * Math.PI * 38;

export function useDashboard(): UseDashboardResult {
  const { user }                                                         = useAuth();
  const { wallets, loading: wLoading, error: wError, refetch: rWallets } = useWallets(user?.id);
  const { transactions, loading: tLoading, error: tError, refetch: rTxns } = useTransactions(user?.id);
  const { budgets, loading: bLoading, error: bError, refetch: rBudgets }   = useBudgets(user?.id);

  const loading = wLoading || tLoading || bLoading;
  const error   = wError ?? tError ?? bError ?? null;

  const refetch = useCallback(() => {
    rWallets();
    rTxns();
    rBudgets();
  }, [rWallets, rTxns, rBudgets]);

  // ── One-time wallet balance repair ──
  // Fixes corrupted balances from the previous bug where addTransaction
  // didn't update wallet balances. Runs once per session on first load.
  const repairRan = useRef(false);
  useEffect(() => {
    if (!user?.id || loading || repairRan.current) return;
    repairRan.current = true;
    recalculateWalletBalances(user.id)
      .then((results) => {
        const changed = results.filter(r => r.oldBalance !== r.newBalance);
        if (changed.length > 0) {
          console.log('[useDashboard] Repaired wallet balances:', changed);
          rWallets(); // refresh wallet data after repair
        }
      })
      .catch((err) => console.error('[useDashboard] Balance repair failed:', err));
  }, [user?.id, loading, rWallets]);

  // ── Current month boundaries ──
  const { monthStart, monthEnd } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { monthStart: start, monthEnd: end };
  }, []);

  // ── Current-month transactions ──
  const currentMonthTxns = useMemo(
    () => transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      return d >= monthStart && d <= monthEnd;
    }),
    [transactions, monthStart, monthEnd]
  );

  // ── Financial Derived Values (current month) ──
  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  );

  const totalIncome = useMemo(
    () => currentMonthTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    [currentMonthTxns]
  );

  const totalExpense = useMemo(
    () => currentMonthTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    [currentMonthTxns]
  );

  const netCashFlow = totalIncome - totalExpense;

  // ── Spending Breakdown (current month expenses only) ──
  const spendingByCategory = useMemo(
    () => currentMonthTxns
      .filter((t) => t.type === 'expense')
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
        return acc;
      }, {}),
    [currentMonthTxns]
  );

  // ── Donut Segments ──
  const { donutSegments, totalSpending } = useMemo(() => {
    const entries = Object.entries(spendingByCategory)
      .sort(([, a], [, b]) => b - a);

    const total = entries.reduce((s, [, v]) => s + v, 0);

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
              color:      categoryColors[cat] ?? '#71717A',
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

  // ── Recent Transactions — last 5 across all time ──
  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
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
