// ═══════════════════════════════════════════════════════════════════
// hooks/useBudgets.ts — Budget Data Hook
//
// Fetches budgets for a specific month/year via lib/supabase/queries.ts.
// Defaults to the current calendar month.
//
// Usage:
//   const { budgets, loading, error, refetch } = useBudgets(user?.id);
//   // Specific month:
//   const { budgets } = useBudgets(user?.id, { month: 3, year: 2026 });
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BudgetItem } from '@/store/appStore';
import { getBudgets } from '@/lib/supabase/queries';

export interface UseBudgetsResult {
  budgets: BudgetItem[];
  loading: boolean;
  error: string | null;
  /** Current month being displayed (1–12) */
  month: number;
  /** Current year being displayed */
  year: number;
  refetch: () => Promise<void>;
}

export function useBudgets(
  userId: string | null | undefined,
  options?: { month?: number; year?: number }
): UseBudgetsResult {
  const now   = new Date();
  const month = options?.month ?? now.getMonth() + 1;
  const year  = options?.year  ?? now.getFullYear();

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    if (!userId) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // ── Exclusively use the queries layer — no direct supabase calls ──
      const data = await getBudgets(userId, month, year);
      setBudgets(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load budgets';
      setError(message);
      setBudgets([]);
      console.error('[useBudgets]', err);
    } finally {
      setLoading(false);
    }
  }, [userId, month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    loading,
    error,
    month,
    year,
    refetch: fetchBudgets,
  };
}
