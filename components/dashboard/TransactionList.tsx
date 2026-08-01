'use client';

// ═══════════════════════════════════════════════════════════════════
// TransactionList — recent transactions with hairline-divided rows
//
// Income amounts are green; outflow stays in primary ink (quiet,
// not alarming). AI-generated entries carry a small gold badge.
// ═══════════════════════════════════════════════════════════════════

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { formatCurrency, formatTime } from '@/lib/utils';
import { getWalletVisuals } from '@/lib/banks';
import WalletIconDisplay from '@/components/ui/WalletIconDisplay';
import { Sparkles } from 'lucide-react';

export interface TransactionDisplay {
  id: string;
  emoji: string;
  note: string;
  categoryName: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  transaction_date: string;
  walletName: string;
  walletType: string;
  is_ai_generated?: boolean | null;
}

interface TransactionListProps {
  transactions: TransactionDisplay[];
}

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0, 0, 0.2, 1] as [number, number, number, number],
    },
  }),
};

export default function TransactionList({ transactions }: TransactionListProps) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
      {/* Header */}
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-(--text)">
          Recent Transactions
        </span>
        <Link
          href="/history"
          className="text-[13px] font-medium text-(--blue) hover:opacity-70 transition-opacity"
        >
          ดูทั้งหมด
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--surface-2) text-(--text-3)">
            📝
          </div>
          <p className="text-sm font-medium text-(--text-2)">ยังไม่มีรายการธุรกรรม</p>
          <p className="mt-0.5 text-xs text-(--text-3)">
            กดปุ่มบวกเพื่อเพิ่มรายการแรกของคุณ
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {transactions.map((tx, i) => {
            const isIncome = tx.type === 'income';
            const isAi = tx.is_ai_generated === true;
            const isLast = i === transactions.length - 1;
            const displayIcon = tx.emoji
              ? tx.emoji
              : tx.categoryName === 'ออมเงิน' ||
                  tx.categoryName === 'Savings' ||
                  tx.note.includes('ออมเงิน')
                ? '🎯'
                : '💸';

            return (
              <motion.div
                key={tx.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className={`flex items-center gap-3 py-3 ${
                  isLast ? '' : 'border-b border-(--border-2)'
                }`}
              >
                {/* Bank logo or category emoji */}
                {tx.walletType === 'bank' ? (
                  <WalletIconDisplay
                    visuals={getWalletVisuals(tx.walletName, tx.walletType)}
                    size={38}
                  />
                ) : (
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-(--surface-2)">
                    <span className="text-[17px]">{displayIcon}</span>
                  </div>
                )}

                {/* Note + category + AI badge */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-(--text)">
                      {tx.note}
                    </p>
                    {isAi && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-(--gold-soft) px-1.5 py-px text-[10px] font-semibold text-(--gold)">
                        <Sparkles size={9} />
                        AI
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-(--text-3)">
                    {tx.categoryName}
                  </p>
                </div>

                {/* Amount + time */}
                <div className="shrink-0 text-right">
                  <p
                    className={`tnum text-sm font-semibold ${
                      isIncome ? 'text-(--green)' : 'text-(--text)'
                    }`}
                  >
                    {isIncome ? '+' : '−'}
                    {formatCurrency(Math.abs(tx.amount))}
                  </p>
                  <p className="mt-0.5 text-[11px] text-(--text-3)">
                    {formatTime(tx.transaction_date)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
