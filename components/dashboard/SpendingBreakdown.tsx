'use client';

// ═══════════════════════════════════════════════════════════════════
// SpendingBreakdown — donut + legend on a clean surface
//
// The donut draws on; hovering a legend row thickens (not glows)
// the matching slice. Quiet hairline dividers between rows.
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
  /** Stack donut above legend — for narrow bento cells */
  vertical?: boolean;
}

export default function SpendingBreakdown({
  donutSegments,
  spendingByCategory,
  totalSpending,
  vertical = false,
}: SpendingBreakdownProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  if (totalSpending <= 0) {
    return (
      <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
        <div className="relative mb-3 flex h-24 w-24 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--surface-3)"
              strokeWidth="5"
              strokeDasharray="4 4"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-wider text-(--text-3)">
            0.00
          </div>
        </div>
        <p className="text-sm font-medium text-(--text-2)">ยังไม่มีรายจ่ายในเดือนนี้</p>
        <p className="mt-0.5 text-xs text-(--text-3)">
          สัดส่วนรายจ่ายตามหมวดหมู่จะแสดงขึ้นที่นี่
        </p>
      </div>
    );
  }

  const sortedEntries = Object.entries(spendingByCategory).sort(
    ([, a], [, b]) => b - a
  );

  const segments = donutSegments.map((seg) => ({
    ...seg,
    dashLength: (seg.value / totalSpending) * CIRCUMFERENCE,
  }));

  const computedSegments = segments.reduce<{
    items: (typeof segments[0] & { dashOffset: number })[];
    offset: number;
  }>(
    (acc, seg) => {
      acc.items.push({ ...seg, dashOffset: -acc.offset });
      acc.offset += seg.dashLength;
      return acc;
    },
    { items: [], offset: 0 }
  ).items;

  return (
    <div className="h-full min-h-[260px] rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
      {vertical && (
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-(--text)">
            Spending
          </span>
          <span className="text-[12.5px] text-(--text-3)">เดือนนี้</span>
        </div>
      )}
      <div
        className={
          vertical
            ? 'flex flex-col items-center gap-5'
            : 'flex flex-col items-center justify-center gap-8 md:flex-row md:gap-12'
        }
      >
        {/* ── Donut ── */}
        <div className="relative h-40 w-40 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50" cy="50" r={RADIUS}
              fill="none"
              stroke="var(--surface-3)"
              strokeWidth="8"
            />
            {computedSegments.map((seg, i) => {
              const isHovered = hoveredCategory === seg.category;
              return (
                <motion.circle
                  key={seg.category}
                  cx="50" cy="50" r={RADIUS}
                  fill="none"
                  stroke={seg.color}
                  strokeLinecap="round"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
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

          {/* Center total */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] tracking-[0.04em] text-(--text-3)">
              Total
            </span>
            <span className="tnum mt-0.5 text-xl font-semibold text-(--text)">
              {formatCurrency(totalSpending)}
            </span>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className={vertical ? 'flex w-full flex-col' : 'flex w-full flex-col md:w-1/2'}>
          {sortedEntries.map(([cat, val], i) => {
            const pct = Math.round((val / totalSpending) * 100);
            const color =
              computedSegments.find((s) => s.category === cat)?.color ??
              'var(--text-3)';
            const isLast = i === sortedEntries.length - 1;
            const isHovered = hoveredCategory === cat;

            return (
              <div
                key={cat}
                className={`-mx-2 flex cursor-pointer items-center justify-between rounded-xl px-2 py-2.5 transition-colors duration-200 ${
                  isLast ? '' : 'border-b border-(--border-2)'
                } ${isHovered ? 'bg-(--surface-2)' : ''}`}
                onMouseEnter={() => setHoveredCategory(cat)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-sm font-medium text-(--text)">
                    {cat}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <span className="w-8 text-right text-xs text-(--text-3)">
                    {pct}%
                  </span>
                  <span className="tnum w-24 text-right text-sm font-semibold text-(--text)">
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
