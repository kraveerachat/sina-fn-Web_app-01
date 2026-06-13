'use client';

// ═══════════════════════════════════════════════════════════════════
// LaserLine — vertical timeline progress line
//
// Grows downward as the user scrolls. Animated via GSAP scaleY
// controlled by the parent ScrollTrigger (scrub: true).
// Quiet treatment: a hairline in the debt color, no glow.
// ═══════════════════════════════════════════════════════════════════

import { forwardRef } from 'react';

const LaserLine = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 pointer-events-none z-20">
      <div
        ref={ref}
        className="w-0.5 h-full rounded-full bg-(--red)"
        style={{ transformOrigin: 'top', transform: 'scaleY(0)' }}
      />
    </div>
  );
});

LaserLine.displayName = 'LaserLine';
export default LaserLine;
