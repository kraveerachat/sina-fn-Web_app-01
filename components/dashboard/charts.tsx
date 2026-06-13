'use client';

// ═══════════════════════════════════════════════════════════════════
// charts — lightweight SVG chart primitives for the dashboard
//
// BalanceAreaChart: white-on-blue area line for the hero, draws on
// left-to-right. CashFlowBars: paired daily in/out bars that grow
// from the baseline. Both render their final state instantly under
// prefers-reduced-motion.
// ═══════════════════════════════════════════════════════════════════

import { motion, useReducedMotion } from 'framer-motion';

// ── BalanceAreaChart ────────────────────────────────────────────────

// Geometry mirrors the prototype: 10px side padding, 14px head room,
// and a 40px band at the bottom reserved for the x-axis labels.
const W = 560;
const H = 230;
const PAD_X = 10;
const TOP = 14;
const BOTTOM = H - 40;

interface BalanceAreaChartProps {
  /** Series values, oldest → newest */
  data: number[];
  /** Label per point; only a handful are rendered */
  labels: string[];
  /** Rendered height in px (viewBox stretches to fill) */
  height?: number;
}

function buildPaths(data: number[]) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = (W - PAD_X * 2) / (data.length - 1 || 1);

  const pts = data.map((v, i) => ({
    x: PAD_X + i * stepX,
    y: TOP + (1 - (v - min) / span) * (BOTTOM - TOP),
  }));

  // Smooth the line with Catmull-Rom → cubic Bézier segments
  let line = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    line += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }

  const area = `${line} L ${pts[pts.length - 1].x},${BOTTOM} L ${pts[0].x},${BOTTOM} Z`;
  return { line, area, pts };
}

export function BalanceAreaChart({ data, labels, height = 212 }: BalanceAreaChartProps) {
  const reduced = useReducedMotion();

  if (data.length < 2) {
    return (
      <div className="flex h-[140px] items-center justify-center text-[13px] text-white/60">
        ยังไม่มีข้อมูลเพียงพอสำหรับกราฟ
      </div>
    );
  }

  const { line, area, pts } = buildPaths(data);
  const last = pts[pts.length - 1];

  // Show at most 7 evenly spaced labels along the x-axis (inside the SVG,
  // like the prototype — they stay glued to their data points)
  const tickCount = Math.min(7, labels.length);
  const tickIdx = Array.from({ length: tickCount }, (_, i) =>
    Math.round((i * (labels.length - 1)) / (tickCount - 1 || 1))
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
      role="img"
      aria-label="Balance trend"
    >
      <defs>
        <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.30)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      <motion.path
        d={area}
        fill="url(#hero-area)"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: [0.45, 0.05, 0.2, 1] }}
      />

      {/* End-point marker with soft halo */}
      <motion.g
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: reduced ? 0 : 1.2 }}
      >
        <circle cx={last.x} cy={last.y} r={9} fill="#fff" opacity={0.22} />
        <circle cx={last.x} cy={last.y} r={4.5} fill="#fff" />
      </motion.g>

      {/* X-axis labels */}
      {tickIdx.map((idx) => (
        <text
          key={idx}
          x={pts[idx].x}
          y={H - 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize={12.5}
          fontWeight={500}
        >
          {labels[idx]}
        </text>
      ))}
    </svg>
  );
}

// ── CashFlowBars ────────────────────────────────────────────────────

export interface CashFlowDay {
  label: string;
  income: number;
  expense: number;
}

interface CashFlowBarsProps {
  days: CashFlowDay[];
  /** Bar area height in px */
  height?: number;
}

export function CashFlowBars({ days, height = 150 }: CashFlowBarsProps) {
  const reduced = useReducedMotion();
  const max = Math.max(1, ...days.flatMap((d) => [d.income, d.expense]));

  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {days.map((d, i) => (
          <div key={`${d.label}-${i}`} className="flex h-full flex-1 items-end justify-center gap-1">
            <motion.div
              className="w-2.5 rounded-full bg-(--green) sm:w-3"
              initial={reduced ? false : { height: 0 }}
              animate={{ height: `${Math.max(3, (d.income / max) * 100)}%` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
            />
            <motion.div
              className="w-2.5 rounded-full bg-(--blue) sm:w-3"
              initial={reduced ? false : { height: 0 }}
              animate={{ height: `${Math.max(3, (d.expense / max) * 100)}%` }}
              transition={{ duration: 0.6, delay: i * 0.05 + 0.04, ease: [0.2, 0.7, 0.2, 1] }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2">
        {days.map((d, i) => (
          <span key={`${d.label}-${i}`} className="flex-1 text-center text-[11px] text-(--text-3)">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
