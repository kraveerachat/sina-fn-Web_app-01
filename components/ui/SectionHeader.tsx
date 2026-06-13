'use client';

// ═══════════════════════════════════════════════════════════════════
// SectionHeader — Quiet Section Title
//
// Sentence-case semibold title with tight tracking; optional
// subtitle and right-aligned action. Content is always visible;
// the entrance is a gentle fade-up that never gates visibility.
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

  useGSAP(
    () => {
      if (!containerRef.current || !titleRef.current) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      gsap.fromTo(
        titleRef.current,
        { y: 10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 92%',
            once: true,
          },
        }
      );
    },
    { scope: containerRef, dependencies: [title] }
  );

  return (
    <div
      ref={containerRef}
      className={cn('flex items-baseline justify-between gap-3', mb, className)}
    >
      <div ref={titleRef} className="flex items-baseline gap-2 min-w-0">
        {accent && (
          <span className="self-center w-1.5 h-1.5 rounded-full bg-(--blue) shrink-0" />
        )}
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-(--text) truncate">
          {title}
        </span>
        {subtitle && (
          <span className="text-[12.5px] text-(--text-3) truncate">
            {subtitle}
          </span>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
