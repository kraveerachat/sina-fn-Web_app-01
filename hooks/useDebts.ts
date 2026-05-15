'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Debt } from '@/types';
import { getDebts } from '@/lib/supabase/queries';

export interface UseDebtsResult {
  debts: Debt[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDebts(userId: string | null | undefined): UseDebtsResult {
  const [debts, setDebts]     = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchDebts = useCallback(async () => {
    if (!userId) {
      setDebts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDebts(userId);
      setDebts(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load debts';
      setError(message);
      setDebts([]);
      console.error('[useDebts]', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDebts();

    const handleMutate = () => fetchDebts();
    window.addEventListener('app_mutate', handleMutate);
    return () => window.removeEventListener('app_mutate', handleMutate);
  }, [fetchDebts]);

  return { debts, loading, error, refetch: fetchDebts };
}
