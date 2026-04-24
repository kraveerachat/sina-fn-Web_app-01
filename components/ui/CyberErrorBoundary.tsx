'use client';

// ═══════════════════════════════════════════════════════════════════
// CyberErrorFallback — Brutalist Error Screen
//
// Displayed when a React Error Boundary catches a runtime error.
// Features: glitch animation, error code display, retry button.
//
// It is also used as the fallback for Next.js error.tsx files.
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Home, AlertTriangle } from 'lucide-react';

interface FallbackProps {
  error?: Error | null;
  onRetry?: () => void;
  /** Module label shown in the HUD header (e.g. "DASHBOARD", "HISTORY") */
  module?: string;
}

// ── Animation config objects (not Variants — inline use only) ──
const glitchAnimate = {
  x: [0, -3, 3, -3, 0, 2, -2, 0],
  skewX: [0, -2, 2, 0, 0],
};
const glitchTransition = {
  duration: 0.6,
  ease: 'easeInOut' as const,
  repeat: Infinity,
  repeatDelay: 3,
};

const glitchRedAnimate = {
  x: [0, 3, -3, 2, -2, 0],
  opacity: [0, 0.8, 0, 0.6, 0, 0],
};
const glitchRedTransition = {
  duration: 0.6,
  ease: 'easeInOut' as const,
  repeat: Infinity,
  repeatDelay: 3,
};

export function CyberErrorFallback({ error, onRetry, module = 'MODULE' }: FallbackProps) {
  const errorCode = error?.name ?? 'RUNTIME_ERROR';
  const errorMsg  = error?.message ?? 'An unexpected error occurred.';

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      {/* Outer HUD frame — 90° corners */}
      <div className="w-full max-w-lg border border-[var(--cyber-red)]/40 bg-[var(--cyber-surface)] relative">

        {/* Corner accents — red variant */}
        <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[var(--cyber-red)] pointer-events-none" />
        <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[var(--cyber-red)] pointer-events-none" />
        <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[var(--cyber-red)] pointer-events-none" />
        <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[var(--cyber-red)] pointer-events-none" />

        {/* HUD status bar */}
        <div className="flex items-center justify-between border-b border-[var(--cyber-red)]/30 px-5 py-2 bg-[var(--cyber-red)]/5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-red)] status-blip" />
            <span className="cyber-label text-[var(--cyber-red)]">SYSTEM FAULT // {module}</span>
          </div>
          <span className="cyber-label text-[var(--cyber-text-muted)]">
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Main content */}
        <div className="p-8 space-y-6">
          {/* Glitch icon */}
          <div className="flex justify-center relative h-16">
            {/* Main icon */}
            <motion.div
              animate={glitchAnimate}
              transition={glitchTransition}
              className="absolute"
            >
              <AlertTriangle size={52} className="text-[var(--cyber-red)]" />
            </motion.div>
            {/* Red chromatic aberration layer */}
            <motion.div
              animate={glitchRedAnimate}
              transition={glitchRedTransition}
              className="absolute"
              style={{ color: 'var(--cyber-red)', mixBlendMode: 'screen', transform: 'translate(3px, 1px)' }}
            >
              <AlertTriangle size={52} />
            </motion.div>
          </div>

          {/* Error title — glitch text */}
          <div className="text-center space-y-2">
            <div className="relative inline-block">
              <motion.h2
                animate={glitchAnimate}
                transition={glitchTransition}
                className="text-3xl font-bold font-mono tracking-[4px] text-[var(--cyber-red)] uppercase"
              >
                CRITICAL ERROR
              </motion.h2>
            </div>
            <p className="cyber-label text-[var(--cyber-text-secondary)]">
              {errorCode}
            </p>
          </div>

          {/* Error message in terminal box */}
          <div className="border border-[var(--cyber-border)] bg-[var(--cyber-bg)] p-4 font-mono text-xs">
            <span className="text-[var(--cyber-red)]">&gt; </span>
            <span className="text-[var(--cyber-text)]">{errorMsg}</span>
            <span className="inline-block w-1.5 h-3 bg-[var(--cyber-text)] ml-0.5 animate-pulse" />
          </div>

          {/* Diagnostic lines */}
          <div className="space-y-1.5 py-2 border-y border-[var(--cyber-border)]">
            {[
              ['STATUS',   'FATAL — COMPONENT TREE CRASHED'],
              ['ACTION',   'BOUNDARY CAUGHT & ISOLATED'],
              ['RECOVERY', 'RETRY AVAILABLE'],
            ].map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="cyber-label text-[var(--cyber-text-muted)] w-20 shrink-0">{key}</span>
                <span className="h-px flex-1 bg-[var(--cyber-border)]" />
                <span className="cyber-label text-[var(--cyber-text)]">{val}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="
                  flex-1 flex items-center justify-center gap-2
                  py-3 rounded-none font-mono text-xs tracking-[3px] uppercase
                  border border-[var(--cyber-green)] text-[var(--cyber-green)]
                  bg-[var(--cyber-green)]/5
                  hover:bg-[var(--cyber-green)]/10
                  transition-all duration-200
                  shadow-[0_0_12px_var(--cyber-green-glow)]
                "
              >
                <RotateCcw size={13} />
                RETRY SYSTEM
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="
                flex-1 flex items-center justify-center gap-2
                py-3 rounded-none font-mono text-xs tracking-[3px] uppercase
                border border-[var(--cyber-border)] text-[var(--cyber-text-secondary)]
                bg-[var(--cyber-surface-alt)]
                hover:text-[var(--cyber-text)] hover:border-[var(--cyber-text-muted)]
                transition-all duration-200
              "
            >
              <Home size={13} />
              DASHBOARD
            </button>
          </div>
        </div>
      </div>

      {/* Scan line decoration */}
      <p className="cyber-label text-[var(--cyber-text-muted)]/40 mt-6 tracking-[4px]">
        SINA_FN // ERROR ISOLATION ACTIVE
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CyberErrorBoundary — React Class Error Boundary
//
// React Error Boundaries MUST be class components.
// Wrap any subtree that might throw to prevent full-page crashes.
//
// Usage:
//   <CyberErrorBoundary module="WALLETS">
//     <WalletsPage />
//   </CyberErrorBoundary>
// ═══════════════════════════════════════════════════════════════════

interface BoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI — overrides the default CyberErrorFallback */
  fallback?: React.ReactNode;
  /** Module label for the error screen header */
  module?: string;
}

interface BoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class CyberErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[CyberErrorBoundary:${this.props.module ?? 'UNKNOWN'}]`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <CyberErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          module={this.props.module}
        />
      );
    }
    return this.props.children;
  }
}
