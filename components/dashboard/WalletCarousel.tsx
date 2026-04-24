'use client';

import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';
import type { Wallet } from '@/types';

interface WalletCarouselProps {
  wallets: Wallet[];
}

const walletGradients: Record<string, string> = {
  bank: 'from-[#1F2328] to-[#252A30]',
  ewallet: 'from-[#1A2332] to-[#1F2328]',
  cash: 'from-[#1F2820] to-[#1F2328]',
  credit: 'from-[#281F23] to-[#1F2328]',
};

const walletBorders: Record<string, string> = {
  bank: 'border-[#448AFF]/20',
  ewallet: 'border-[#00E5FF]/20',
  cash: 'border-[#39FF14]/20',
  credit: 'border-[#FF9100]/20',
};

const walletAccents: Record<string, string> = {
  bank: 'text-[#448AFF]',
  ewallet: 'text-[#00E5FF]',
  cash: 'text-[#39FF14]',
  credit: 'text-[#FF9100]',
};

export default function WalletCarousel({ wallets }: WalletCarouselProps) {
  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] tracking-[3px] text-[#6B7280] font-mono uppercase">
          [ WALLETS ]
        </span>
        <div className="flex-1 h-px bg-[#2A2F38]" />
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
        {wallets.map((wallet, i) => (
          <motion.div
            key={wallet.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className={`
              shrink-0 w-[180px] lg:w-[200px] rounded-[12px] border p-4
              bg-linear-to-br cursor-pointer
              transition-all duration-200 hover:scale-[1.02]
              ${walletGradients[wallet.type] ?? 'from-[#1F2328] to-[#252A30]'}
              ${walletBorders[wallet.type] ?? 'border-[#2A2F38]'}
            `}
          >
            {/* Icon + Name */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{wallet.icon ?? '💰'}</span>
              <span className="text-xs tracking-[1px] text-[#6B7280] uppercase truncate">
                {wallet.name}
              </span>
            </div>

            {/* Balance */}
            <p className={`text-lg font-bold font-mono ${walletAccents[wallet.type] ?? 'text-[#E8EAF0]'}`}>
              {formatCurrency(wallet.balance)}
            </p>

            {/* Type badge */}
            <div className="mt-2">
              <span className="text-[9px] font-mono tracking-[2px] text-[#374151] uppercase">
                {wallet.type}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
