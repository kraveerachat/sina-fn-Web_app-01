'use client';

import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import React from 'react';

// ─────────────────────────────────────────────────────────────────
// CyberButton — Brutalist Cyberpunk Button
// Design Standard: STRICT 90-DEGREE CORNERS (rounded-none)
// All variants include HUD corner accent markers.
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
    'bg-[var(--cyber-green)] text-[var(--cyber-bg)] hover:bg-[var(--cyber-green)]/90 font-bold',
  danger:
    'bg-[var(--cyber-red)] text-white hover:bg-[var(--cyber-red)]/90 font-bold',
  warn:
    'bg-[var(--cyber-amber)] text-[var(--cyber-bg)] hover:bg-[var(--cyber-amber)]/90 font-bold',
  ghost:
    'bg-transparent text-[var(--cyber-text)] hover:bg-[var(--cyber-surface-alt)] border border-[var(--cyber-border)]',
  outline:
    'bg-transparent text-[var(--cyber-green)] border border-[var(--cyber-green)]/30 hover:border-[var(--cyber-green)]/60 hover:bg-[var(--cyber-green)]/5',
};

const glowStyles: Record<ButtonVariant, string> = {
  primary:  'shadow-[0_0_20px_var(--cyber-green-glow)]',
  danger:   'shadow-[0_0_20px_var(--cyber-red-glow)]',
  warn:     'shadow-[0_0_20px_var(--cyber-amber-glow)]',
  ghost:    '',
  outline:  'shadow-[0_0_12px_var(--cyber-green-glow)]',
};

const cornerColors: Record<ButtonVariant, string> = {
  primary:  'border-[var(--cyber-bg)]',
  danger:   'border-white',
  warn:     'border-[var(--cyber-bg)]',
  ghost:    'border-[var(--cyber-text-muted)]',
  outline:  'border-[var(--cyber-green)]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
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
  const corner = cornerColors[variant];

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { scale: 1.015 }}
      whileTap={isDisabled ? undefined : { scale: 0.975 }}
      transition={{ duration: 0.12 }}
      disabled={isDisabled}
      className={cn(
        // ── Base — Brutalist 90° corners ──
        'relative inline-flex items-center justify-center',
        'rounded-none cursor-pointer select-none',
        'font-mono tracking-[2px] uppercase transition-all duration-200',
        // ── Variant ──
        variantStyles[variant],
        // ── Size ──
        sizeStyles[size],
        // ── Modifiers ──
        fullWidth && 'w-full',
        glow && glowStyles[variant],
        isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {/* HUD corner accents — always on, color follows variant */}
      <span className={cn('absolute top-0 left-0 w-2 h-2 border-t border-l opacity-50 pointer-events-none', corner)} />
      <span className={cn('absolute bottom-0 right-0 w-2 h-2 border-b border-r opacity-50 pointer-events-none', corner)} />

      {/* Loading spinner replaces icon */}
      {loading ? (
        <Loader2 size={14} className="animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}

      {children}
    </motion.button>
  );
}
