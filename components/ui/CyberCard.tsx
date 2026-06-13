'use client';

// ═══════════════════════════════════════════════════════════════════
// CyberCard — Clean Surface Card (Apple-style)
//
// White/charcoal surface, hairline border, two-layer soft shadow,
// smooth rounded corners. Variant tints the border only; `glow`
// upgrades to the larger ambient shadow.
// ═══════════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';

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

const variantBorder: Record<CardVariant, string> = {
  default: 'border-(--border)',
  danger:  'border-(--red)/30',
  success: 'border-(--green)/30',
  warn:    'border-(--gold)/30',
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
  return (
    <motion.div
      className={cn(
        'relative rounded-3xl border bg-(--surface)',
        variantBorder[variant],
        glow ? 'shadow-(--shadow-lg)' : 'shadow-(--shadow)',
        !noPadding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
