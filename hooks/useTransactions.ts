// ═══════════════════════════════════════════════════════════════════
// hooks/useTransactions.ts — Transaction Data Hook
//
// Fetches transactions exclusively via lib/supabase/queries.ts.
// Supports optional date filtering for month/year scoping.
//
// Usage:
//   const { transactions, loading, error, refetch } = useTransactions(user?.id);
//   // With month filter:
//   const { transactions } = useTransactions(user?.id, { month: 4, year: 2026 });
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppTransaction } from '@/store/appStore';
import { getTransactions } from '@/lib/supabase/queries';

export interface TransactionFilter {
  /** Filter to a specific month (1–12). Requires year. */
  month?: number;
  /** Filter to a specific year (e.g. 2026). Requires month. */
  year?: number;
  /** Maximum number of transactions to return (default: all) */
  limit?: number;
}

export interface UseTransactionsResult {
  transactions: AppTransaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTransactions(
  userId: string | null | undefined,
  filter?: TransactionFilter
): UseTransactionsResult {
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Stable filter ref values for dependency tracking
  const filterMonth = filter?.month;
  const filterYear  = filter?.year;
  const filterLimit = filter?.limit;

  const fetchTransactions = useCallback(async () => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ── Exclusively use the queries layer — no direct supabase calls ──
      let data = await getTransactions(userId);

      // ── Apply client-side filters if provided ──
      if (filterMonth !== undefined && filterYear !== undefined) {
        data = data.filter((t) => {
          const date = new Date(t.transaction_date);
          return (
            date.getMonth() + 1 === filterMonth &&
            date.getFullYear() === filterYear
          );
        });
      }

      if (filterLimit !== undefined) {
        data = data.slice(0, filterLimit);
      }

      setTransactions(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load transactions';
      setError(message);
      setTransactions([]);
      console.error('[useTransactions]', err);
    } finally {
      setLoading(false);
    }
  }, [userId, filterMonth, filterYear, filterLimit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}
