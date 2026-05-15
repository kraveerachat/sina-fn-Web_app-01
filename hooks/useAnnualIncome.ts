'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAnnualIncome } from '@/lib/supabase/queries';

export interface UseAnnualIncomeResult {
  annualIncome: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAnnualIncome(
  userId: string | null | undefined,
  year: number
): UseAnnualIncomeResult {
  const [annualIncome, setAnnualIncome] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetchIncome = useCallback(async () => {
    if (!userId) {
      setAnnualIncome(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const total = await getAnnualIncome(userId, year);
      setAnnualIncome(total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load income';
      setError(message);
      setAnnualIncome(0);
      console.error('[useAnnualIncome]', err);
    } finally {
      setLoading(false);
    }
  }, [userId, year]);

  useEffect(() => {
    fetchIncome();

    const handleMutate = () => fetchIncome();
    window.addEventListener('app_mutate', handleMutate);
    return () => window.removeEventListener('app_mutate', handleMutate);
  }, [fetchIncome]);

  return { annualIncome, loading, error, refetch: fetchIncome };
}
