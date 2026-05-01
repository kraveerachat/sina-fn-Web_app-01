'use client';

import { motion }             from 'framer-motion';
import { formatCurrency }     from '@/lib/utils';
import { getWalletVisuals }   from '@/lib/banks';
import WalletIconDisplay      from '@/components/ui/WalletIconDisplay';
import type { Wallet }        from '@/types';

interface WalletCarouselProps {
  wallets: Wallet[];
}

export default function WalletCarousel({ wallets }: WalletCarouselProps) {
  if (wallets.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="cyber-label">Wallets</span>
          <div className="flex-1 h-px bg-(--cyber-border)" />
        </div>
        <div className="rounded-2xl border border-(--cyber-border) bg-(--cyber-surface) p-8 flex flex-col items-center justify-center text-center">
          <span className="text-3xl mb-3">💳</span>
          <p className="text-sm text-(--cyber-text-secondary)">No wallets yet</p>
          <p className="text-xs text-(--cyber-text-muted) mt-1">Add your first wallet to start tracking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="cyber-label">Wallets</span>
        <div className="flex-1 h-px bg-(--cyber-border)" />
      </div>

      <div className="flex flex-row w-full overflow-x-auto flex-nowrap gap-4 pb-4 snap-x snap-mandatory subtle-scrollbar">
        {wallets.map((wallet, i) => {
          const visuals  = getWalletVisuals(wallet.name, wallet.type);
          const isCredit = wallet.type === 'credit';
          const balColor = wallet.balance >= 0 && !isCredit ? visuals.color : '#F87171';

          return (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className="flex-none shrink-0 min-w-[260px] w-[260px] snap-start rounded-2xl border border-(--cyber-border) bg-(--cyber-surface) p-4 transition-all duration-200 hover:border-(--border-light) hover:shadow-[0_4px_16px_rgba(0,0,0,0.24)] cursor-pointer overflow-hidden relative"
            >
              {/* Brand accent strip */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{ backgroundColor: visuals.color }}
              />

              {/* Icon + Name */}
              <div className="flex items-center gap-2.5 mb-3 mt-1">
                <WalletIconDisplay visuals={visuals} size={36} />
                <span className="text-xs text-(--cyber-text-secondary) truncate font-medium leading-tight">
                  {wallet.name}
                </span>
              </div>

              {/* Balance */}
              <p className="text-lg font-bold font-mono" style={{ color: balColor }}>
                {formatCurrency(wallet.balance)}
              </p>

              {/* Type badge */}
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: visuals.color }} />
                <span className="text-[10px] text-(--cyber-text-muted) capitalize">
                  {visuals.bankLabel ?? wallet.type}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
