'use client';

// ═══════════════════════════════════════════════════════════════════
// useMagnetic — Framer Motion magnetic hover micro-interaction
//
// When the cursor enters the element's bounding box, the element
// subtly shifts toward the pointer, creating a "magnetic" feel.
//
// Usage:
//   const mag = useMagnetic(0.3);
//   <motion.button style={{ x: mag.x, y: mag.y }}
//     onMouseMove={mag.onMouseMove} onMouseLeave={mag.onMouseLeave} />
//
// Utopia Tokyo §2: "Magnetic Micro-interactions"
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'framer-motion';

interface UseMagneticResult {
  x: MotionValue<number>;
  y: MotionValue<number>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

/**
 * @param strength — how far the element can drift (0-1, default 0.25)
 */
export function useMagnetic(strength = 0.25): UseMagneticResult {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const x = useSpring(rawX, { damping: 20, stiffness: 300 });
  const y = useSpring(rawY, { damping: 20, stiffness: 300 });

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rawX.set((e.clientX - cx) * strength);
      rawY.set((e.clientY - cy) * strength);
    },
    [rawX, rawY, strength]
  );

  const onMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { x, y, onMouseMove, onMouseLeave };
}
