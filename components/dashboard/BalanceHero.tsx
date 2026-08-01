'use client';

// ═══════════════════════════════════════════════════════════════════
// BalanceHero — blue gradient hero with layered lighting
//
// Total balance counts up; an area chart of the balance trend draws
// on below it with a time-range segmented control. Send / Request
// ride glass pills on the blue. A slow sheen sweeps across for life
// (removed under prefers-reduced-motion).
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BalanceAreaChart } from '@/components/dashboard/charts';

export interface HeroTransaction {
  transaction_date: string;
  type: string;
  amount: number;
}

interface BalanceHeroProps {
  totalBalance: number;
  /** All transactions (any order); used to derive the balance trend */
  transactions?: HeroTransaction[];
  onSend?: () => void;
  onRequest?: () => void;
}

type Range = '1W' | '1M' | '3M' | '1Y' | 'All';
const RANGES: Range[] = ['1W', '1M', '3M', '1Y', 'All'];

/** Signed wallet delta of a transaction (transfers are net zero). */
function txDelta(t: HeroTransaction): number {
  if (t.type === 'income') return t.amount;
  if (t.type === 'expense') return -t.amount;
  return 0;
}

/**
 * Balance trend: walks backward from the current total, subtracting
 * transaction deltas, sampled at evenly spaced points over the range.
 */
function buildSeries(
  transactions: HeroTransaction[],
  totalBalance: number,
  range: Range
): { data: number[]; labels: string[] } {
  const now = Date.now();
  const DAY = 24 * 3600 * 1000;

  let spanMs: number;
  let points: number;
  if (range === '1W') { spanMs = 7 * DAY; points = 8; }
  else if (range === '1M') { spanMs = 30 * DAY; points = 11; }
  else if (range === '3M') { spanMs = 91 * DAY; points = 13; }
  else if (range === '1Y') { spanMs = 365 * DAY; points = 13; }
  else {
    const oldest = transactions.length
      ? Math.min(...transactions.map((t) => new Date(t.transaction_date).getTime()))
      : now - 365 * DAY;
    spanMs = Math.max(30 * DAY, now - oldest);
    points = 13;
  }

  const sampleTimes = Array.from(
    { length: points },
    (_, i) => now - spanMs + (spanMs * i) / (points - 1)
  );

  const data = sampleTimes.map((t) => {
    const deltaAfter = transactions.reduce(
      (sum, tx) =>
        new Date(tx.transaction_date).getTime() > t ? sum + txDelta(tx) : sum,
      0
    );
    return totalBalance - deltaAfter;
  });

  const labels = sampleTimes.map((t) => {
    const d = new Date(t);
    if (range === '1W') return d.toLocaleDateString('en-US', { weekday: 'short' });
    if (range === '1M' || range === '3M')
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    if (range === '1Y') return d.toLocaleDateString('en-US', { month: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  });

  return { data, labels };
}

/** Counts from 0 to value once on mount; renders instantly when motion is reduced. */
function useCountUp(value: number, duration = 1.1) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const done = useRef(false);

  useEffect(() => {
    if (reduced || done.current) {
      setDisplay(value);
      return;
    }
    done.current = true;
    const controls = animate(0, value, {
      duration,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, duration, reduced]);

  return display;
}

export default function BalanceHero({
  totalBalance,
  transactions = [],
  onSend,
  onRequest,
}: BalanceHeroProps) {
  const counted = useCountUp(totalBalance);
  const [range, setRange] = useState<Range>('1Y');

  const { data, labels } = useMemo(
    () => buildSeries(transactions, totalBalance, range),
    [transactions, totalBalance, range]
  );

  // Trend over the selected range, from the series itself
  const trendPct = useMemo(() => {
    if (data.length < 2 || data[0] === 0) return null;
    return ((data[data.length - 1] - data[0]) / Math.abs(data[0])) * 100;
  }, [data]);

  const rangeLabel: Record<Range, string> = {
    '1W': 'สัปดาห์นี้',
    '1M': 'เดือนนี้',
    '3M': 'ไตรมาสนี้',
    '1Y': 'ปีนี้',
    All: 'ทั้งหมด',
  };

  return (
    <div className="hero-blue relative flex h-full flex-col rounded-3xl px-[26px] py-6 shadow-xl transition-all duration-300">
      <div className="sheen" aria-hidden />

      {/* Top band: balance + actions */}
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white/80">ยอดเงินรวม</p>
          <p className="tnum mb-3 mt-1.5 font-sans text-[40px] font-bold leading-[1.04] tracking-tight text-white antialiased lg:text-[50px]">
            {formatCurrency(counted)}
          </p>
          {trendPct !== null && (
            <span className="badge-on-blue inline-flex items-center gap-1.5 rounded-full px-[13px] py-1.5 text-[13px] font-semibold">
              <TrendingUp size={14} />
              {trendPct >= 0 ? '+' : ''}
              {trendPct.toFixed(1)}%
              <span className="ml-0.5 font-medium text-white/80">
                {rangeLabel[range]}
              </span>
            </span>
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onSend}
            className="on-blue-glass press tap flex items-center gap-2 rounded-full px-[18px] py-2.5 text-sm font-medium transition-all duration-300"
          >
            <ArrowUpRight size={16} />
            โอนออก
          </button>
          <button
            onClick={onRequest}
            className="on-blue-glass press tap flex items-center gap-2 rounded-full px-[18px] py-2.5 text-sm font-medium transition-all duration-300"
          >
            <ArrowDownLeft size={16} />
            ขอเงิน
          </button>
        </div>
      </div>

      {/* Balance trend chart */}
      <div className="relative mb-4 mt-1.5 flex-1">
        <BalanceAreaChart data={data} labels={labels} />
      </div>

      {/* Range segmented control */}
      <div className="relative flex w-full rounded-full bg-white/10 p-1 backdrop-blur-md border border-white/10">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`press flex-1 rounded-full px-2.5 py-2 text-[13px] font-semibold transition-all duration-200 ${
              range === r
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
