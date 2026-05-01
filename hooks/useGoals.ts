'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Goal } from '@/types';
import { getGoals, createGoal, deleteGoal, uploadGoalImage } from '@/lib/supabase/queries';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function useGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getGoals(user.id);
      setGoals(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      toast('Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchGoals();

    const handleMutate = () => fetchGoals();
    window.addEventListener('app_mutate', handleMutate);
    return () => window.removeEventListener('app_mutate', handleMutate);
  }, [fetchGoals]);

  const addGoal = async (
    goalParams: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'wallet' | 'linked_wallet_id'>,
    imageBlob: Blob | null = null
  ) => {
    if (!user) return null;
    try {
      let finalImageUrl = goalParams.image_url;

      // If an image blob was provided, upload it first
      if (imageBlob) {
        finalImageUrl = await uploadGoalImage(imageBlob, user.id);
      }

      const newGoal = await createGoal({ ...goalParams, image_url: finalImageUrl }, user.id);
      setGoals(prev => [...prev, newGoal]);
      toast('Goal created successfully!', 'success');
      return newGoal;
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : String(err), 'error');
      console.error(err);
      throw err;
    }
  };

  const removeGoal = async (id: string) => {
    try {
      await deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      toast('Goal removed', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : String(err), 'error');
      console.error(err);
      throw err;
    }
  };

  return { goals, loading, error, addGoal, removeGoal, refetch: fetchGoals };
}
