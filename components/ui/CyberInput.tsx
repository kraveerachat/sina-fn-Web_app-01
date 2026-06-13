'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

// ─────────────────────────────────────────────────────────────────
// CyberInput — Clean Text Input (Apple-style)
// Soft inset surface, 14px radius, blue focus ring.
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
        {label && (
          <label className="block text-[12.5px] font-medium text-(--text-2)">
            {label}
          </label>
        )}

        <div className="group relative">
          <div
            className={cn(
              'flex items-center gap-2',
              'rounded-[14px] border bg-(--surface-2)',
              'transition-all duration-200',
              error
                ? 'border-(--red)/50 group-focus-within:shadow-[0_0_0_3px_var(--red-soft)]'
                : 'border-(--border) group-focus-within:border-(--blue) group-focus-within:shadow-[0_0_0_3px_var(--blue-soft)]'
            )}
          >
            {icon && (
              <span className="pl-3.5 text-(--text-3) group-focus-within:text-(--blue) transition-colors shrink-0">
                {icon}
              </span>
            )}

            <input
              ref={ref}
              className={cn(
                'w-full bg-transparent px-3.5 py-3',
                'text-[15px] text-(--text) placeholder-(--text-3)',
                'outline-none',
                icon && 'pl-0',
                className
              )}
              {...props}
            />

            {rightElement && (
              <span className="pr-3.5 shrink-0">{rightElement}</span>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium text-(--red)">{error}</p>
        )}

        {hint && !error && (
          <p className="text-xs text-(--text-3)">{hint}</p>
        )}
      </div>
    );
  }
);

CyberInput.displayName = 'CyberInput';
export default CyberInput;
