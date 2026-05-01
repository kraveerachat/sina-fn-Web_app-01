'use client';

/**
 * WalletIconDisplay
 *
 * Renders either:
 *  - A bank logo <Image> inside a white rounded bubble (when logoPath is set)
 *  - A Lucide icon inside a tinted rounded square (for cash / e-wallet / credit)
 *
 * Props:
 *  - visuals   Result from getWalletVisuals()
 *  - size      Outer container size in px (default 44)
 */

import Image        from 'next/image';
import { getWalletVisuals, type WalletVisuals } from '@/lib/banks';

interface WalletIconDisplayProps {
  visuals: WalletVisuals;
  /** Outer box size in px. Icon/image will be 60% of this. */
  size?: number;
  className?: string;
}

export default function WalletIconDisplay({
  visuals,
  size = 44,
  className = '',
}: WalletIconDisplayProps) {
  const imgSize    = Math.round(size * 0.62);
  const Icon       = visuals.icon;

  if (visuals.logoPath) {
    // ── Bank with a real logo ──────────────────────────────────────
    return (
      <div
        className={`shrink-0 rounded-xl flex items-center justify-center bg-white shadow-sm ${className}`}
        style={{ width: size, height: size, boxShadow: `0 0 0 1px ${visuals.color}30, 0 2px 8px rgba(0,0,0,0.18)` }}
      >
        <Image
          src={visuals.logoPath}
          alt="bank logo"
          width={imgSize}
          height={imgSize}
          className="object-contain rounded-sm"
          unoptimized
        />
      </div>
    );
  }

  // ── Non-bank wallet — tinted Lucide icon ──────────────────────────
  return (
    <div
      className={`shrink-0 rounded-xl flex items-center justify-center ${className}`}
      style={{
        width:           size,
        height:          size,
        backgroundColor: `${visuals.color}18`,
        border:          `1px solid ${visuals.color}40`,
      }}
    >
      <Icon
        size={Math.round(size * 0.46)}
        style={{ color: visuals.color }}
        strokeWidth={1.7}
      />
    </div>
  );
}

// ── Convenience re-export so callers don't need a second import ──
export { getWalletVisuals };
