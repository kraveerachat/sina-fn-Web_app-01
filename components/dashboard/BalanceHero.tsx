'use client';

import { motion } from 'framer-motion';
import CyberCard from '@/components/ui/CyberCard';
import { formatCurrency, getCurrentMonthLabel } from '@/lib/utils';

interface BalanceHeroProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export default function BalanceHero({
  totalBalance,
  totalIncome,
  totalExpense,
}: BalanceHeroProps) {
  const monthLabel = getCurrentMonthLabel();

  return (
    <CyberCard glow className="p-6">
      {/* Month label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-green)] hud-dot" />
        <span className="text-[11px] text-[var(--cyber-green)] tracking-[0.4px] font-medium uppercase">
          Net Balance &middot; {monthLabel}
        </span>
      </div>

      {/* Balance amount */}
      <motion.p
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
        className="text-4xl lg:text-5xl font-bold font-mono text-[var(--cyber-text)] tracking-tight mb-6"
      >
        {formatCurrency(totalBalance)}
      </motion.p>

      {/* Income / Expense row */}
      <div className="flex gap-4">
        {/* Income */}
        <div className="flex-1 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center">
            <span className="text-[var(--color-success)] text-sm font-medium">&#9650;</span>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.3px] text-[var(--cyber-text-secondary)] uppercase">
              Income
            </p>
            <p className="text-sm font-bold font-mono text-[var(--color-success)]">
              {formatCurrency(totalIncome, true)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-[var(--cyber-border)]" />

        {/* Expense */}
        <div className="flex-1 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--cyber-red-glow)] flex items-center justify-center">
            <span className="text-[var(--cyber-red)] text-sm font-medium">&#9660;</span>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.3px] text-[var(--cyber-text-secondary)] uppercase">
              Expense
            </p>
            <p className="text-sm font-bold font-mono text-[var(--cyber-red)]">
              {formatCurrency(-totalExpense, true)}
            </p>
          </div>
        </div>
      </div>
    </CyberCard>
  );
}
