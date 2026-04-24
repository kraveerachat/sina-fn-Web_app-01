'use client';

import { motion } from 'framer-motion';
import { formatCurrency, formatTime } from '@/lib/utils';

export interface TransactionDisplay {
  id: string;
  emoji: string;
  note: string;
  categoryName: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  transaction_date: string;
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
          <span className="text-[10px] tracking-[3px] text-[#6B7280] font-mono uppercase">
            [ RECENT TRANSACTIONS ]
          </span>
          <div className="flex-1 h-px bg-[#2A2F38]" />
        </div>
        <button className="text-[10px] tracking-[2px] text-[#39FF14] font-mono hover:text-[#39FF14]/70 transition-colors uppercase">
          VIEW ALL →
        </button>
      </div>

      <div className="space-y-1">
        {transactions.map((tx, i) => {
          const isIncome = tx.type === 'income';
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="group flex items-center gap-3 rounded-[8px] p-3 hover:bg-[#252A30] transition-colors cursor-pointer border border-transparent hover:border-[#2A2F38]"
            >
              {/* Emoji icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#252A30] group-hover:bg-[#1F2328] transition-colors">
                <span className="text-lg">{tx.emoji}</span>
              </div>

              {/* Description + category */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#E8EAF0] truncate">{tx.note}</p>
                <p className="text-[10px] tracking-[1px] text-[#374151] uppercase font-mono mt-0.5">
                  {tx.categoryName}
                </p>
              </div>

              {/* Time */}
              <div className="shrink-0 text-right">
                <p
                  className={`text-sm font-bold font-mono ${
                    isIncome ? 'text-[#39FF14]' : 'text-[#FF3B3B]'
                  }`}
                >
                  {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                </p>
                <p className="text-[9px] font-mono text-[#374151] mt-0.5">
                  {formatTime(tx.transaction_date)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
