// ═══════════════════════════════════════════════════════════════════
// hooks/useWallets.ts — Wallet Data Hook
//
// Fetches wallets exclusively via lib/supabase/queries.ts.
// Only triggers when userId is available.
// Manages its own loading and error state.
//
// Usage:
//   const { wallets, loading, error, refetch } = useWallets(user?.id);
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Wallet } from '@/types';
import { getWallets } from '@/lib/supabase/queries';

export interface UseWalletsResult {
  wallets: Wallet[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWallets(userId: string | null | undefined): UseWalletsResult {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    // Do not fetch without a valid userId
    if (!userId) {
      setWallets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // ── Exclusively use the queries layer — no direct supabase calls ──
      const data = await getWallets(userId);
      setWallets(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wallets';
      setError(message);
      setWallets([]);
      console.error('[useWallets]', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Re-fetch whenever userId changes (login / logout)
  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  return {
    wallets,
    loading,
    error,
    refetch: fetchWallets,
  };
}
