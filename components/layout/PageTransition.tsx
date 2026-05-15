'use client';

// ═══════════════════════════════════════════════════════════════════
// PageTransition — "Suck Back & Warp" 3D Navigation Effect
//
// On route change the outgoing page shrinks (scale → 0),
// pushes into the Z-axis (translateZ → –800px), and fades out.
// The incoming page pops forward from the same warped state.
//
// Uses CSS `perspective` on the wrapper + Framer Motion `AnimatePresence`
// keyed by pathname so each route swap triggers the full sequence.
// ═══════════════════════════════════════════════════════════════════

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

const TRANSITION_DURATION = 0.45;

const pageVariants: Variants = {
  // Starting state (entering from warp)
  initial: {
    opacity: 0,
    scale: 0.85,
    z: -400,
    rotateX: 8,
    filter: 'blur(6px)',
  },
  // Fully visible
  animate: {
    opacity: 1,
    scale: 1,
    z: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      duration: TRANSITION_DURATION,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  // Exiting — suck back into the void
  exit: {
    opacity: 0,
    scale: 0.85,
    z: -400,
    rotateX: -6,
    filter: 'blur(8px)',
    transition: {
      duration: TRANSITION_DURATION * 0.8,
      ease: [0.55, 0, 1, 0.45] as [number, number, number, number],
    },
  },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 50%',
      }}
      className="flex-1 relative"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: '50% 50%',
            willChange: 'transform, opacity, filter',
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
