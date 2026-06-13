'use client';

// ═══════════════════════════════════════════════════════════════════
// GoalLines — compact savings-goal rows for the dashboard bento
//
// Name + saved/target on a baseline, thin progress track below.
// The full image cards live on /goals; the dashboard stays dense.
// ═══════════════════════════════════════════════════════════════════

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Goal } from '@/types';

interface GoalLinesProps {
  goals: Goal[];
}

const GOAL_COLORS = ['var(--gold)', 'var(--blue)', 'var(--green)'];

export default function GoalLines({ goals }: GoalLinesProps) {
  const reduced = useReducedMotion();

  return (
    <div className="lift-card flex h-full flex-col rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-(--text)">
          Savings Goals
        </span>
        <Link
          href="/goals"
          className="text-[13px] font-medium text-(--blue) hover:opacity-70 transition-opacity"
        >
          View all
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-(--blue-soft)">
            <Target size={20} className="text-(--blue)" />
          </span>
          <p className="text-sm text-(--text-2)">ยังไม่มีเป้าหมายออมเงิน</p>
          <p className="mt-0.5 text-xs text-(--text-3)">
            ตั้งเป้าหมายแรกได้ที่หน้า Goals
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {goals.map((goal, i) => {
            const saved = goal.wallet?.balance || 0;
            const pct = Math.min(100, Math.max(0, (saved / goal.target_amount) * 100));
            const color = GOAL_COLORS[i % GOAL_COLORS.length];
            const isLast = i === goals.length - 1;

            return (
              <div
                key={goal.id}
                className={`py-3.5 ${isLast ? 'pb-1' : 'border-b border-(--border-2)'}`}
              >
                <div className="mb-2.5 flex items-baseline justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-(--text)">
                    {goal.name}
                  </span>
                  <span className="tnum shrink-0 text-[13px] text-(--text-2)">
                    {formatCurrency(saved)} / {formatCurrency(goal.target_amount)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-(--surface-3)">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={reduced ? false : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: [0.2, 0.7, 0.2, 1] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
