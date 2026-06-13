'use client';

// ═══════════════════════════════════════════════════════════════════
// Goals — matches the design prototype (page_goals.jsx):
// page head + pill-primary add button, an overall-progress summary
// card (ring + totals + goal counts), then the goal card grid.
// Data flows through useGoals untouched; saved amounts come from
// each goal's linked wallet balance, same as GoalCard.
// ═══════════════════════════════════════════════════════════════════

import { useMemo, useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useGoals } from '@/hooks/useGoals';
import GoalGrid from '@/components/goals/GoalGrid';
import GoalModal from '@/components/goals/GoalModal';
import Ring from '@/components/ui/Ring';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals, loading, addGoal } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // ── Overall progress — saved = linked wallet balance (same as GoalCard) ──
  const summary = useMemo(() => {
    const totalSaved = goals.reduce((s, g) => s + (g.wallet?.balance || 0), 0);
    const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
    const overall = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    const done = goals.filter(
      (g) => g.target_amount > 0 && (g.wallet?.balance || 0) / g.target_amount >= 1
    ).length;
    return { totalSaved, totalTarget, overall, done };
  }, [goals]);

  // ── Stagger reveal for page sections ──
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const sections = gsap.utils.toArray<HTMLElement>('.goals-section', pageRef.current);
      if (sections.length === 0) return;
      gsap.fromTo(sections,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1, delay: 0.05 }
      );
    },
    { scope: pageRef, dependencies: [loading] }
  );

  if (!user && !loading) return null;

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="cyber-skeleton h-16 w-1/3 rounded-2xl" />
        <div className="cyber-skeleton h-32 rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="cyber-skeleton h-72 rounded-3xl" />
          <div className="cyber-skeleton h-72 rounded-3xl" />
          <div className="cyber-skeleton h-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col gap-4">
      {/* ── Page head ── */}
      <div className="goals-section mb-1 mt-1.5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.025em] text-(--text) lg:text-[30px]">
            เป้าหมายออมเงิน
          </h1>
          <p className="mt-1 text-[14.5px] text-(--text-2)">ออมทีละนิด สู่เป้าหมายที่ฝันไว้</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="pill pill-primary press tap shrink-0"
        >
          <Plus />
          เพิ่มเป้าหมาย
        </button>
      </div>

      {/* ── Overall progress summary ── */}
      {goals.length > 0 && (
        <div className="goals-section rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-[18px]">
              <Ring pct={summary.overall}>
                <span className="tnum text-lg font-bold tracking-[-0.01em] text-(--text)">
                  {summary.overall}%
                </span>
              </Ring>
              <div>
                <p className="eyebrow">ความคืบหน้ารวม</p>
                <p className="tnum mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] text-(--text)">
                  {formatCurrency(summary.totalSaved)}
                </p>
                <p className="tnum mt-1 text-[13px] text-(--text-3)">
                  เป้าหมาย {formatCurrency(summary.totalTarget)}
                </p>
              </div>
            </div>
            <div className="flex gap-[26px]">
              <div className="text-center">
                <p className="tnum text-2xl font-bold text-(--text)">{goals.length}</p>
                <p className="text-xs text-(--text-3)">เป้าหมาย</p>
              </div>
              <div className="text-center">
                <p className="tnum text-2xl font-bold text-(--gold)">{summary.done}</p>
                <p className="text-xs text-(--text-3)">สำเร็จ</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Goal cards ── */}
      <div className="goals-section">
        <GoalGrid goals={goals} />
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
