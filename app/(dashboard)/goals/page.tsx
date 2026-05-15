'use client';

import { useState, useRef } from 'react';
import { Plus, Target, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useGoals } from '@/hooks/useGoals';
import GoalGrid from '@/components/goals/GoalGrid';
import GoalModal from '@/components/goals/GoalModal';
import { useAuth } from '@/hooks/useAuth';

gsap.registerPlugin(ScrollTrigger);

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals, loading, addGoal } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // ── GSAP stagger reveal for page sections ──
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      const sections = gsap.utils.toArray<HTMLElement>('.goals-section', pageRef.current);
      if (sections.length === 0) return;
      gsap.set(sections, { y: 25, opacity: 0 });
      gsap.to(sections, {
        y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1, delay: 0.05,
      });
    },
    { scope: pageRef, dependencies: [loading] }
  );

  if (!user && !loading) return null;

  return (
    <div ref={pageRef} className="flex flex-col space-y-6 pb-24 lg:pb-8">
      {/* Page heading & Add button */}
      <div className="goals-section flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-0.5 bg-[var(--cyber-cyan)]" />
          <h1 className="text-2xl font-bold tracking-[4px] text-[var(--cyber-text)] uppercase font-mono flex items-center gap-2">
            <Target size={24} className="text-[var(--cyber-cyan)]" />
            GOALS
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--cyber-cyan)]/10 text-[var(--cyber-cyan)] border border-[var(--cyber-cyan)]/40 hover:bg-[var(--cyber-cyan)] hover:text-black transition-all font-mono text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.15)]"
        >
          <Plus size={16} />
          NEW GOAL
        </button>
      </div>

      {/* Main Grid */}
      <div className="goals-section">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--cyber-cyan)]" />
          </div>
        ) : (
          <GoalGrid goals={goals} />
        )}
      </div>

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
