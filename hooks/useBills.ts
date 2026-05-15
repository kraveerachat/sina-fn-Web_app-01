'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MonthlyBill } from '@/types';
import { getMonthlyBills } from '@/lib/supabase/queries';

export interface UseBillsResult {
  bills: MonthlyBill[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBills(userId: string | null | undefined): UseBillsResult {
  const [bills, setBills]     = useState<MonthlyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    if (!userId) {
      setBills([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getMonthlyBills(userId);
      setBills(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bills';
      setError(message);
      setBills([]);
      console.error('[useBills]', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBills();

    const handleMutate = () => fetchBills();
    window.addEventListener('app_mutate', handleMutate);
    return () => window.removeEventListener('app_mutate', handleMutate);
  }, [fetchBills]);

  return { bills, loading, error, refetch: fetchBills };
}
