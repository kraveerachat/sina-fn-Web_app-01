'use client';

// ═══════════════════════════════════════════════════════════════════
// useHolographicTilt — 3D Interactive Card Tilt + Sheen
//
// Utopia Tokyo §2/§4: Mouse-driven perspective tilt with a radial
// gradient sheen that follows the cursor. Uses GSAP for smooth
// reset animation on mouse leave.
// ═══════════════════════════════════════════════════════════════════

import { useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

interface TiltState {
  rotateX: number;
  rotateY: number;
  sheenX: number;
  sheenY: number;
  isHovering: boolean;
}

interface UseHolographicTiltOptions {
  /** Maximum tilt angle in degrees (default 8) */
  maxTilt?: number;
  /** Transition speed for CSS transform in seconds (default 0.1) */
  speed?: number;
  /** Sheen color (default rgba(139,140,248,0.08)) */
  sheenColor?: string;
  /** Glow border color (default rgba(139,140,248,0.15)) */
  glowColor?: string;
}

interface UseHolographicTiltReturn<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  /** Inline style for the card (transform) */
  cardStyle: React.CSSProperties;
  /** Inline style for the sheen overlay */
  sheenStyle: React.CSSProperties;
  /** Inline style for the glow border */
  glowStyle: React.CSSProperties;
  onMouseMove: (e: React.MouseEvent<T>) => void;
  onMouseLeave: () => void;
}

export function useHolographicTilt<T extends HTMLElement = HTMLDivElement>({
  maxTilt = 8,
  speed = 0.1,
  sheenColor = 'rgba(139, 140, 248, 0.08)',
  glowColor = 'rgba(139, 140, 248, 0.15)',
}: UseHolographicTiltOptions = {}): UseHolographicTiltReturn<T> {
  const ref = useRef<T | null>(null);
  const [tilt, setTilt] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    sheenX: 50,
    sheenY: 50,
    isHovering: false,
  });

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalized offset from center (-1 to 1)
      const offsetX = (e.clientX - centerX) / (rect.width / 2);
      const offsetY = (e.clientY - centerY) / (rect.height / 2);

      // Tilt: rotateX is driven by Y-axis offset (inverted), rotateY by X-axis
      const rotateX = -offsetY * maxTilt;
      const rotateY = offsetX * maxTilt;

      // Sheen position as percentage (0-100)
      const sheenX = ((e.clientX - rect.left) / rect.width) * 100;
      const sheenY = ((e.clientY - rect.top) / rect.height) * 100;

      setTilt({ rotateX, rotateY, sheenX, sheenY, isHovering: true });
    },
    [maxTilt]
  );

  const onMouseLeave = useCallback(() => {
    setTilt((prev) => ({ ...prev, isHovering: false }));

    // Smooth GSAP reset
    const el = ref.current;
    if (el) {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: true,
      });
    }

    // Reset state after GSAP handles the visual transition
    setTimeout(() => {
      setTilt({ rotateX: 0, rotateY: 0, sheenX: 50, sheenY: 50, isHovering: false });
    }, 500);
  }, []);

  const cardStyle: React.CSSProperties = tilt.isHovering
    ? {
        transform: `perspective(600px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: `transform ${speed}s ease-out`,
        transformStyle: 'preserve-3d' as const,
        willChange: 'transform',
      }
    : {
        transformStyle: 'preserve-3d' as const,
        willChange: 'transform',
      };

  const sheenStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
    opacity: tilt.isHovering ? 1 : 0,
    background: `radial-gradient(circle at ${tilt.sheenX}% ${tilt.sheenY}%, ${sheenColor} 0%, transparent 60%)`,
    transition: 'opacity 0.3s ease',
  };

  const glowStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
    border: `1px solid ${tilt.isHovering ? glowColor : 'transparent'}`,
    boxShadow: tilt.isHovering
      ? `inset 0 0 24px ${sheenColor}, 0 0 16px ${sheenColor}`
      : 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  return { ref, cardStyle, sheenStyle, glowStyle, onMouseMove, onMouseLeave };
}
