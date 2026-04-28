'use client';

import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import type { DonutSegment } from '@/hooks/useDashboard';

const CIRCUMFERENCE = 2 * Math.PI * 40;

interface SpendingBreakdownProps {
  donutSegments: DonutSegment[];
  spendingByCategory: Record<string, number>;
  totalSpending: number;
}

export default function SpendingBreakdown({
  donutSegments,
  spendingByCategory,
  totalSpending,
}: SpendingBreakdownProps) {
  if (totalSpending <= 0) {
    return (
      <div className="rounded-2xl border border-[var(--cyber-border)] bg-[var(--cyber-surface)] p-8 flex flex-col items-center justify-center min-h-[260px]">
        <span className="text-3xl mb-3">📊</span>
        <p className="text-sm text-[var(--cyber-text-secondary)]">No spending this month</p>
        <p className="text-xs text-[var(--cyber-text-muted)] mt-1">Your category breakdown will appear here</p>
      </div>
    );
  }

  const sortedEntries = Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a);

  // Recalculate segments for the slightly larger radius (r=40)
  const segments = donutSegments.map((seg) => ({
    ...seg,
    dashLength: (seg.value / totalSpending) * CIRCUMFERENCE,
  }));
  // Recompute offsets
  const computedSegments = segments.reduce<{ items: (typeof segments[0] & { dashOffset: number })[], offset: number }>(
    (acc, seg) => {
      acc.items.push({ ...seg, dashOffset: -acc.offset });
      acc.offset += seg.dashLength;
      return acc;
    },
    { items: [], offset: 0 }
  ).items;

  return (
    <div className="rounded-2xl border border-[var(--cyber-border)] bg-[var(--cyber-surface)] p-6 min-h-[260px]">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        {/* ── Donut Chart ── */}
        <div className="relative w-40 h-40 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="var(--cyber-surface-alt)"
              strokeWidth="8"
            />
            {/* Data segments */}
            {computedSegments.map((seg, i) => (
              <motion.circle
                key={seg.category}
                cx="50" cy="50" r="40"
                fill="none"
                stroke={seg.color}
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}` }}
                animate={{
                  strokeDasharray: `${seg.dashLength} ${CIRCUMFERENCE - seg.dashLength}`,
                  strokeDashoffset: seg.dashOffset,
                }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
              />
            ))}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] text-[var(--cyber-text-muted)] uppercase tracking-widest">
              Total
            </span>
            <span className="text-xl font-bold font-mono text-[var(--cyber-text)] mt-0.5">
              {formatCurrency(totalSpending)}
            </span>
          </div>
        </div>

        {/* ── Legend List ── */}
        <div className="w-full md:w-1/2 flex flex-col">
          {sortedEntries.map(([cat, val], i) => {
            const pct = Math.round((val / totalSpending) * 100);
            const color = computedSegments.find((s) => s.category === cat)?.color ?? '#71717A';
            const isLast = i === sortedEntries.length - 1;

            return (
              <div
                key={cat}
                className={`flex items-center justify-between py-2.5 ${
                  isLast ? '' : 'border-b border-white/5'
                }`}
              >
                {/* Left: dot + name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium text-[var(--cyber-text)] truncate">
                    {cat}
                  </span>
                </div>

                {/* Right: percent + amount */}
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-[var(--cyber-text-muted)] w-8 text-right">
                    {pct}%
                  </span>
                  <span className="text-sm font-semibold font-mono text-[var(--cyber-text)] w-24 text-right">
                    {formatCurrency(val)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
