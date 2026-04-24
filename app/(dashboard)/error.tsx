'use client';

// ═══════════════════════════════════════════════════════════════════
// app/(dashboard)/error.tsx — Next.js Error Boundary File
//
// This file is automatically used by Next.js App Router for the
// entire (dashboard) route segment. Activated on unhandled errors.
//
// Props from Next.js:
//   error — the Error object thrown
//   reset  — function to attempt re-rendering the failed segment
// ═══════════════════════════════════════════════════════════════════

import { CyberErrorFallback } from '@/components/ui/CyberErrorBoundary';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <CyberErrorFallback
      error={error}
      onRetry={reset}
      module="DASHBOARD"
    />
  );
}
