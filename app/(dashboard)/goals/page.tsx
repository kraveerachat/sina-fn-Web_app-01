'use client';

// ═══════════════════════════════════════════════════════════════════
// Savings Goals & Wishlists
// Handles creating financial goals paired with auto-synced "savings" wallets.
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Plus, Target, Loader2 } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import GoalGrid from '@/components/goals/GoalGrid';
import GoalModal from '@/components/goals/GoalModal';
import { useAuth } from '@/hooks/useAuth';

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals, loading, addGoal } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group goals into "completed" and "in-progress" conceptually if we wanted to
  // For now, minimal elegant list.

  if (!user && !loading) return null;

  return (
    <div className="flex flex-col space-y-6 pb-24 lg:pb-8">
      {/* Page heading & Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-0.5 bg-[var(--cyber-cyan)]" />
          <h1 className="text-2xl font-bold tracking-[4px] text-[var(--cyber-text)] uppercase font-mono flex items-center gap-2">
            <Target size={24} className="text-[var(--cyber-cyan)]" />
            GOALS
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="
            flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
            bg-[var(--cyber-cyan)]/10 text-[var(--cyber-cyan)] border border-[var(--cyber-cyan)]/40
            hover:bg-[var(--cyber-cyan)] hover:text-black transition-all font-mono text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.15)]
          "
        >
          <Plus size={16} />
          NEW GOAL
        </button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--cyber-cyan)]" />
        </div>
      ) : (
        <GoalGrid goals={goals} />
      )}

      {/* Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (goal, blob) => {
          await addGoal(goal, blob || null);
        }}
      />
    </div>
  );
}
