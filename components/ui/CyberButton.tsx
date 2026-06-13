'use client';

import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import React from 'react';

// ─────────────────────────────────────────────────────────────────
// CyberButton — Pill Button (Apple-style)
// Fully rounded, tactile squish on press, quiet color vocabulary:
// primary = deep blue, warn = gold, danger = muted red.
// ─────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'danger' | 'ghost' | 'outline' | 'warn';
type Size = 'sm' | 'md' | 'lg';

interface CyberButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: Size;
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  glow?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-(--blue) text-white border border-(--blue) hover:brightness-108 font-semibold',
  danger:
    'bg-(--red) text-white border border-(--red) hover:brightness-108 font-semibold',
  warn:
    'bg-(--gold) text-white border border-(--gold) hover:brightness-106 font-semibold',
  ghost:
    'bg-transparent text-(--text) border border-(--border) hover:bg-(--surface-2) font-medium',
  outline:
    'bg-transparent text-(--blue) border border-(--blue)/35 hover:border-(--blue)/60 hover:bg-(--blue-soft) font-medium',
};

const glowStyles: Record<ButtonVariant, string> = {
  primary: 'shadow-[0_4px_14px_color-mix(in_srgb,var(--blue)_35%,transparent)]',
  danger:  'shadow-[0_4px_14px_color-mix(in_srgb,var(--red)_30%,transparent)]',
  warn:    'shadow-[0_4px_14px_color-mix(in_srgb,var(--gold)_35%,transparent)]',
  ghost:   '',
  outline: '',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3.5 text-sm gap-2.5',
};

export default function CyberButton({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  fullWidth = false,
  glow = false,
  loading = false,
  className,
  disabled,
  ...props
}: CyberButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.14, ease: [0.2, 0.7, 0.2, 1] }}
      disabled={isDisabled}
      className={cn(
        'relative inline-flex items-center justify-center',
        'rounded-full cursor-pointer select-none tracking-[-0.01em]',
        'transition-colors duration-200',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        glow && glowStyles[variant],
        isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}

      {children}
    </motion.button>
  );
}
