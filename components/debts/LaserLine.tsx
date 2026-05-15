'use client';

// ═══════════════════════════════════════════════════════════════════
// LaserLine — Vertical Glowing Slash Line
//
// Grows downward as the user scrolls. Animated via GSAP scaleY
// controlled by the parent ScrollTrigger (scrub: true).
// ═══════════════════════════════════════════════════════════════════

import { forwardRef } from 'react';

const LaserLine = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 pointer-events-none z-20">
      {/* The laser beam */}
      <div
        ref={ref}
        className="w-1 h-full bg-red-500 rounded-full shadow-[0_0_15px_red,0_0_40px_rgba(239,68,68,0.4),0_0_80px_rgba(239,68,68,0.15)]"
        style={{ transformOrigin: 'top', transform: 'scaleY(0)' }}
      />
      {/* Tip glow — sits at the bottom of the visible laser */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400/60 blur-md"
        style={{ bottom: 0 }}
      />
    </div>
  );
});

LaserLine.displayName = 'LaserLine';
export default LaserLine;
