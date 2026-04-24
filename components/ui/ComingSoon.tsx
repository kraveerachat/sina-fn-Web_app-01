'use client';

// ═══════════════════════════════════════════════════════════════════
// ComingSoon — Locked Terminal Module Screen
//
// Shown on unimplemented routes to prevent empty/white screens.
// Design: HUD terminal with "MODULE LOCKED" aesthetic, scanning
// animation, and a clear ETA / status message.
//
// Usage:
//   export default function BudgetsPage() {
//     return <ComingSoon module="BUDGETS" eta="Phase 3" />;
//   }
// ═══════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ComingSoonProps {
  /** Module name shown in HUD header, e.g. "BUDGETS", "NET WORTH" */
  module: string;
  /** Thai name / subtitle */
  moduleTH?: string;
  /** Feature description lines shown in the terminal */
  features?: string[];
  /** Phase or ETA label, e.g. "Phase 3", "Q2 2026" */
  eta?: string;
}

const DEFAULT_FEATURES = [
  'ระบบกำลังอยู่ระหว่างการพัฒนา',
  'Feature is under active development',
  'Data schema ready → UI implementation pending',
];

export default function ComingSoon({
  module,
  moduleTH,
  features = DEFAULT_FEATURES,
  eta = 'Phase 3',
}: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        {/* ── Outer HUD frame ── */}
        <div className="border border-[var(--cyber-border)] bg-[var(--cyber-surface)] relative">
          {/* Corner accents */}
          <span className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[var(--cyber-green)] pointer-events-none" />
          <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[var(--cyber-green)] pointer-events-none" />
          <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[var(--cyber-green)] pointer-events-none" />
          <span className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[var(--cyber-green)] pointer-events-none" />

          {/* Status bar */}
          <div className="flex items-center justify-between border-b border-[var(--cyber-border)] px-5 py-2 bg-[var(--cyber-bg)]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[var(--cyber-amber)] status-blip" />
              <span className="cyber-label text-[var(--cyber-amber)]">
                MODULE LOCKED // {module}
              </span>
            </div>
            <span className="cyber-label text-[var(--cyber-text-muted)]">ETA: {eta}</span>
          </div>

          {/* Main content */}
          <div className="p-8 space-y-7">
            {/* Lock icon with scanning pulse */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Scan ring animation */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 border border-[var(--cyber-amber)] rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.7, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                  className="absolute inset-0 border border-[var(--cyber-amber)]/50 rounded-full"
                />
                {/* Icon box */}
                <div className="w-20 h-20 border border-[var(--cyber-amber)]/40 bg-[var(--cyber-amber)]/5 flex items-center justify-center">
                  <Lock size={32} className="text-[var(--cyber-amber)]" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold font-mono tracking-[5px] text-[var(--cyber-text)] uppercase"
              >
                {module}
              </motion.h1>
              {moduleTH && (
                <p className="text-sm text-[var(--cyber-text-secondary)]">{moduleTH}</p>
              )}
            </div>

            {/* Terminal output box */}
            <div className="border border-[var(--cyber-border)] bg-[var(--cyber-bg)] p-4 space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--cyber-border)]">
                <Terminal size={12} className="text-[var(--cyber-green)]" />
                <span className="cyber-label text-[var(--cyber-green)]">TERMINAL OUTPUT</span>
              </div>
              {features.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  className="flex items-start gap-2 text-xs font-mono"
                >
                  <span className="text-[var(--cyber-green)] shrink-0 mt-0.5">›</span>
                  <span className="text-[var(--cyber-text-secondary)]">{line}</span>
                </motion.div>
              ))}
              {/* Blinking cursor at end */}
              <div className="flex items-center gap-2 text-xs font-mono pt-1">
                <span className="text-[var(--cyber-green)]">›</span>
                <span className="inline-block w-1.5 h-3 bg-[var(--cyber-green)] animate-pulse" />
              </div>
            </div>

            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="cyber-label">DEVELOPMENT PROGRESS</span>
                <span className="cyber-label text-[var(--cyber-amber)]">IN QUEUE</span>
              </div>
              {/* Animated scanning bar */}
              <div className="h-1 bg-[var(--cyber-surface-alt)] border border-[var(--cyber-border)] overflow-hidden">
                <motion.div
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    repeatDelay: 0.5,
                  }}
                  className="h-full w-1/3 bg-linear-to-r from-transparent via-[var(--cyber-amber)] to-transparent"
                />
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => router.push('/')}
              className="
                w-full flex items-center justify-center gap-2
                py-3 border border-[var(--cyber-border)]
                bg-[var(--cyber-surface-alt)] hover:bg-[var(--cyber-border)]
                text-[var(--cyber-text-secondary)] hover:text-[var(--cyber-text)]
                font-mono text-xs tracking-[3px] uppercase
                transition-all duration-200
              "
            >
              <ArrowLeft size={13} />
              BACK TO DASHBOARD
            </button>
          </div>
        </div>

        <p className="cyber-label text-center text-[var(--cyber-text-muted)]/40 mt-4 tracking-[3px]">
          SINA_FN // MODULE UNDER CONSTRUCTION
        </p>
      </motion.div>
    </div>
  );
}
