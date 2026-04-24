'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

// ─────────────────────────────────────────────────────────────────
// CyberInput — Brutalist Cyberpunk Text Input
// Design Standard: STRICT 90-DEGREE CORNERS (rounded-none)
// Corner bracket decorators animate on focus.
// ─────────────────────────────────────────────────────────────────

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  ({ label, icon, error, hint, rightElement, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {/* Label — HUD bracket style */}
        {label && (
          <label className="cyber-label flex items-center gap-1.5">
            <span className="text-[var(--cyber-text-muted)]">[</span>
            {label}
            <span className="text-[var(--cyber-text-muted)]">]</span>
          </label>
        )}

        {/* Input wrapper with animated corner brackets */}
        <div className="relative group">
          {/* Top-left corner bracket */}
          <span className="
            absolute top-0 left-0 w-2.5 h-2.5
            border-t border-l border-[var(--cyber-border)]
            group-focus-within:border-[var(--cyber-green)]
            transition-colors duration-200
            pointer-events-none z-10
          " />
          {/* Bottom-right corner bracket */}
          <span className="
            absolute bottom-0 right-0 w-2.5 h-2.5
            border-b border-r border-[var(--cyber-border)]
            group-focus-within:border-[var(--cyber-green)]
            transition-colors duration-200
            pointer-events-none z-10
          " />

          {/* Inner field container */}
          <div className="
            flex items-center gap-2
            rounded-none border border-[var(--cyber-border)]
            bg-[var(--cyber-surface-alt)]
            group-focus-within:border-[var(--cyber-green)]/40
            group-focus-within:shadow-[0_0_12px_var(--cyber-green-glow)]
            transition-all duration-200
          ">
            {icon && (
              <span className="pl-3 text-[var(--cyber-text-muted)] group-focus-within:text-[var(--cyber-green)]/60 transition-colors shrink-0">
                {icon}
              </span>
            )}

            <input
              ref={ref}
              className={cn(
                'w-full bg-transparent px-3 py-2.5',
                'text-sm text-[var(--cyber-text)] placeholder-[var(--cyber-text-muted)]',
                'outline-none font-mono',
                icon && 'pl-0',
                className
              )}
              {...props}
            />

            {rightElement && (
              <span className="pr-3 shrink-0">{rightElement}</span>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <p className="cyber-label text-[var(--cyber-red)] flex items-center gap-1">
            ⚠ {error}
          </p>
        )}

        {/* Hint */}
        {hint && !error && (
          <p className="cyber-label text-[var(--cyber-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

CyberInput.displayName = 'CyberInput';
export default CyberInput;
