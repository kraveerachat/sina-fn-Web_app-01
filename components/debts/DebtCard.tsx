'use client';

// ═══════════════════════════════════════════════════════════════════
// DebtCard — Shatterable Debt Card for Cinematic Destroyer
//
// Each card represents a debt that the laser will obliterate.
// Uses GSAP for the shatter animation triggered by ScrollTrigger.
// ═══════════════════════════════════════════════════════════════════

import { forwardRef } from 'react';
import { CreditCard, Percent, TrendingDown } from 'lucide-react';

interface DebtCardProps {
  name: string;
  amount: string;
  rate: string;
  monthly: string;
  className?: string;
}

const DebtCard = forwardRef<HTMLDivElement, DebtCardProps>(
  ({ name, amount, rate, monthly, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`debt-shatter-card relative w-full max-w-md mx-auto rounded-2xl border border-[var(--cyber-red)]/20 glass-card p-6 ${className}`}
      >
        {/* Glow edge */}
        <div className="absolute inset-0 rounded-2xl shadow-none pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--cyber-red)]/10 flex items-center justify-center">
            <CreditCard size={20} className="text-[var(--cyber-red)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--cyber-text)] font-medium tracking-wider">
              {name}
            </h3>
            <span className="text-[10px] text-[var(--cyber-text-muted)] tnum">
              ACTIVE LIABILITY
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-3xl font-bold tnum text-[var(--cyber-red)] mb-4">
          {amount}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 pt-3 border-t border-(--border)">
          <span className="flex items-center gap-1.5 text-[10px] tnum text-[var(--cyber-amber)]">
            <Percent size={10} /> {rate}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] tnum text-[var(--cyber-text-secondary)]">
            <TrendingDown size={10} /> Min {monthly}/mo
          </span>
        </div>

        {/* Fake progress */}
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-(--surface-2) overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--cyber-red)] to-[var(--cyber-amber)]"
              style={{ width: '35%' }}
            />
          </div>
        </div>
      </div>
    );
  }
);

DebtCard.displayName = 'DebtCard';
export default DebtCard;
