'use client';

// ═══════════════════════════════════════════════════════════════════
// SectionHeader — Cinematic Section Title with GSAP Reveal
//
// Utopia Tokyo §3: Section headers slide up + fade in when
// entering the viewport, with the divider line scaling in from
// the left. Uses @gsap/react useGSAP() + ScrollTrigger.
// ═══════════════════════════════════════════════════════════════════

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import React from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

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
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 92%',
          once: true,
        },
      });

      // Title slide-up + fade
      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        );
      }

      // Divider scale-in from left
      if (dividerRef.current && !noDivider) {
        tl.fromTo(
          dividerRef.current,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.3' // overlap with title
        );
      }
    },
    { scope: containerRef, dependencies: [title, noDivider] }
  );

  return (
    <div ref={containerRef} className={cn('flex items-center gap-2', mb, className)}>
      {/* Accent bar */}
      {accent && (
        <div className="w-0.5 h-4 rounded-full bg-[var(--cyber-green)] shrink-0" />
      )}

      {/* Title */}
      <div ref={titleRef} className="flex items-center gap-2 shrink-0 opacity-0">
        <span className="cyber-label">{title}</span>
        {subtitle && (
          <span className="cyber-label text-[var(--cyber-text-muted)]">
            {subtitle}
          </span>
        )}
      </div>

      {/* Divider */}
      {!noDivider && (
        <div
          ref={dividerRef}
          className="flex-1 h-px bg-[var(--cyber-border)]"
          style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
        />
      )}

      {/* Action */}
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  );
}
