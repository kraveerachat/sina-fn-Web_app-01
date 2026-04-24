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
    <CyberCard glow cornerAccent className="p-6">
      {/* HUD label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] hud-dot" />
        <span className="text-[10px] text-[#39FF14] tracking-[3px] font-mono uppercase">
          NET BALANCE // {monthLabel}
        </span>
      </div>

      {/* Balance amount */}
      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        className="text-4xl lg:text-5xl font-bold font-mono text-[#E8EAF0] tracking-tight mb-5 text-glow-green"
      >
        {formatCurrency(totalBalance)}
      </motion.p>

      {/* Stats row */}
      <div className="flex gap-4">
        {/* Income */}
        <div className="flex-1 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#1A7A08] flex items-center justify-center">
            <span className="text-[#39FF14] text-sm">▲</span>
          </div>
          <div>
            <p className="text-[10px] tracking-[2px] text-[#6B7280] uppercase font-sans">
              รายรับ
            </p>
            <p className="text-sm font-bold font-mono text-[#39FF14]">
              {formatCurrency(totalIncome, true)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-[#2A2F38]" />

        {/* Expense */}
        <div className="flex-1 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#7A1A1A] flex items-center justify-center">
            <span className="text-[#FF3B3B] text-sm">▼</span>
          </div>
          <div>
            <p className="text-[10px] tracking-[2px] text-[#6B7280] uppercase font-sans">
              รายจ่าย
            </p>
            <p className="text-sm font-bold font-mono text-[#FF3B3B]">
              {formatCurrency(-totalExpense, true)}
            </p>
          </div>
        </div>
      </div>
    </CyberCard>
  );
}
