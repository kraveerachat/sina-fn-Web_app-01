'use client';

// ═══════════════════════════════════════════════════════════════════
// PulseCanvas — Reactive WebGL Environment  (Utopia Tokyo §1)
//
// A fullscreen custom-shader aurora/fluid background driven by the
// user's financial health_score.
//
// Features implemented per spec:
//  ✓ Custom GLSL vertex + fragment shaders (no PointsMaterial)
//  ✓ Data-driven colour & speed:
//      80-100 → calm neon-green (var(--green)) waves
//      50-79  → moderate gold/cyan blend
//      <50    → aggressive crimson/orange pulses
//  ✓ Mouse-trail distortion (uMouse uniform)
//  ✓ Periodic scanning-line effect (fragment shader)
//  ✓ 60 fps optimised (single fullscreen quad, no overdraw)
//  ✓ Strict TypeScript — zero `any`
//  ✓ Animation logic decoupled into usePulseUniforms hook
// ═══════════════════════════════════════════════════════════════════

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePulseUniforms, createPulseUniforms } from '@/hooks/usePulseUniforms';

// ─────────────────────────────────────────────────────────────────
// GLSL — Vertex  (pass-through + vUv)
// ─────────────────────────────────────────────────────────────────
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────────
// GLSL — Fragment
//
//  • FBM noise layers for organic aurora shapes
//  • Health-score mapped to colour palette + animation speed
//  • Additive mouse-proximity distortion
//  • Horizontal scanning line (time-based)
// ─────────────────────────────────────────────────────────────────
const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uScoreSmooth;   // 0-1 (low = bad, high = healthy)
  uniform vec2  uMouse;         // normalised 0-1
  uniform vec2  uResolution;

  varying vec2 vUv;

  /* ── Simplex-style hash (GPU-friendly) ── */
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  /* ── Gradient noise ── */
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
  }

  /* ── Fractal Brownian Motion (4 octaves) ── */
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2  shift = vec2(100.0);
    mat2  rot   = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p  = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 st = vec2(uv.x * aspect, uv.y);

    /* ── Speed ramps with health (low score = fast) ── */
    float speed = mix(0.8, 0.18, uScoreSmooth);
    float t = uTime * speed;

    /* ── Mouse distortion (subtle warp near cursor) ── */
    vec2 mouseUV = vec2(uMouse.x * aspect, uMouse.y);
    float mouseDist = length(st - mouseUV);
    float mouseWarp = 0.12 / (mouseDist + 0.35);
    st += (st - mouseUV) * mouseWarp * 0.04;

    /* ── Layer 1 — broad aurora flow ── */
    vec2 q = vec2(0.0);
    q.x = fbm(st + vec2(0.0, 0.0) + 0.6 * t);
    q.y = fbm(st + vec2(5.2, 1.3) + 0.5 * t);

    /* ── Layer 2 — fine detail ── */
    vec2 r = vec2(0.0);
    r.x = fbm(st + 4.0 * q + vec2(1.7, 9.2) + 0.35 * t);
    r.y = fbm(st + 4.0 * q + vec2(8.3, 2.8) + 0.40 * t);

    float f = fbm(st + 3.5 * r);

    /* ── Colour palette — health-score driven ── */
    //  Healthy  (score 1.0) → neon green  var(--green) + deep teal
    //  Moderate (score 0.5) → gold / cyan blend
    //  At-risk  (score 0.0) → crimson var(--red) / orange var(--gold)
    vec3 colHealthy = vec3(0.0, 1.0, 0.498);   // var(--green)
    vec3 colTeal    = vec3(0.0, 0.72, 0.76);    // deep teal accent
    vec3 colGold    = vec3(1.0, 0.84, 0.0);     // var(--gold)
    vec3 colCrimson = vec3(1.0, 0.23, 0.23);    // var(--red)
    vec3 colOrange  = vec3(1.0, 0.42, 0.0);     // var(--gold)

    vec3 warm = mix(colCrimson, colOrange, clamp(f * 1.5 + 0.2, 0.0, 1.0));
    vec3 mid  = mix(colGold,   colTeal,   clamp(r.x + 0.4, 0.0, 1.0));
    vec3 cool = mix(colHealthy, colTeal,  clamp(q.y + 0.3, 0.0, 1.0));

    // Blend across the three zones
    vec3 col;
    if (uScoreSmooth < 0.5) {
      col = mix(warm, mid, uScoreSmooth * 2.0);
    } else {
      col = mix(mid, cool, (uScoreSmooth - 0.5) * 2.0);
    }

    // Modulate brightness with the fbm field
    float intensity = clamp(f * f * 3.8 + f * 0.6 + 0.08, 0.0, 1.0);
    col *= intensity;

    /* ── Pulsing intensity for low scores ── */
    float pulse = 1.0 + (1.0 - uScoreSmooth) * 0.25 * sin(uTime * 3.5);
    col *= pulse;

    /* ── Scanning line (horizontal sweep, period ≈ 4s) ── */
    float scanY    = fract(uTime * 0.25);
    float scanDist = abs(uv.y - scanY);
    float scanLine = smoothstep(0.012, 0.0, scanDist);
    // Scan colour: slightly brighter version of the current palette
    vec3 scanCol = col * 1.6 + vec3(0.08);
    col = mix(col, scanCol, scanLine * 0.7);

    // Subtle secondary vertical scan (half speed, thinner)
    float scanX     = fract(uTime * 0.14 + 0.5);
    float scanDistV = abs(uv.x - scanX);
    float scanLineV = smoothstep(0.006, 0.0, scanDistV);
    col = mix(col, scanCol, scanLineV * 0.35);

    /* ── Vignette to focus energy toward centre ── */
    float vignette = 1.0 - length((uv - 0.5) * 1.4);
    vignette = clamp(vignette, 0.0, 1.0);
    col *= vignette;

    /* ── Final alpha (subtle so it doesn't overpower UI) ── */
    float alpha = intensity * vignette * 0.55;

    gl_FragColor = vec4(col, alpha);
  }
`;

// ─────────────────────────────────────────────────────────────────
// AuroraPlane — the fullscreen-quad mesh living inside the Canvas
// ─────────────────────────────────────────────────────────────────
interface AuroraPlaneProps {
  uniforms: ReturnType<typeof createPulseUniforms>;
  tick: (delta: number) => void;
}

function AuroraPlane({ uniforms, tick }: AuroraPlaneProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((_, delta) => {
    tick(delta);
    if (matRef.current) {
      matRef.current.uniformsNeedUpdate = true;
    }
  });

  return (
    <mesh>
      {/* NDC fullscreen quad (-1 to 1) — no camera transform needed */}
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────
// PulseCanvas — exported wrapper
// ─────────────────────────────────────────────────────────────────
interface PulseCanvasProps {
  healthScore: number;
  className?: string;
}

export default function PulseCanvas({ healthScore, className }: PulseCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { uniforms, tick } = usePulseUniforms({
    healthScore,
    containerRef,
  });

  return (
    <div
      ref={containerRef}
      className={`pointer-events-auto select-none ${className ?? ''}`}
    >
      <Canvas
        /* Orthographic-style: the quad is in NDC so no camera needed,
           but R3F requires a camera — place it at origin looking at z=0 */
        camera={{ position: [0, 0, 1], near: 0.1, far: 10 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <AuroraPlane uniforms={uniforms} tick={tick} />
      </Canvas>
    </div>
  );
}
