'use client';

import { cn } from '@/lib/utils';
import React from 'react';

// ─────────────────────────────────────────────────────────────────
// SectionHeader — HUD Section Title with Divider Line
//
// Replaces the repeated pattern found in every page:
//   <div className="flex items-center gap-2 mb-3">
//     <span className="text-[10px] tracking-[3px] ...">[ TITLE ]</span>
//     <div className="flex-1 h-px bg-[#2A2F38]" />
//   </div>
//
// Usage:
//   <SectionHeader title="WALLETS" />
//   <SectionHeader title="SPENDING" accent noDivider />
//   <SectionHeader title="DATA" action={<button>Edit</button>} />
// ─────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  /** Optional sub-label displayed right of title (e.g. a month label) */
  subtitle?: string;
  /** Right-side action element (button, badge, etc.) */
  action?: React.ReactNode;
  /** If true, shows a green left bar accent instead of bracket wrapping */
  accent?: boolean;
  /** Disable the horizontal divider line */
  noDivider?: boolean;
  /** Bottom margin override, defaults to mb-3 */
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
      {/* Green left-bar accent */}
      {accent && (
        <div className="w-0.5 h-4 bg-[var(--cyber-green)] shrink-0" />
      )}

      {/* Title block */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="cyber-label">
          {accent ? title : `[ ${title} ]`}
        </span>
        {subtitle && (
          <span className="cyber-label text-[var(--cyber-text-muted)]">
            {subtitle}
          </span>
        )}
      </div>

      {/* Horizontal divider */}
      {!noDivider && (
        <div className="flex-1 h-px bg-[var(--cyber-border)]" />
      )}

      {/* Right-side action */}
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  );
}
