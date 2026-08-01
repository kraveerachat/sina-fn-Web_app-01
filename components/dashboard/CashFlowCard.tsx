'use client';

// ═══════════════════════════════════════════════════════════════════
// CashFlowCard — last 7 days of income vs expense as paired bars
//
// In/Out totals sit top-right; bars grow from the baseline with a
// gentle per-day stagger. Derived entirely from the transactions
// the dashboard already loads.
// ═══════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { CashFlowBars, type CashFlowDay } from '@/components/dashboard/charts';

export interface CashFlowTransaction {
  transaction_date: string;
  type: string;
  amount: number;
}

interface CashFlowCardProps {
  transactions: CashFlowTransaction[];
}

function buildDays(transactions: CashFlowTransaction[]): CashFlowDay[] {
  const days: CashFlowDay[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);

    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      const t = new Date(tx.transaction_date);
      if (t >= dayStart && t < dayEnd) {
        if (tx.type === 'income') income += tx.amount;
        else if (tx.type === 'expense') expense += tx.amount;
      }
    }

    days.push({
      label:
        i === 0
          ? 'วันนี้'
          : dayStart.toLocaleDateString('th-TH', { weekday: 'short' }),
      income,
      expense,
    });
  }

  return days;
}

export default function CashFlowCard({ transactions }: CashFlowCardProps) {
  const days = useMemo(() => buildDays(transactions), [transactions]);
  const totalIn = days.reduce((s, d) => s + d.income, 0);
  const totalOut = days.reduce((s, d) => s + d.expense, 0);
  const isEmpty = totalIn === 0 && totalOut === 0;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-(--text)">
            Cash Flow
          </p>
          <p className="text-[12.5px] text-(--text-3)">7 วันล่าสุด</p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-[11.5px] text-(--text-3)">เข้า</p>
            <p className="tnum text-[16px] font-semibold text-(--green)">
              +{formatCurrency(totalIn)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11.5px] text-(--text-3)">ออก</p>
            <p className="tnum text-[16px] font-semibold text-(--red)">
              −{formatCurrency(totalOut)}
            </p>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-(--surface-2) text-(--text-3)">
            📊
          </div>
          <p className="text-sm font-medium text-(--text-2)">ยังไม่มีรายการใน 7 วันนี้</p>
        </div>
      ) : (
        <CashFlowBars days={days} />
      )}
    </div>
  );
}
