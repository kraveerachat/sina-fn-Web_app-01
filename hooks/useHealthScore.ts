'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface UseHealthScoreResult {
  healthScore: number;
  loading: boolean;
}

/**
 * Fetches the user's financial health_score from the profiles table.
 * Returns 50 (neutral) as default when no score is set.
 */
export function useHealthScore(userId: string | null | undefined): UseHealthScoreResult {
  const [healthScore, setHealthScore] = useState(50);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('health_score')
        .eq('id', userId)
        .single();

      if (!error && data?.health_score != null) {
        setHealthScore(data.health_score);
      }
    } catch {
      // Fallback to default
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { healthScore, loading };
}
