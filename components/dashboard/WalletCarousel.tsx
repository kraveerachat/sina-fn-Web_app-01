'use client';

// ═══════════════════════════════════════════════════════════════════
// WalletCarousel — 3D Interactive Holographic Wallet Cards
//
// Utopia Tokyo §2/§4: Each card tilts in 3D based on mouse
// position, with a radial sheen and glowing inner border
// that follow the cursor. Uses useHolographicTilt hook.
// ═══════════════════════════════════════════════════════════════════

import { formatCurrency }        from '@/lib/utils';
import { getWalletVisuals }      from '@/lib/banks';
import WalletIconDisplay         from '@/components/ui/WalletIconDisplay';
import SectionHeader             from '@/components/ui/SectionHeader';
import { useHolographicTilt }    from '@/hooks/useHolographicTilt';
import type { Wallet }           from '@/types';

interface WalletCarouselProps {
  wallets: Wallet[];
}

/** Individual Wallet Card with 3D holographic tilt */
function HoloWalletCard({ wallet, index }: { wallet: Wallet; index: number }) {
  const visuals  = getWalletVisuals(wallet.name, wallet.type);
  const isCredit = wallet.type === 'credit';
  const balColor = wallet.balance >= 0 && !isCredit ? visuals.color : '#F87171';

  const { ref, cardStyle, sheenStyle, glowStyle, onMouseMove, onMouseLeave } =
    useHolographicTilt<HTMLDivElement>({
      maxTilt: 8,
      speed: 0.1,
      sheenColor: `${visuals.color}15`,     // subtle tint from brand color
      glowColor: `${visuals.color}25`,
    });

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        ...cardStyle,
        animationDelay: `${index * 80}ms`,
      }}
      className="
        flex-none shrink-0 min-w-[260px] w-[260px] snap-start
        rounded-2xl border border-white/[0.06] glass-card
        p-4 cursor-pointer overflow-hidden relative
        animate-fade-in
      "
    >
      {/* Brand accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
        style={{ backgroundColor: visuals.color }}
      />

      {/* Holographic Sheen overlay (follows mouse) */}
      <div style={sheenStyle} />

      {/* Glowing inner border (mouse-proximity) */}
      <div style={glowStyle} />

      {/* Icon + Name */}
      <div className="flex items-center gap-2.5 mb-3 mt-1 relative z-[1]">
        <WalletIconDisplay visuals={visuals} size={36} />
        <span className="text-xs text-[var(--cyber-text-secondary)] truncate font-medium leading-tight">
          {wallet.name}
        </span>
      </div>

      {/* Balance */}
      <p className="text-lg font-bold font-mono relative z-[1]" style={{ color: balColor }}>
        {formatCurrency(wallet.balance)}
      </p>

      {/* Type badge */}
      <div className="mt-2 flex items-center gap-1.5 relative z-[1]">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: visuals.color }} />
        <span className="text-[10px] text-[var(--cyber-text-muted)] capitalize">
          {visuals.bankLabel ?? wallet.type}
        </span>
      </div>
    </div>
  );
}

export default function WalletCarousel({ wallets }: WalletCarouselProps) {
  if (wallets.length === 0) {
    return (
      <div>
        <SectionHeader title="Wallets" />
        <div className="rounded-2xl border border-white/[0.06] glass-card p-8 flex flex-col items-center justify-center text-center">
          <span className="text-3xl mb-3">💳</span>
          <p className="text-sm text-[var(--cyber-text-secondary)]">No wallets yet</p>
          <p className="text-xs text-[var(--cyber-text-muted)] mt-1">Add your first wallet to start tracking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <SectionHeader title="Wallets" />

      <div className="flex flex-row w-full overflow-x-auto flex-nowrap gap-4 pb-4 snap-x snap-mandatory subtle-scrollbar">
        {wallets.map((wallet, i) => (
          <HoloWalletCard key={wallet.id} wallet={wallet} index={i} />
        ))}
      </div>
    </div>
  );
}
