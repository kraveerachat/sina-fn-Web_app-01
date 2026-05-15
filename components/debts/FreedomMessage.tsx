'use client';

// ═══════════════════════════════════════════════════════════════════
// FreedomMessage — The Triumphant Reveal
//
// Shows "FINANCIAL FREEDOM UNLOCKED" with useScrambleText after
// all debts have been destroyed. Fades in via GSAP from parent.
// ═══════════════════════════════════════════════════════════════════

import { forwardRef, useState } from 'react';
import { useScrambleText } from '@/hooks/useScrambleText';
import { ShieldCheck } from 'lucide-react';

const FreedomMessage = forwardRef<HTMLDivElement>((_, ref) => {
  const [active, setActive] = useState(false);

  const { displayText } = useScrambleText({
    text: 'FINANCIAL FREEDOM UNLOCKED',
    duration: 1200,
    delay: 0,
    charSet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&',
  });

  // Parent will set data-active="true" to trigger the scramble
  // We use a MutationObserver-free approach: the parent sets opacity via GSAP,
  // and we always render the scramble (it looks cool even pre-reveal)

  return (
    <div
      ref={ref}
      className="freedom-message flex flex-col items-center justify-center gap-6 opacity-0"
    >
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/30 flex items-center justify-center shadow-[0_0_40px_var(--cyber-green-glow)]">
        <ShieldCheck size={36} className="text-[var(--cyber-green)]" />
      </div>

      {/* Main title */}
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-mono text-center text-[var(--cyber-green)] tracking-wider leading-tight drop-shadow-[0_0_30px_var(--cyber-green-glow)]">
        {displayText}
      </h1>

      {/* Subtitle */}
      <p className="text-sm md:text-base font-mono text-[var(--cyber-green)]/60 uppercase tracking-[6px]">
        All debts eliminated
      </p>

      {/* Decorative line */}
      <div className="w-32 h-px bg-gradient-to-r from-transparent via-[var(--cyber-green)] to-transparent" />
    </div>
  );
});

FreedomMessage.displayName = 'FreedomMessage';
export default FreedomMessage;
