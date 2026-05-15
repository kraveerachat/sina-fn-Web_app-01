'use client';

import { useRef, useMemo } from 'react';
import { Loader2, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import CyberCard from '@/components/ui/CyberCard';
import SectionHeader from '@/components/ui/SectionHeader';
import ScrambleText from '@/components/ui/ScrambleText';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
import { useDebts } from '@/hooks/useDebts';
import { formatCurrency } from '@/lib/utils';
import type { Wallet } from '@/types';

gsap.registerPlugin(ScrollTrigger);

// ── Dual-ring donut chart (SVG) ──
interface DonutRingProps {
  segments: { value: number; color: string; label: string }[];
  radius: number;
  strokeWidth: number;
  centerX: number;
  centerY: number;
}

function DonutRing({ segments, radius, strokeWidth, centerX, centerY }: DonutRingProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const currentOffset = offset;
        offset += dash;

        return (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 4px ${seg.color}40)` }}
          />
        );
      })}
    </>
  );
}

// ── Breakdown row by wallet type ──
function breakdownByType(wallets: Wallet[]) {
  const groups: Record<string, { label: string; total: number; color: string }> = {
    bank:    { label: '🏦 ธนาคาร',   total: 0, color: 'var(--cyber-green)' },
    cash:    { label: '💵 เงิน��ด',    total: 0, color: 'var(--color-success)' },
    ewallet: { label: '📱 E-Wallet',  total: 0, color: 'var(--cyber-cyan)' },
    credit:  { label: '💳 บัตรเครดิต', total: 0, color: 'var(--cyber-red)' },
    savings: { label: '🏦 ออมทรัพย์',  total: 0, color: 'var(--cyber-amber)' },
  };

  for (const w of wallets) {
    if (groups[w.type]) {
      groups[w.type].total += w.balance;
    }
  }

  return Object.values(groups).filter((g) => g.total !== 0);
}

export default function NetWorthPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { wallets, loading: walletsLoading } = useWallets(userId);
  const { debts, loading: debtsLoading } = useDebts(userId);
  const pageRef = useRef<HTMLDivElement>(null);

  const loading = walletsLoading || debtsLoading;

  const assets = useMemo(() => wallets.filter((w) => w.balance >= 0).reduce((s, w) => s + w.balance, 0), [wallets]);
  const creditLiabilities = useMemo(() => wallets.filter((w) => w.balance < 0).reduce((s, w) => s + Math.abs(w.balance), 0), [wallets]);
  const debtLiabilities = useMemo(() => debts.reduce((s, d) => s + d.remaining_amount, 0), [debts]);
  const totalLiabilities = creditLiabilities + debtLiabilities;
  const netWorth = assets - totalLiabilities;

  const walletBreakdown = useMemo(() => breakdownByType(wallets), [wallets]);

  // Donut data
  const outerSegments = useMemo(() => [
    { value: assets, color: 'var(--color-success)', label: 'Assets' },
    { value: totalLiabilities, color: 'var(--cyber-red)', label: 'Liabilities' },
  ], [assets, totalLiabilities]);

  const innerSegments = useMemo(() => {
    const segs: { value: number; color: string; label: string }[] = [];
    if (creditLiabilities > 0) segs.push({ value: creditLiabilities, color: '#FB7185', label: 'Credit' });
    for (const d of debts) {
      segs.push({ value: d.remaining_amount, color: '#F87171', label: d.name });
    }
    return segs;
  }, [debts, creditLiabilities]);

  // GSAP stagger
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      const sections = gsap.utils.toArray<HTMLElement>('.nw-section', pageRef.current);
      if (sections.length === 0) return;
      gsap.set(sections, { y: 30, opacity: 0 });
      gsap.to(sections, {
        y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: pageRef.current, start: 'top 85%', once: true },
      });
    },
    { scope: pageRef, dependencies: [loading, wallets, debts] }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-7 h-7 text-[var(--cyber-green)] animate-spin" />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col h-full space-y-6 pb-20 lg:pb-6">
      {/* ��─ Header ── */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-green)] hud-dot" />
          <span className="text-[10px] tracking-[3px] text-[var(--cyber-green)] font-mono uppercase">WEALTH OVERVIEW</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--cyber-text)]">มูลค่าสุทธิ</h1>
      </div>

      {/* ── Net Worth Hero ── */}
      <CyberCard glow className="p-6 nw-section">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-green)] animate-pulse" />
          <span className="text-[11px] tracking-[3px] text-[var(--cyber-green)] font-mono uppercase">
            NET WORTH
          </span>
        </div>
        <ScrambleText
          text={formatCurrency(netWorth, true)}
          duration={600}
          className={`text-4xl md:text-5xl font-bold font-mono ${netWorth >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--cyber-red)]'}`}
        />
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={14} className="text-[var(--color-success)]" />
            <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-wider">Assets</span>
            <ScrambleText text={formatCurrency(assets)} duration={400} delay={150} className="text-sm font-mono font-bold text-[var(--color-success)]" />
          </div>
          <div className="flex items-center gap-2">
            <ArrowDownRight size={14} className="text-[var(--cyber-red)]" />
            <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-wider">Liabilities</span>
            <ScrambleText text={formatCurrency(totalLiabilities)} duration={400} delay={300} className="text-sm font-mono font-bold text-[var(--cyber-red)]" />
          </div>
        </div>
      </CyberCard>

      {/* ── Chart + Breakdown grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dual-ring donut */}
        <div className="nw-section">
          <SectionHeader title="ASSET VS LIABILITY" accent />
          <CyberCard className="p-6 flex items-center justify-center">
            <div className="relative">
              <svg width={240} height={240} viewBox="0 0 240 240">
                <DonutRing segments={outerSegments} radius={100} strokeWidth={18} centerX={120} centerY={120} />
                <DonutRing segments={innerSegments} radius={72} strokeWidth={14} centerX={120} centerY={120} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Scale size={16} className="text-[var(--cyber-green)] mb-1" />
                <span className="text-[9px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-wider">Ratio</span>
                <span className="text-lg font-mono font-bold text-[var(--cyber-text)]">
                  {totalLiabilities > 0 ? (assets / totalLiabilities).toFixed(1) : '∞'}x
                </span>
              </div>
            </div>
            <div className="ml-6 flex flex-col gap-2">
              {outerSegments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
                  <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase">{seg.label}</span>
                  <span className="text-xs font-mono font-bold text-[var(--cyber-text)]">{formatCurrency(seg.value)}</span>
                </div>
              ))}
            </div>
          </CyberCard>
        </div>

        {/* Asset breakdown by type */}
        <div className="nw-section">
          <SectionHeader title="BREAKDOWN BY TYPE" accent />
          <CyberCard className="p-5">
            <div className="flex flex-col gap-3">
              {walletBreakdown.map((group) => {
                const pct = assets > 0 ? (Math.abs(group.total) / (assets + totalLiabilities)) * 100 : 0;
                return (
                  <div key={group.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--cyber-text)]">{group.label}</span>
                      <span className={`text-xs font-mono font-bold ${group.total >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--cyber-red)]'}`}>
                        {formatCurrency(group.total, true)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: group.color }}
                      />
                    </div>
                  </div>
                );
              })}
              {walletBreakdown.length === 0 && (
                <p className="text-[var(--cyber-text-muted)] text-xs font-mono text-center py-4">ไม่มีข้อ��ูลบัญชี</p>
              )}
            </div>
          </CyberCard>
        </div>
      </div>

      {/* ── Debt breakdown ── */}
      <div className="nw-section">
        <SectionHeader title="DEBT ACCOUNTS" subtitle={`${debts.length} รายการ`} accent />
        {debts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {debts.map((d) => {
              const paidPct = d.total_amount > 0 ? ((d.total_amount - d.remaining_amount) / d.total_amount) * 100 : 0;
              return (
                <CyberCard key={d.id} variant="danger" noPadding className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-[var(--cyber-text)] truncate">{d.name}</h3>
                    {d.interest_rate != null && (
                      <span className="text-[10px] font-mono text-[var(--cyber-amber)] shrink-0">{d.interest_rate}% APR</span>
                    )}
                  </div>
                  <p className="text-lg font-mono font-bold text-[var(--cyber-red)]">{formatCurrency(d.remaining_amount)}</p>
                  <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--cyber-red)] to-[var(--cyber-amber)]"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-mono text-[var(--cyber-text-muted)] mt-1 text-right">ชำระแล้ว {paidPct.toFixed(0)}%</p>
                </CyberCard>
              );
            })}
          </div>
        ) : (
          <div className="glass-card border border-dashed border-white/[0.08] rounded-2xl py-8 flex flex-col items-center justify-center">
            <p className="text-[var(--color-success)] text-sm font-mono uppercase tracking-wide">ปลอดหนี้!</p>
          </div>
        )}
      </div>
    </div>
  );
}
