'use client';

import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';

// ─────────────────────────────────────────────────────────────────
// CyberCard — Modern Minimal Surface Card
// Soft rounded corners, subtle shadows, clean borders.
// ─────────────────────────────────────────────────────────────────

type CardVariant = 'default' | 'danger' | 'success' | 'warn';

interface CyberCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: CardVariant;
  glow?: boolean;
  noPadding?: boolean;
  /** @deprecated Corners are always rounded now. Ignored. */
  noCorners?: boolean;
  /** @deprecated Use variant instead. */
  glowColor?: 'green' | 'red';
  /** @deprecated Corner accents removed. Ignored. */
  cornerAccent?: boolean;
}

const variantStyles: Record<CardVariant, { border: string; glow: string }> = {
  default: {
    border:  'border-[var(--cyber-border)]',
    glow:    'shadow-[0_0_24px_var(--cyber-green-glow)]',
  },
  danger: {
    border:  'border-[var(--cyber-red)]/20',
    glow:    'shadow-[0_0_24px_var(--cyber-red-glow)]',
  },
  success: {
    border:  'border-[var(--color-success)]/20',
    glow:    'shadow-[0_0_24px_var(--color-success-light)]',
  },
  warn: {
    border:  'border-[var(--cyber-amber)]/20',
    glow:    'shadow-[0_0_24px_var(--cyber-amber-glow)]',
  },
};

export default function CyberCard({
  children,
  variant = 'default',
  glow = false,
  noPadding = false,
  noCorners: _noCorners,
  glowColor: _glowColor,
  cornerAccent: _cornerAccent,
  className,
  ...props
}: CyberCardProps) {
  const v = variantStyles[variant];

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        'bg-[var(--cyber-surface)]',
        v.border,
        !noPadding && 'p-5',
        glow && v.glow,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
