'use client';

import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

export interface BudgetEnvelopeData {
  id: string;
  categoryName: string;
  icon: string;
  spent: number;
  limit: number;
  color: string;
}

interface BudgetEnvelopesProps {
  budgets: BudgetEnvelopeData[];
}

export default function BudgetEnvelopes({ budgets }: BudgetEnvelopesProps) {
  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] tracking-[3px] text-[#6B7280] font-mono uppercase">
          [ BUDGET ENVELOPES ]
        </span>
        <div className="flex-1 h-px bg-[#2A2F38]" />
      </div>

      <div className="space-y-3">
        {budgets.map((budget, i) => {
          const pct = Math.min((budget.spent / budget.limit) * 100, 100);
          const isOver = budget.spent > budget.limit;
          const barColor = isOver ? '#FF3B3B' : budget.color;

          return (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="rounded-[8px] border border-[#2A2F38] bg-[#1F2328] p-4 hover:border-[#39FF1420] transition-colors"
            >
              {/* Top row — icon, name, amount */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{budget.icon}</span>
                  <span className="text-xs tracking-[1px] text-[#E8EAF0] uppercase">
                    {budget.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold ${isOver ? 'text-[#FF3B3B]' : 'text-[#E8EAF0]'}`}>
                    {formatCurrency(budget.spent)}
                  </span>
                  <span className="text-[10px] text-[#374151] font-mono">/</span>
                  <span className="text-[10px] text-[#6B7280] font-mono">
                    {formatCurrency(budget.limit)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-[#252A30] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.08 + 0.3, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: barColor,
                    boxShadow: `0 0 8px ${barColor}40`,
                  }}
                />
              </div>

              {/* Percentage */}
              <div className="flex justify-end mt-1.5">
                <span className={`text-[9px] font-mono tracking-[1px] ${isOver ? 'text-[#FF3B3B]' : 'text-[#374151]'}`}>
                  {Math.round(pct)}%{isOver && ' — OVER BUDGET'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
