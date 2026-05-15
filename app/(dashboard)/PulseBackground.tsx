'use client';

// ═══════════════════════════════════════════════════════════════════
// PulseBackground — Dynamic-imported wrapper for PulseCanvas
//
// Satisfies Utopia Tokyo §5 constraint: "WebGL components must be
// isolated and imported dynamically with ssr: false."
// ═══════════════════════════════════════════════════════════════════

import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { useHealthScore } from '@/hooks/useHealthScore';

const PulseCanvas = dynamic(() => import('@/components/pulse/PulseCanvas'), {
  ssr: false,
});

export default function PulseBackground() {
  const { user } = useAuth();
  const { healthScore } = useHealthScore(user?.id);

  return (
    <PulseCanvas
      healthScore={healthScore}
      className="fixed inset-0 z-0"
    />
  );
}
