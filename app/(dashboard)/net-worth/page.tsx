'use client';

// ═══════════════════════════════════════════════════════════════════
// Net Worth — matches the design prototype (page_networth.jsx):
// hero (eyebrow + 46px net figure), assets-vs-liabilities donut with
// legend, then two breakdown cards (assets by wallet type, debts)
// rendered as labelled progress bars. Data via useWallets/useDebts.
// ═══════════════════════════════════════════════════════════════════

import { useRef, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
import { useDebts } from '@/hooks/useDebts';
import { formatCurrency } from '@/lib/utils';
import type { Wallet } from '@/types';

gsap.registerPlugin(ScrollTrigger);

const TYPE_META: Record<string, { label: string; color: string }> = {
  bank:    { label: 'ธนาคาร',     color: 'var(--blue)' },
  cash:    { label: 'เงินสด',     color: '#5b6b86' },
  savings: { label: 'ออมทรัพย์',  color: 'var(--gold)' },
  ewallet: { label: 'อีวอลเล็ต',  color: 'var(--green)' },
  credit:  { label: 'บัตรเครดิต', color: 'var(--expense)' },
};

// debts have no stored color — cycle a quiet palette
const DEBT_COLORS = ['var(--expense)', 'var(--gold)', '#5b6b86', 'var(--blue)'];

/* ── Labelled progress row (prototype BarRow) ── */
function BarRow({
  label, sub, amount, pct, color,
}: {
  label: string;
  sub?: string;
  amount: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="mt-[15px]">
      <div className="mb-[7px] flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <i className="h-[9px] w-[9px] shrink-0 rounded-[3px]" style={{ background: color }} />
          <span className="truncate text-[13.5px] font-medium text-(--text)">{label}</span>
          {sub && <span className="shrink-0 text-xs text-(--text-3)">{sub}</span>}
        </span>
        <span className="tnum shrink-0 text-[13.5px] font-semibold text-(--text)">{amount}</span>
      </div>
      <div className="track">
        <i style={{ width: `${Math.max(4, pct)}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Conic-gradient donut (prototype Donut) ── */
function Donut({
  segments, size = 120, thickness = 18, children,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments.map((s) => {
    const start = (acc / total) * 100;
    acc += s.value;
    const end = (acc / total) * 100;
    return `${s.color} ${start}% ${end}%`;
  });
  const hole = `radial-gradient(circle ${size / 2 - thickness}px at 50% 50%, transparent 98%, #000 100%)`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        style={{
          width: size, height: size, borderRadius: '50%',
          background: `conic-gradient(${stops.join(',')})`,
          WebkitMask: hole, mask: hole,
        }}
      />
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export default function NetWorthPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { wallets, loading: walletsLoading } = useWallets(userId);
  const { debts, loading: debtsLoading } = useDebts(userId);
  const pageRef = useRef<HTMLDivElement>(null);

  const loading = walletsLoading || debtsLoading;

  const assets = useMemo(
    () => wallets.filter((w) => w.balance >= 0).reduce((s, w) => s + w.balance, 0),
    [wallets]
  );
  const creditLiabilities = useMemo(
    () => wallets.filter((w) => w.balance < 0).reduce((s, w) => s + Math.abs(w.balance), 0),
    [wallets]
  );
  const debtLiabilities = useMemo(
    () => debts.reduce((s, d) => s + d.remaining_amount, 0),
    [debts]
  );
  const totalLiabilities = creditLiabilities + debtLiabilities;
  const netWorth = assets - totalLiabilities;

  // asset breakdown by wallet type (positive balances only, like prototype)
  const byType = useMemo(() => {
    const acc: Record<string, number> = {};
    wallets.filter((w: Wallet) => w.balance > 0).forEach((w) => {
      acc[w.type] = (acc[w.type] || 0) + w.balance;
    });
    return acc;
  }, [wallets]);

  // GSAP stagger
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const sections = gsap.utils.toArray<HTMLElement>('.nw-section', pageRef.current);
      if (sections.length === 0) return;
      gsap.fromTo(sections,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1, delay: 0.05 }
      );
    },
    { scope: pageRef, dependencies: [loading, wallets, debts] }
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="cyber-skeleton h-16 w-1/3 rounded-2xl" />
        <div className="bento">
          <div className="cyber-skeleton cell-7 h-44 rounded-3xl" />
          <div className="cyber-skeleton cell-5 h-44 rounded-3xl" />
          <div className="cyber-skeleton cell-6 h-52 rounded-3xl" />
          <div className="cyber-skeleton cell-6 h-52 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col gap-4">
      {/* ── Page head ── */}
      <div className="mb-1 mt-1.5">
        <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.025em] text-(--text) lg:text-[30px]">
          ความมั่งคั่งสุทธิ
        </h1>
        <p className="mt-1 text-[14.5px] text-(--text-2)">สินทรัพย์รวมหักลบหนี้สินทั้งหมด</p>
      </div>

      <div className="bento">
        {/* ── Hero ── */}
        <div className="nw-section cell-7">
          <div className="flex h-full flex-col justify-center rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
            <p className="eyebrow">ความมั่งคั่งสุทธิ</p>
            <p className={`tnum mb-1.5 mt-2 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] lg:text-[46px] ${
              netWorth >= 0 ? 'text-(--text)' : 'text-(--expense)'
            }`}>
              {formatCurrency(netWorth)}
            </p>
            <p className="text-[12.5px] text-(--text-3)">
              สินทรัพย์ <span className="tnum font-semibold text-(--green)">+{formatCurrency(assets)}</span>
              <span className="mx-2">·</span>
              หนี้สิน <span className="tnum font-semibold text-(--expense)">−{formatCurrency(totalLiabilities)}</span>
            </p>
          </div>
        </div>

        {/* ── Assets vs liabilities donut ── */}
        <div className="nw-section cell-5">
          <div className="h-full rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
            <p className="mb-3 text-sm font-semibold tracking-[-0.01em] text-(--text)">
              สินทรัพย์ vs หนี้สิน
            </p>
            <div className="flex items-center gap-5">
              <Donut
                segments={[
                  { value: assets, color: 'var(--green)' },
                  { value: totalLiabilities, color: 'var(--expense)' },
                ]}
              >
                <div>
                  <p className="text-[10px] tracking-[0.04em] text-(--text-3)">สุทธิ</p>
                  <p className="tnum text-[15px] font-bold tracking-[-0.02em] text-(--text)">
                    {formatCurrency(netWorth)}
                  </p>
                </div>
              </Donut>
              <div className="flex-1">
                <div className="mb-3.5">
                  <div className="flex items-center gap-2">
                    <i className="h-2 w-2 rounded-[3px] bg-(--green)" />
                    <span className="text-xs text-(--text-3)">สินทรัพย์</span>
                  </div>
                  <p className="tnum mt-0.5 text-xl font-bold text-(--green)">{formatCurrency(assets)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <i className="h-2 w-2 rounded-[3px] bg-(--expense)" />
                    <span className="text-xs text-(--text-3)">หนี้สิน</span>
                  </div>
                  <p className="tnum mt-0.5 text-xl font-bold text-(--expense)">{formatCurrency(totalLiabilities)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Assets breakdown ── */}
        <div className="nw-section cell-6">
          <div className="h-full rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold tracking-[-0.01em] text-(--text)">สินทรัพย์</p>
              <p className="tnum text-sm font-medium text-(--text-3)">{formatCurrency(assets)}</p>
            </div>
            {Object.keys(byType).length === 0 ? (
              <p className="py-6 text-center text-sm text-(--text-3)">ยังไม่มีบัญชี</p>
            ) : (
              Object.entries(byType).map(([type, total]) => (
                <BarRow
                  key={type}
                  label={TYPE_META[type]?.label ?? type}
                  amount={formatCurrency(total)}
                  pct={assets > 0 ? (total / assets) * 100 : 0}
                  color={TYPE_META[type]?.color ?? 'var(--blue)'}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Liabilities breakdown ── */}
        <div className="nw-section cell-6">
          <div className="h-full rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold tracking-[-0.01em] text-(--text)">หนี้สิน</p>
              <p className="tnum text-sm font-medium text-(--text-3)">{formatCurrency(totalLiabilities)}</p>
            </div>
            {totalLiabilities === 0 ? (
              <div className="flex flex-col items-center py-6">
                <span className="mb-2 text-2xl">🎉</span>
                <p className="text-sm font-medium text-(--green)">ปลอดหนี้!</p>
              </div>
            ) : (
              <>
                {debts.map((d, i) => (
                  <BarRow
                    key={d.id}
                    label={d.name}
                    sub={d.interest_rate != null ? `${d.interest_rate}%` : undefined}
                    amount={formatCurrency(d.remaining_amount)}
                    pct={(d.remaining_amount / totalLiabilities) * 100}
                    color={DEBT_COLORS[i % DEBT_COLORS.length]}
                  />
                ))}
                {creditLiabilities > 0 && (
                  <BarRow
                    label="บัตรเครดิต"
                    amount={formatCurrency(creditLiabilities)}
                    pct={(creditLiabilities / totalLiabilities) * 100}
                    color="var(--text)"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
