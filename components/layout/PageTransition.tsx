'use client';

// ═══════════════════════════════════════════════════════════════════
// PageTransition — quiet crossfade + rise
//
// Routes swap with a 250ms fade and a 10px rise; users are in a
// task, so the transition reads as responsiveness, not choreography.
// ═══════════════════════════════════════════════════════════════════

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 relative">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
