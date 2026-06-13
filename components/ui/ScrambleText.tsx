'use client';

// ═══════════════════════════════════════════════════════════════════
// ScrambleText — retired decrypt effect, stable display component
//
// The hacker-scramble entrance belonged to the old HUD theme; the
// quiet system shows values immediately and lets count-up (where
// used) carry the entrance instead. The component and its props
// remain so every consumer keeps working unchanged.
// ═══════════════════════════════════════════════════════════════════

interface ScrambleTextProps {
  /** The text to display */
  text: string;
  /** @deprecated Scramble removed; ignored. */
  duration?: number;
  /** @deprecated Scramble removed; ignored. */
  delay?: number;
  /** @deprecated Scramble removed; ignored. */
  charSet?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function ScrambleText({
  text,
  className = '',
}: ScrambleTextProps) {
  return <span className={className}>{text}</span>;
}
