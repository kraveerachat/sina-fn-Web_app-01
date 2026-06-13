'use client';

// ═══════════════════════════════════════════════════════════════════
// CyberErrorFallback — quiet error screen
//
// Displayed when a React Error Boundary catches a runtime error.
// Clean surface card, plain language, retry + home actions.
// It is also used as the fallback for Next.js error.tsx files.
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import { RotateCcw, Home, AlertTriangle } from 'lucide-react';

interface FallbackProps {
  error?: Error | null;
  onRetry?: () => void;
  /** Module label included in the console log (e.g. "DASHBOARD") */
  module?: string;
}

export function CyberErrorFallback({ error, onRetry }: FallbackProps) {
  const errorCode = error?.name ?? 'RUNTIME_ERROR';
  const errorMsg = error?.message ?? 'An unexpected error occurred.';

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg rounded-3xl border border-(--border) bg-(--surface) p-8 shadow-(--shadow-lg)">
        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-(--red-soft)">
            <AlertTriangle size={26} className="text-(--red)" />
          </span>
        </div>

        {/* Title */}
        <div className="mb-5 text-center">
          <h2 className="text-xl font-semibold tracking-[-0.01em] text-(--text)">
            เกิดข้อผิดพลาด
          </h2>
          <p className="mt-1 text-[13px] text-(--text-3)">{errorCode}</p>
        </div>

        {/* Error message */}
        <div className="mb-6 rounded-2xl border border-(--border-2) bg-(--surface-2) p-4">
          <p className="break-words font-mono text-xs leading-relaxed text-(--text-2)">
            {errorMsg}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {onRetry && (
            <button
              onClick={onRetry}
              className="press tap flex flex-1 items-center justify-center gap-2 rounded-full bg-(--blue) py-3 text-sm font-semibold text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--blue)_35%,transparent)] hover:brightness-108 transition-all"
            >
              <RotateCcw size={14} />
              ลองอีกครั้ง
            </button>
          )}
          <button
            onClick={() => (window.location.href = '/')}
            className="press tap flex flex-1 items-center justify-center gap-2 rounded-full border border-(--border) bg-(--surface) py-3 text-sm font-medium text-(--text-2) hover:bg-(--surface-2) hover:text-(--text) transition-colors"
          >
            <Home size={14} />
            กลับหน้าหลัก
          </button>
        </div>
      </div>
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
  /** Module label for the error log */
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
