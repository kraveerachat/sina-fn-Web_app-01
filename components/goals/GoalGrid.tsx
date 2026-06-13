'use client';

// ═══════════════════════════════════════════════════════════════════
// GoalGrid — savings goal cards on clean surfaces
//
// Image header, name + days-left chip, saved/target figures, and a
// solid progress bar (blue in progress, gold when complete). Cards
// fade up on scroll; base state stays visible.
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
import type { Goal } from '@/types';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

interface GoalGridProps {
  goals: Goal[];
  columns?: 'auto' | 1;
}

function GoalCard({ goal }: { goal: Goal }) {
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

  return (
    <div className="goal-card">
      <div
        className={`
          press tap group relative flex flex-col overflow-hidden rounded-3xl
          border bg-(--surface) shadow-(--shadow)
          transition-shadow duration-300 hover:shadow-(--shadow-lg)
          ${isComplete ? 'border-(--gold)/40' : 'border-(--border)'}
        `}
      >
        {/* Image header */}
        <div className="relative h-40 w-full overflow-hidden bg-(--surface-2)">
          {goal.image_url ? (
            <Image
              src={goal.image_url}
              alt={goal.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon size={32} className="text-(--text-3)/40" />
            </div>
          )}

          {/* Completion badge */}
          {isComplete && (
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-(--gold) px-2.5 py-1 shadow-(--shadow-sm)">
              <Trophy size={11} className="text-white" />
              <span className="text-[11px] font-semibold text-white">
                สำเร็จ
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-[17px] font-semibold tracking-[-0.01em] text-(--text)">
              {goal.name}
            </h3>
            {daysLeft !== null && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-(--border-2) bg-(--surface-2) px-2.5 py-1">
                <Calendar size={11} className="text-(--text-3)" />
                <span className="tnum text-[11px] font-medium text-(--text-2)">
                  เหลือ {daysLeft} วัน
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="mb-0.5 text-[11px] text-(--text-3)">ออมแล้ว</p>
                <p
                  className={`tnum text-base font-semibold ${
                    isComplete ? 'text-(--gold)' : 'text-(--blue)'
                  }`}
                >
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="text-right">
                <p className="mb-0.5 text-[11px] text-(--text-3)">เป้าหมาย</p>
                <p className="tnum text-sm font-medium text-(--text-2)">
                  {formatCurrency(target)}
                </p>
              </div>
            </div>

            {/* Progress bar — solid fill, no neon */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-(--surface-3)">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: isComplete ? 'var(--gold)' : 'var(--blue)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1] }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-(--text-3)">
              <span
                className={`tnum font-medium ${isComplete ? 'text-(--gold)' : ''}`}
              >
                {progress.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1">
                <WalletIcon size={11} />
                ซิงค์กับกระเป๋าอัตโนมัติ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoalGrid({ goals, columns = 'auto' }: GoalGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Gentle fade-up on scroll; skipped (cards stay visible) under reduced motion
  useGSAP(
    () => {
      if (!gridRef.current || goals.length === 0) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const cards = gsap.utils.toArray<HTMLElement>('.goal-card', gridRef.current);
      if (cards.length === 0) return;
      gsap.fromTo(
        cards,
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: gridRef.current, start: 'top 92%', once: true },
        }
      );
    },
    { scope: gridRef, dependencies: [goals] }
  );

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-(--border) bg-(--surface) p-12 text-center shadow-(--shadow)">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--blue-soft)">
          <Target size={28} className="text-(--blue)" />
        </div>
        <p className="text-base font-semibold text-(--text)">ยังไม่มีเป้าหมายออมเงิน</p>
        <p className="mt-1 text-sm text-(--text-3)">
          ตั้งเป้าหมายแรก แล้วเริ่มออมไปด้วยกัน
        </p>
      </div>
    );
  }

  const gridClass =
    columns === 1
      ? 'grid grid-cols-1 gap-4'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <div ref={gridRef} className={gridClass}>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </div>
  );
}
