'use client';

import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';

// ─────────────────────────────────────────────────────────────────
// CyberCard — Brutalist Cyberpunk Surface Card
// Design Standard: STRICT 90-DEGREE CORNERS (rounded-none)
// Corner accents are ON by default: top-right + bottom-left.
// ─────────────────────────────────────────────────────────────────

type CardVariant = 'default' | 'danger' | 'success' | 'warn';

interface CyberCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: CardVariant;
  glow?: boolean;
  noPadding?: boolean;
  /** Disable the HUD corner accent decorators */
  noCorners?: boolean;
  /**
   * @deprecated Use variant="danger" | "success" | "warn" instead.
   * Kept for backward compatibility.
   */
  glowColor?: 'green' | 'red';
  /**
   * @deprecated Corner accents are now on by default. Use noCorners to disable.
   * Kept for backward compatibility.
   */
  cornerAccent?: boolean;
}

const variantStyles: Record<CardVariant, { border: string; glow: string; corner: string }> = {
  default: {
    border:  'border-[var(--cyber-border)]',
    glow:    'shadow-[0_0_30px_var(--cyber-green-glow)]',
    corner:  'border-[var(--cyber-green)]',
  },
  danger: {
    border:  'border-[var(--cyber-red)]/30',
    glow:    'shadow-[0_0_30px_var(--cyber-red-glow)]',
    corner:  'border-[var(--cyber-red)]',
  },
  success: {
    border:  'border-[var(--cyber-green)]/30',
    glow:    'shadow-[0_0_30px_var(--cyber-green-glow)]',
    corner:  'border-[var(--cyber-green)]',
  },
  warn: {
    border:  'border-[var(--cyber-amber)]/30',
    glow:    'shadow-[0_0_30px_var(--cyber-amber-glow)]',
    corner:  'border-[var(--cyber-amber)]',
  },
};

export default function CyberCard({
  children,
  variant = 'default',
  glow = false,
  noPadding = false,
  noCorners = false,
  glowColor: _glowColor,    // @deprecated — consumed to avoid DOM spread error
  cornerAccent: _cornerAccent, // @deprecated — corners are on by default now
  className,
  ...props
}: CyberCardProps) {
  const v = variantStyles[variant];

  return (
    <motion.div
      className={cn(
        // ── Base — Brutalist 90° corners ──
        'relative overflow-hidden rounded-none border',
        'bg-linear-to-br from-[var(--cyber-surface)] to-[var(--cyber-bg)]',
        v.border,
        !noPadding && 'p-5',
        glow && v.glow,
        className
      )}
      {...props}
    >
      {/* HUD corner accents — top-right and bottom-left */}
      {!noCorners && (
        <>
          <span
            className={cn(
              'absolute top-0 right-0 w-3 h-3 border-t border-r opacity-25 pointer-events-none',
              v.corner
            )}
          />
          <span
            className={cn(
              'absolute bottom-0 left-0 w-3 h-3 border-b border-l opacity-25 pointer-events-none',
              v.corner
            )}
          />
        </>
      )}

      {children}
    </motion.div>
  );
}
