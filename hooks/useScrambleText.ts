'use client';

// ═══════════════════════════════════════════════════════════════════
// useScrambleText — "Hacker Decrypt" Effect Hook
//
// Utopia Tokyo §3: Rapidly cycles through random characters before
// locking into the real value. Uses rAF for 60fps performance.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';

/** Characters used during the scramble — financial / numeric aesthetic */
const DEFAULT_CHAR_SET = '0123456789฿,.+-';

interface UseScrambleTextOptions {
  /** Target text to resolve to */
  text: string;
  /** Duration of the scramble in milliseconds (default 500) */
  duration?: number;
  /** Delay before starting the scramble in milliseconds (default 0) */
  delay?: number;
  /** Custom character set for scramble glyphs */
  charSet?: string;
  /** Characters to preserve (never scramble). Defaults to currency/sign chars */
  preserveChars?: string;
}

interface UseScrambleTextReturn {
  /** The current display text (scrambled or resolved) */
  displayText: string;
  /** Whether the scramble has completed */
  isComplete: boolean;
}

/**
 * Simulates a hacker-style decryption effect on text.
 * Characters resolve progressively from left to right while
 * remaining characters cycle through random glyphs.
 */
export function useScrambleText({
  text,
  duration = 500,
  delay = 0,
  charSet = DEFAULT_CHAR_SET,
  preserveChars = '฿$€¥£+- ,.',
}: UseScrambleTextOptions): UseScrambleTextReturn {
  const [displayText, setDisplayText] = useState(() =>
    // Initial state: show scrambled version immediately (no flash of real text)
    text
      .split('')
      .map((ch) =>
        preserveChars.includes(ch) || ch === ' '
          ? ch
          : charSet[Math.floor(Math.random() * charSet.length)]
      )
      .join('')
  );
  const [isComplete, setIsComplete] = useState(false);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const hasStartedRef = useRef(false);

  const getRandomChar = useCallback(
    () => charSet[Math.floor(Math.random() * charSet.length)],
    [charSet]
  );

  useEffect(() => {
    // Reset on text change
    setIsComplete(false);
    hasStartedRef.current = false;

    const delayTimer = window.setTimeout(() => {
      hasStartedRef.current = true;
      startTimeRef.current = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Number of characters that have "resolved" so far
        // Progressive reveal: left-to-right
        const resolvedCount = Math.floor(progress * text.length);

        const result = text.split('').map((ch, i) => {
          // Always preserve special characters
          if (preserveChars.includes(ch) || ch === ' ') return ch;
          // Already resolved
          if (i < resolvedCount) return ch;
          // Still scrambling
          return getRandomChar();
        });

        setDisplayText(result.join(''));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          // Final lock — ensure exact text
          setDisplayText(text);
          setIsComplete(true);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      window.clearTimeout(delayTimer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [text, duration, delay, charSet, preserveChars, getRandomChar]);

  return { displayText, isComplete };
}
