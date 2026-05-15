'use client';

// ═══════════════════════════════════════════════════════════════════
// usePulseUniforms — Decoupled animation-state hook for PulseCanvas
//
// Manages all Three.js uniform values (time, mouse, health score)
// outside the render loop. The Canvas component reads from the ref
// each frame without triggering React re-renders.
//
// Satisfies Utopia Tokyo constraint §4: "Animation logic must be
// strictly decoupled from business logic."
// ═══════════════════════════════════════════════════════════════════

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

// ── Strict interface for every uniform the shader consumes ──
// Index signature required by Three.js ShaderMaterial uniform map.
export interface PulseUniforms {
  [key: string]: THREE.IUniform<number> | THREE.IUniform<THREE.Vector2>;
  uTime:        THREE.IUniform<number>;
  uHealthScore: THREE.IUniform<number>;
  uMouse:       THREE.IUniform<THREE.Vector2>;
  uResolution:  THREE.IUniform<THREE.Vector2>;
  /** Smoothed score that lerps toward the target each frame */
  uScoreSmooth: THREE.IUniform<number>;
}

/** Creates the initial uniform object (call once, keep the ref). */
export function createPulseUniforms(): PulseUniforms {
  return {
    uTime:        { value: 0 },
    uHealthScore: { value: 0.5 },
    uMouse:       { value: new THREE.Vector2(0.5, 0.5) },
    uResolution:  { value: new THREE.Vector2(1, 1) },
    uScoreSmooth: { value: 0.5 },
  };
}

interface UsePulseUniformsArgs {
  healthScore: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook that wires pointer-move and resize listeners to a stable
 * uniforms ref.  Returns the uniforms object and a `tick(delta)`
 * callback the render loop calls every frame.
 */
export function usePulseUniforms({ healthScore, containerRef }: UsePulseUniformsArgs) {
  const uniforms = useRef<PulseUniforms>(createPulseUniforms());

  // Keep the raw score target in sync
  useEffect(() => {
    uniforms.current.uHealthScore.value = healthScore / 100;
  }, [healthScore]);

  // ── Pointer tracking (normalised 0-1) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      uniforms.current.uMouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height, // flip Y for GL
      );
    };
    el.addEventListener('pointermove', onMove, { passive: true });
    return () => el.removeEventListener('pointermove', onMove);
  }, [containerRef]);

  // ── Resolution tracking ──
  useEffect(() => {
    const update = () => {
      uniforms.current.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Per-frame tick (called from useFrame inside Canvas) ──
  const tick = useCallback((delta: number) => {
    const u = uniforms.current;
    u.uTime.value += delta;

    // Smooth the score so colour transitions feel fluid
    const target = u.uHealthScore.value;
    u.uScoreSmooth.value += (target - u.uScoreSmooth.value) * Math.min(delta * 1.5, 1);
  }, []);

  return { uniforms: uniforms.current, tick };
}
