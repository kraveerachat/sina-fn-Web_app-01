'use client';

// ═══════════════════════════════════════════════════════════════════
// SpendingBreakdown — Animated Donut + Interactive Legend
//
// Phase 6 "Analytics Matrix":
//  ✓ Framer Motion animated stroke-dasharray draw on mount
//  ✓ Hover legend → corresponding slice glows + scales
//  ✓ Glassmorphism card, no solid backgrounds
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import type { DonutSegment } from '@/hooks/useDashboard';

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  if (totalSpending <= 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] glass-card p-8 flex flex-col items-center justify-center min-h-[260px]">
        <span className="text-3xl mb-3">📊</span>
        <p className="text-sm text-(--cyber-text-secondary)">No spending this month</p>
        <p className="text-xs text-(--cyber-text-muted) mt-1">Your category breakdown will appear here</p>
      </div>
    );
  }

  const sortedEntries = Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a);

  // Recalculate segments for r=40
  const segments = donutSegments.map((seg) => ({
    ...seg,
    dashLength: (seg.value / totalSpending) * CIRCUMFERENCE,
  }));

  // Recompute offsets
  const computedSegments = segments.reduce<{ items: (typeof segments[0] & { dashOffset: number })[]; offset: number }>(
    (acc, seg) => {
      acc.items.push({ ...seg, dashOffset: -acc.offset });
      acc.offset += seg.dashLength;
      return acc;
    },
    { items: [], offset: 0 }
  ).items;

  return (
    <div className="rounded-2xl border border-white/[0.06] glass-card p-6 min-h-[260px]">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        {/* ── Donut Chart ── */}
        <div className="relative w-40 h-40 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              stroke="var(--cyber-surface-alt)"
              strokeWidth="8"
            />
            {/* Data segments — animated stroke draw + interactive hover */}
            {computedSegments.map((seg, i) => {
              const isHovered = hoveredCategory === seg.category;
              return (
                <motion.circle
                  key={seg.category}
                  cx="50" cy="50" r={RADIUS}
                  fill="none"
                  stroke={seg.color}
                  strokeLinecap="round"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 10px ${seg.color})` : 'none',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                  initial={{
                    strokeDasharray: `0 ${CIRCUMFERENCE}`,
                    strokeDashoffset: 0,
                    strokeWidth: 8,
                  }}
                  animate={{
                    strokeDasharray: `${seg.dashLength} ${CIRCUMFERENCE - seg.dashLength}`,
                    strokeDashoffset: seg.dashOffset,
                    strokeWidth: isHovered ? 11 : 8,
                  }}
                  transition={{
                    strokeDasharray: { duration: 0.9, delay: i * 0.1, ease: 'easeOut' },
                    strokeDashoffset: { duration: 0.9, delay: i * 0.1, ease: 'easeOut' },
                    strokeWidth: { duration: 0.2 },
                  }}
                  onMouseEnter={() => setHoveredCategory(seg.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })}
          </svg>

          {/* Center text — pointer-events-none so SVG slices remain hoverable */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] text-(--cyber-text-muted) uppercase tracking-widest">
              Total
            </span>
            <span className="text-xl font-bold font-mono text-(--cyber-text) mt-0.5">
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
            const isHovered = hoveredCategory === cat;

            return (
              <div
                key={cat}
                className={`flex items-center justify-between py-2.5 transition-all duration-200 rounded-lg px-2 -mx-2 cursor-pointer ${
                  isLast ? '' : 'border-b border-white/5'
                } ${isHovered ? 'bg-white/[0.04]' : ''}`}
                onMouseEnter={() => setHoveredCategory(cat)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {/* Left: dot + name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-shadow duration-200"
                    style={{
                      backgroundColor: color,
                      boxShadow: isHovered ? `0 0 8px ${color}` : 'none',
                    }}
                  />
                  <span className={`text-sm font-medium truncate transition-colors duration-200 ${
                    isHovered ? 'text-(--cyber-text)' : 'text-(--cyber-text)'
                  }`}>
                    {cat}
                  </span>
                </div>

                {/* Right: percent + amount */}
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-(--cyber-text-muted) w-8 text-right">
                    {pct}%
                  </span>
                  <span className={`text-sm font-semibold font-mono w-24 text-right transition-colors duration-200 ${
                    isHovered ? 'text-(--cyber-text)' : 'text-(--cyber-text)'
                  }`}>
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
