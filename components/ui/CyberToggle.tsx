'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// CyberToggle — Pill Switch (Apple-style)
//
// Fully rounded track, white round thumb, green when active.
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

const onColor: Record<'green' | 'red' | 'amber', string> = {
  green: 'bg-(--green)',
  red:   'bg-(--red)',
  amber: 'bg-(--gold)',
};

export default function CyberToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  color = 'green',
}: CyberToggleProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative h-7 w-[46px] shrink-0 rounded-full border-none',
          'transition-colors duration-250',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-(--blue) focus-visible:ring-offset-2',
          checked ? onColor[color] : 'bg-(--surface-3)',
          !disabled && 'cursor-pointer'
        )}
      >
        <motion.div
          animate={{ x: checked ? 21 : 3 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        />
      </button>

      {(label || description) && (
        <div>
          {label && (
            <p className="text-sm text-(--text) font-medium select-none">
              {label}
            </p>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-(--text-3)">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
