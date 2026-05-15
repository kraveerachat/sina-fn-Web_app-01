'use client';

// ═══════════════════════════════════════════════════════════════════
// GoalGrid — Wealth Galaxy 3D Savings Goal Cards
//
// Utopia Tokyo Phase 5:
//  ✓ Parallax image reveal with 3D holographic tilt
//  ✓ Liquid neon progress bar with flowing gradient
//  ✓ Premium glassmorphism (bg-black/20 backdrop-blur)
//  ✓ Milestone glow for 100% completed goals
// ═══════════════════════════════════════════════════════════════════

import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Image as ImageIcon,
  Calendar,
  Wallet as WalletIcon,
  Trophy,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { formatCurrency } from '@/lib/utils';
import { useHolographicTilt } from '@/hooks/useHolographicTilt';
import type { Goal } from '@/types';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

interface GoalGridProps {
  goals: Goal[];
  columns?: 'auto' | 1;
}

/** Individual Goal Card with 3D tilt + parallax image */
function GoalCard({ goal, index }: { goal: Goal; index: number }) {
  const balance = goal.wallet?.balance || 0;
  const target = goal.target_amount;
  const rawProgress = (balance / target) * 100;
  const progress = Math.min(Math.max(rawProgress, 0), 100);
  const isComplete = progress >= 100;

  const getDaysLeft = (targetDate: string | null) => {
    if (!targetDate) return null;
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  const daysLeft = getDaysLeft(goal.target_date);

  const { ref, cardStyle, sheenStyle, glowStyle, onMouseMove, onMouseLeave } =
    useHolographicTilt<HTMLDivElement>({
      maxTilt: 6,
      speed: 0.12,
      sheenColor: isComplete
        ? 'rgba(251, 191, 36, 0.08)'
        : 'rgba(96, 165, 250, 0.08)',
      glowColor: isComplete
        ? 'rgba(251, 191, 36, 0.20)'
        : 'rgba(96, 165, 250, 0.15)',
    });

  return (
    <div
      className="goal-card transition-transform duration-500 hover:scale-[1.02]"
    >
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={cardStyle}
        className={`
          group relative flex flex-col overflow-hidden rounded-2xl
          bg-black/20 backdrop-blur-xl
          border border-white/[0.08]
          hover:border-white/[0.15] transition-colors
          ${isComplete ? 'milestone-glow' : ''}
        `}
      >
        {/* Holographic overlays */}
        <div style={sheenStyle} />
        <div style={glowStyle} />

        {/* Image Section — parallax zoom on hover */}
        <div className="h-40 w-full relative bg-black/30 border-b border-white/[0.06] overflow-hidden">
          {goal.image_url ? (
            <Image
              src={goal.image_url}
              alt={goal.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon
                size={32}
                className="text-white/[0.08]"
              />
            </div>
          )}
          {/* Overlay gradient — fades into glass card */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

          {/* Completion badge overlay */}
          {isComplete && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm border border-[var(--cyber-amber)]/30">
              <Trophy size={10} className="text-[var(--cyber-amber)]" />
              <span className="text-[9px] font-mono font-bold text-[var(--cyber-amber)] uppercase tracking-wider">
                Complete
              </span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-5 flex-1 flex flex-col relative z-[1]">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-[var(--cyber-text)] line-clamp-1">
              {goal.name}
            </h3>
            {daysLeft !== null && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.04] rounded-md border border-white/[0.08] shrink-0">
                <Calendar
                  size={12}
                  className="text-[var(--cyber-text-muted)]"
                />
                <span className="text-[10px] font-mono font-medium text-[var(--cyber-text-secondary)]">
                  {daysLeft}d left
                </span>
              </div>
            )}
          </div>

          {/* Progress Tracker */}
          <div className="mt-auto space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-mono text-[var(--cyber-text-muted)] uppercase tracking-wider mb-0.5">
                  Saved
                </p>
                <p
                  className={`text-base font-bold font-mono ${
                    isComplete
                      ? 'text-[var(--cyber-amber)]'
                      : 'text-[var(--cyber-cyan)]'
                  }`}
                >
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-[var(--cyber-text-muted)] uppercase tracking-wider mb-0.5">
                  Target
                </p>
                <p className="text-sm font-bold font-mono text-[var(--cyber-text-secondary)]">
                  {formatCurrency(target)}
                </p>
              </div>
            </div>

            {/* ── Liquid Neon Progress Bar ── */}
            <div className="h-2.5 w-full bg-black/30 rounded-full overflow-hidden border border-white/[0.06]">
              <motion.div
                className={`h-full rounded-full relative ${
                  isComplete ? 'liquid-neon-gold' : 'liquid-neon-cyan'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-[var(--cyber-text-muted)]">
              <span
                className={
                  isComplete ? 'text-[var(--cyber-amber)]' : ''
                }
              >
                {progress.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1">
                <WalletIcon size={10} />
                Auto-synced
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoalGrid({
  goals,
  columns = 'auto',
}: GoalGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // ── GSAP ScrollTrigger for goal cards ──
  useGSAP(
    () => {
      if (!gridRef.current || goals.length === 0) return;
      const cards = gsap.utils.toArray<HTMLElement>('.goal-card', gridRef.current);
      if (cards.length === 0) return;
      gsap.set(cards, { y: 30, opacity: 0, scale: 0.96 });
      gsap.to(cards, {
        y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: gridRef.current, start: 'top 92%', once: true },
      });
    },
    { scope: gridRef, dependencies: [goals] }
  );

  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-black/20 backdrop-blur-xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
          <Target size={28} className="text-[var(--cyber-cyan)]" />
        </div>
        <p className="text-base text-[var(--cyber-text)] font-bold">
          No Saving Goals
        </p>
        <p className="text-sm text-[var(--cyber-text-muted)] mt-1">
          Set up a target to start saving towards what you want.
        </p>
      </div>
    );
  }

  const gridClass =
    columns === 1
      ? 'grid grid-cols-1 gap-5'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5';

  return (
    <div ref={gridRef} className={gridClass}>
      {goals.map((goal, i) => (
        <GoalCard key={goal.id} goal={goal} index={i} />
      ))}
    </div>
  );
}
