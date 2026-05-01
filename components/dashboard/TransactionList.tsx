'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatCurrency, formatTime } from '@/lib/utils';import { getWalletVisuals } from '@/lib/banks';
import WalletIconDisplay from '@/components/ui/WalletIconDisplay';

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
}

interface TransactionListProps {
  transactions: TransactionDisplay[];
}

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
        <div className="rounded-2xl border border-[var(--cyber-border)] bg-[var(--cyber-surface)] p-8 flex flex-col items-center justify-center text-center">
          <span className="text-3xl mb-3">📝</span>
          <p className="text-sm text-[var(--cyber-text-secondary)]">No transactions yet</p>
          <p className="text-xs text-[var(--cyber-text-muted)] mt-1">Tap Quick Add to record your first entry</p>
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map((tx, i) => {
            const isIncome = tx.type === 'income';
            const displayIcon = tx.emoji 
              ? tx.emoji 
              : (tx.categoryName === 'ออมเงิน' || tx.categoryName === 'Savings' || tx.note.includes('ออมเงิน'))
                ? '🎯'
                : '💸';

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="group flex items-center gap-3 rounded-xl p-3 hover:bg-(--cyber-surface-alt) transition-colors cursor-pointer"
              >
                {/* ── Bank Logo OR Category Emoji ── */}
                {tx.walletType === 'bank' ? (
                  <WalletIconDisplay
                    visuals={getWalletVisuals(tx.walletName, tx.walletType)}
                    size={40}
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--cyber-surface-alt) group-hover:bg-(--cyber-surface) transition-colors border border-transparent">
                    <span className="text-lg">{displayIcon}</span>
                  </div>
                )}

                {/* Description + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--cyber-text)] truncate">{tx.note}</p>
                  <p className="text-[10px] text-[var(--cyber-text-muted)] mt-0.5">
                    {tx.categoryName}
                  </p>
                </div>

                {/* Amount + time */}
                <div className="shrink-0 text-right">
                  <p
                    className={`text-sm font-bold font-mono ${
                      isIncome ? 'text-[var(--color-success)]' : 'text-[var(--cyber-red)]'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </p>
                  <p className="text-[9px] font-mono text-[var(--cyber-text-muted)] mt-0.5">
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
