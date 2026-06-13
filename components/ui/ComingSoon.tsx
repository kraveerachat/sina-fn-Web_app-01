'use client';

// ═══════════════════════════════════════════════════════════════════
// ComingSoon — quiet "under construction" screen
//
// Shown on unimplemented routes to prevent empty/white screens.
// Clean surface card with a gold lock badge, plain feature list,
// and a route back to the dashboard.
//
// Usage:
//   export default function BudgetsPage() {
//     return <ComingSoon module="Budgets" eta="Phase 3" />;
//   }
// ═══════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ComingSoonProps {
  /** Module name, e.g. "Budgets", "Net Worth" */
  module: string;
  /** Thai name / subtitle */
  moduleTH?: string;
  /** Feature description lines */
  features?: string[];
  /** Phase or ETA label, e.g. "Phase 3", "Q2 2026" */
  eta?: string;
}

const DEFAULT_FEATURES = [
  'ระบบกำลังอยู่ระหว่างการพัฒนา',
  'Feature is under active development',
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-(--border) bg-(--surface) p-8 shadow-(--shadow-lg) text-center">
          {/* Lock badge */}
          <div className="mb-5 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-(--gold-soft)">
              <Lock size={26} className="text-(--gold)" />
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-(--text)">
            {module}
          </h1>
          {moduleTH && (
            <p className="mt-1 text-sm text-(--text-2)">{moduleTH}</p>
          )}

          {/* ETA badge */}
          <div className="mt-3 mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--gold-soft) px-3 py-1 text-[12px] font-semibold text-(--gold)">
              เร็วๆ นี้ · {eta}
            </span>
          </div>

          {/* Feature list */}
          <div className="mb-7 rounded-2xl border border-(--border-2) bg-(--surface-2) p-4 text-left">
            {features.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="py-1 text-[13px] leading-relaxed text-(--text-2)"
              >
                {line}
              </motion.p>
            ))}
          </div>

          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="press tap flex w-full items-center justify-center gap-2 rounded-full border border-(--border) bg-(--surface) py-3 text-sm font-medium text-(--text-2) hover:bg-(--surface-2) hover:text-(--text) transition-colors"
          >
            <ArrowLeft size={14} />
            กลับหน้าหลัก
          </button>
        </div>
      </motion.div>
    </div>
  );
}
