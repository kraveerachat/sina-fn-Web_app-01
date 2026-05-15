'use client';

// ═══════════════════════════════════════════════════════════════════
// TransactionList — Recent Transactions with Glass Rows
//
// Phase 6 "Analytics Matrix":
//  ✓ Glass panel rows (bg-white/[0.02], hover border glow)
//  ✓ Staggered vertical entry via Framer Motion
//  ✓ AI-generated sparkle badge preserved
// ═══════════════════════════════════════════════════════════════════

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { formatCurrency, formatTime } from '@/lib/utils';
import { getWalletVisuals } from '@/lib/banks';
import WalletIconDisplay from '@/components/ui/WalletIconDisplay';
import { Zap } from 'lucide-react';

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
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  }),
};

export default function TransactionList({ transactions }: TransactionListProps) {
  return (
    <div>
      {/* Section label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="cyber-label">Recent Transactions</span>
          <div className="flex-1 h-px bg-(--cyber-border)" />
        </div>
        <Link href="/history" className="text-[11px] font-medium text-(--cyber-green) hover:opacity-70 transition-opacity">
          View All
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] glass-card p-8 flex flex-col items-center justify-center text-center">
          <span className="text-3xl mb-3">📝</span>
          <p className="text-sm text-(--cyber-text-secondary)">No transactions yet</p>
          <p className="text-xs text-(--cyber-text-muted) mt-1">Tap Quick Add to record your first entry</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {transactions.map((tx, i) => {
            const isIncome = tx.type === 'income';
            const isAi = tx.is_ai_generated === true;
            const displayIcon = tx.emoji
              ? tx.emoji
              : (tx.categoryName === 'ออมเงิน' || tx.categoryName === 'Savings' || tx.note.includes('ออมเงิน'))
                ? '🎯'
                : '💸';

            return (
              <motion.div
                key={tx.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className={`
                  group flex items-center gap-3 rounded-xl p-3
                  bg-white/[0.02] border border-transparent
                  hover:bg-white/[0.05] hover:border-white/10
                  transition-all duration-300 cursor-pointer
                  ${isAi ? 'ai-sparkle' : ''}
                `}
              >
                {/* ── Bank Logo OR Category Emoji ── */}
                {tx.walletType === 'bank' ? (
                  <WalletIconDisplay
                    visuals={getWalletVisuals(tx.walletName, tx.walletType)}
                    size={40}
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] group-hover:bg-white/[0.06] transition-colors border border-transparent">
                    <span className="text-lg">{displayIcon}</span>
                  </div>
                )}

                {/* Description + category + AI badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-(--cyber-text) truncate">{tx.note}</p>
                    {isAi && (
                      <Zap size={10} className="text-(--cyber-cyan) shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-(--cyber-text-muted) mt-0.5">
                    {tx.categoryName}
                  </p>
                </div>

                {/* Amount + time */}
                <div className="shrink-0 text-right">
                  <p
                    className={`text-sm font-bold font-mono ${
                      isIncome ? 'text-(--color-success)' : 'text-(--cyber-red)'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </p>
                  <p className="text-[9px] font-mono text-(--cyber-text-muted) mt-0.5">
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
