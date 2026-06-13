'use client';

// ═══════════════════════════════════════════════════════════════════
// Ring — circular progress (ported from the design prototype).
// Track on surface-3, rounded cap, animated dashoffset. Children
// render centered in the hole (e.g. a tnum percentage).
// ═══════════════════════════════════════════════════════════════════

interface RingProps {
  pct: number;
  size?: number;
  sw?: number;
  color?: string;
  children?: React.ReactNode;
}

export default function Ring({
  pct,
  size = 78,
  sw = 9,
  color = 'var(--blue)',
  children,
}: RingProps) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, pct) / 100));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
