'use client';

// ═══════════════════════════════════════════════════════════════════
// ScrambleText — Reusable "Hacker Decrypt" Display Component
//
// Utopia Tokyo §3: Wraps useScrambleText hook into a drop-in
// component for financial values with kinetic typography.
// ═══════════════════════════════════════════════════════════════════

import { useScrambleText } from '@/hooks/useScrambleText';

interface ScrambleTextProps {
  /** The target text to decrypt into */
  text: string;
  /** Scramble duration in ms (default 500) */
  duration?: number;
  /** Delay before scramble starts in ms (default 0) */
  delay?: number;
  /** Custom character set for scramble glyphs */
  charSet?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function ScrambleText({
  text,
  duration = 500,
  delay = 0,
  charSet,
  className = '',
}: ScrambleTextProps) {
  const { displayText, isComplete } = useScrambleText({
    text,
    duration,
    delay,
    ...(charSet ? { charSet } : {}),
  });

  return (
    <span
      className={className}
      data-scramble-complete={isComplete}
      aria-label={text}
    >
      {displayText}
    </span>
  );
}
