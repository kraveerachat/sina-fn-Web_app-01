'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// CyberToggle — Brutalist Rectangular Toggle Switch
//
// Design Standard: STRICT 90-DEGREE CORNERS — NO pill shape.
// The slider is a solid neon square, not a rounded thumb.
//
// Usage:
//   <CyberToggle checked={appLock} onChange={setAppLock} />
//   <CyberToggle checked={val} onChange={fn} label="App Lock" disabled />
// ─────────────────────────────────────────────────────────────────

interface CyberToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  /** Color scheme when active — defaults to 'green' */
  color?: 'green' | 'red' | 'amber';
}

const colorMap = {
  green: {
    track:     'bg-[var(--cyber-green-dim)] border-[var(--cyber-green)]/40',
    thumb:     'bg-[var(--cyber-green)]',
    glow:      'shadow-[0_0_8px_var(--cyber-green-glow-sm)]',
    trackOff:  'bg-[var(--cyber-surface-alt)] border-[var(--cyber-border)]',
  },
  red: {
    track:     'bg-[var(--cyber-red-dim)] border-[var(--cyber-red)]/40',
    thumb:     'bg-[var(--cyber-red)]',
    glow:      'shadow-[0_0_8px_var(--cyber-red-glow)]',
    trackOff:  'bg-[var(--cyber-surface-alt)] border-[var(--cyber-border)]',
  },
  amber: {
    track:     'bg-[var(--cyber-amber)]/20 border-[var(--cyber-amber)]/40',
    thumb:     'bg-[var(--cyber-amber)]',
    glow:      'shadow-[0_0_8px_var(--cyber-amber-glow)]',
    trackOff:  'bg-[var(--cyber-surface-alt)] border-[var(--cyber-border)]',
  },
};

export default function CyberToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  color = 'green',
}: CyberToggleProps) {
  const c = colorMap[color];

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {/* Toggle track — rectangular, brutalist */}
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative w-11 h-6 shrink-0',
          'rounded-none border',
          'transition-colors duration-200',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cyber-green)]',
          checked ? cn(c.track, c.glow) : c.trackOff,
          !disabled && 'cursor-pointer'
        )}
      >
        {/* Sliding thumb — solid square */}
        <motion.div
          layout
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'absolute top-1 w-4 h-4',
            'rounded-none',
            checked ? c.thumb : 'bg-[var(--cyber-text-muted)]',
          )}
        />

        {/* HUD tick marks */}
        <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-current opacity-30" />
        <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-30" />
      </button>

      {/* Label */}
      {(label || description) && (
        <div>
          {label && (
            <p className="text-sm text-[var(--cyber-text)] font-medium select-none">
              {label}
            </p>
          )}
          {description && (
            <p className="cyber-label mt-0.5 text-[var(--cyber-text-muted)]">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
