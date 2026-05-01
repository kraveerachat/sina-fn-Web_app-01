'use client';

import { cn } from '@/lib/utils';
import React from 'react';

// ─────────────────────────────────────────────────────────────────
// SectionHeader — Clean Section Title with Divider Line
// ─────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  accent?: boolean;
  noDivider?: boolean;
  mb?: string;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  action,
  accent = false,
  noDivider = false,
  mb = 'mb-3',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2', mb, className)}>
      {/* Accent bar */}
      {accent && (
        <div className="w-0.5 h-4 rounded-full bg-[var(--cyber-green)] shrink-0" />
      )}

      {/* Title */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="cyber-label">{title}</span>
        {subtitle && (
          <span className="cyber-label text-[var(--cyber-text-muted)]">
            {subtitle}
          </span>
        )}
      </div>

      {/* Divider */}
      {!noDivider && (
        <div className="flex-1 h-px bg-[var(--cyber-border)]" />
      )}

      {/* Action */}
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  );
}
