'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/store/appStore';

/* ─── Design Tokens ─────────────────────────────────────────────────────── */
const T = {
  bg:    '#080B0F',
  bg2:   '#0D1017',
  panel: '#111720',
  dim:   '#151E2C',
  brd:   '#1C2840',
  brd2:  '#243352',
  green: '#00E676',
  red:   '#FF3B3B',
  amber: '#FFB300',
  text:  '#B8C8DF',
  muted: '#3A4E68',
  white: '#E8F0FF',
};

/* ─── Global CSS injection ─────────────────────────────────────────────── */
function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Share+Tech+Mono&display=swap');

      /* ── Core animations ── */
      @keyframes glitchText {
        0%,82%,100% { text-shadow: 0 0 50px ${T.green}60; transform: none; }
        83% { text-shadow: -5px 0 ${T.red}CC, 5px 0 #0088ffCC; transform: skewX(-4deg); }
        84% { text-shadow: 4px 0 ${T.red}CC, -4px 0 #0088ffCC; transform: skewX(2deg); }
        85% { text-shadow: 0 0 50px ${T.green}60; transform: none; }
        86% { text-shadow: -3px 0 ${T.red}99, 3px 0 #0088ff99; transform: skewX(-1deg); }
        87% { text-shadow: 0 0 50px ${T.green}60; }
      }
      @keyframes blink { 50% { opacity: 0; } }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%     { transform: translateX(-10px); }
        40%     { transform: translateX(10px); }
        60%     { transform: translateX(-7px); }
        80%     { transform: translateX(6px); }
      }
      @keyframes pinPop {
        0%  { transform: scale(0.2); opacity: 0; }
        65% { transform: scale(1.3); }
        100%{ transform: scale(1);   opacity: 1; }
      }
      @keyframes scanBeam {
        from { top: -3px; opacity: 0.8; }
        to   { top: 100%;  opacity: 0;   }
      }
      @keyframes progressFill {
        from { width: 0%; }
        to   { width: 100%; }
      }
      @keyframes bootLine {
        from { opacity: 0; transform: translateX(-8px); }
        to   { opacity: 1; transform: translateX(0);   }
      }
      @keyframes accessFlash {
        0%,100% { opacity: 0; }
        40%     { opacity: 0.5; }
      }
      @keyframes scanlineMove {
        from { background-position: 0 0; }
        to   { background-position: 0 100px; }
      }
      @keyframes cornerPulse {
        0%,100% { opacity: 0.4; }
        50%     { opacity: 1;   }
      }

      .glitch-text  { animation: glitchText 8s infinite; }
      .blink        { animation: blink 1s step-end infinite; }

      /* ── Scanlines ── */
      .scanlines {
        position: relative;
        overflow: hidden;
      }
      .scanlines::after {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          to bottom,
          transparent 0, transparent 3px,
          rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px
        );
        pointer-events: none;
        z-index: 9;
      }

      /* ── Dot grid bg ── */
      .dot-grid {
        background-image:
          radial-gradient(circle, ${T.brd} 1px, transparent 1px);
        background-size: 32px 32px;
      }

      /* ── HUD corner brackets (applied to container) ── */
      .hud-frame { position: relative; }
      .hud-frame::before,
      .hud-frame::after {
        content: '';
        position: absolute;
        width: 18px; height: 18px;
        border-color: ${T.green};
        border-style: solid;
        animation: cornerPulse 3s ease-in-out infinite;
      }
      .hud-frame::before { top: 0; left: 0; border-width: 2px 0 0 2px; }
      .hud-frame::after  { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

      /* ── Scan beam ── */
      .scan-beam {
        position: absolute;
        left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg,
          transparent 0%,
          ${T.green}30 20%,
          ${T.green}80 50%,
          ${T.green}30 80%,
          transparent 100%
        );
        animation: scanBeam 6s linear infinite;
        pointer-events: none;
        z-index: 8;
      }

      /* ── Neon text ── */
      .neon-g { color: ${T.green}; text-shadow: 0 0 20px ${T.green}70; }
      .neon-r { color: ${T.red};   text-shadow: 0 0 20px ${T.red}70; }

      /* ── Clip-angle utility ── */
      .clip-ang-sm { clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
      .clip-ang-md { clip-path: polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%); }

      /* ── CTA button ── */
      .cta-btn {
        position: relative;
        background: transparent;
        border: 1px solid ${T.green};
        color: ${T.green};
        cursor: pointer;
        font-family: 'Orbitron', monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.3em;
        padding: 16px 52px;
        text-transform: uppercase;
        transition: all 0.25s;
        overflow: hidden;
        clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
      }
      .cta-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: ${T.green};
        transform: translateX(-105%);
        transition: transform 0.3s ease;
        z-index: 0;
      }
      .cta-btn:hover { color: ${T.bg}; box-shadow: 0 0 40px ${T.green}50; }
      .cta-btn:hover::before { transform: translateX(0); }
      .cta-btn span { position: relative; z-index: 1; }

      /* ── Numpad button ── */
      .num-btn {
        background: ${T.panel};
        border: 1px solid ${T.brd};
        color: ${T.text};
        cursor: pointer;
        font-family: 'Orbitron', monospace;
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 66px;
        border-radius: 4px;
        transition: all 0.12s;
        user-select: none;
        letter-spacing: 0.05em;
      }
      .num-btn:hover {
        background: ${T.dim};
        border-color: ${T.green}60;
        color: ${T.green};
        box-shadow: 0 0 12px ${T.green}15 inset;
      }
      .num-btn:active {
        background: rgba(0,230,118,0.1);
        border-color: ${T.green};
        color: ${T.green};
        transform: scale(0.92);
        box-shadow: 0 0 20px ${T.green}25 inset;
      }
      .num-btn.del-btn:hover { color: ${T.red}; border-color: ${T.red}60; }

      /* ── Transition overlay ── */
      .flash-overlay {
        position: fixed;
        inset: 0;
        background: ${T.green};
        z-index: 1000;
        pointer-events: none;
        animation: accessFlash 0.8s ease-out forwards;
      }

      /* ── Screen fade ── */
      .screen-enter { animation: fadeIn 0.5s ease forwards; }

      .immersive-container {
        font-family: 'Share Tech Mono', monospace;
        background: transparent;
        color: ${T.text};
      }
    `}</style>
  );
}

/* ─── Boot Lines data ─────────────────────────────────────────────────── */
const BOOT_LINES = [
  'SINA_FN OS v4.0.0 — FINANCIAL INTELLIGENCE SYSTEM',
  'Initializing memory subsystem ............... [OK]',
  'Loading encryption module (AES-256-GCM) ..... [OK]',
  'Mounting secure wallet store ................ [OK]',
  'Connecting to Supabase cloud sync ........... [OK]',
  'Verifying integrity checksums ............... [OK]',
  'Loading transaction parser (Gemini AI) ...... [OK]',
  'Establishing secure session ................. [OK]',
  'Identity module ready — awaiting auth ........ [OK]',
  '',
  '>>> BOOT COMPLETE. INITIATING USER AUTHENTICATION <<<',
];

interface BootScreenProps {
  onDone: () => void;
}

/* ════════════════════════════════════════════════════════════════════════
 *  REDESIGNED: MoneySwarm — Symmetric Bilateral Comet
 * ════════════════════════════════════════════════════════════════════════
 *
 *  Design goals
 *  ────────────
 *  1. SYMMETRY  — every particle has a mirror counterpart reflected across
 *     the mouse-movement axis, so the swarm always looks balanced.
 *  2. DUAL TAILS — instead of one trailing comet, two symmetric tails fan
 *     outward behind the cursor, creating a "butterfly / manta-ray" shape.
 *  3. NUCLEUS GLOW — a bright, pulsing core cluster sits exactly at the
 *     mouse position and is always centered regardless of movement speed.
 *  4. CLEAN IDLE — when the mouse is still / off-screen, particles drift
 *     to evenly-spaced home positions forming a soft radial cloud.
 *  5. CLICK BURST — click spawns a symmetric starburst (pairs of mirrored
 *     particles) that expand then fade, not a random spray.
 */

const SYMBOLS = ['$', '$', '$', '$', 'X', 'O', '1', '0'];

interface SwarmEnv {
  W: number; H: number;
  ctx: CanvasRenderingContext2D;
  mouse: { x: number; y: number; on: boolean };
  mouseSpeed: number;
  /** Angle pointing BEHIND mouse movement (opposite of velocity) */
  tailAngle: number;
}

/**
 * BillParticle
 *
 * Each particle belongs to one of three zones:
 *   zone 0 — nucleus  (tailRatio ≈ 0)   : large, bright, sits at cursor
 *   zone 1 — mid-tail (tailRatio 0–0.5) : medium, fades with distance
 *   zone 2 — tip      (tailRatio 0.5–1) : tiny micro-dots at tail end
 *
 * `side` (-1 | +1) determines which of the two symmetric tails the
 * particle belongs to.  The nucleus zone (tailRatio < 0.12) has side = 0
 * and sits on the central axis.
 */
class BillParticle {
  x: number; y: number;
  vx: number; vy: number;
  /** Idle home position */
  hx: number; hy: number;
  trail: { x: number; y: number }[];
  TLEN: number;
  phase: number;
  sz: number;
  tailRatio: number;
  /** +1 = left wing, -1 = right wing, 0 = nucleus */
  side: number;
  sym: string;
  isBill: boolean;
  hue: number; lit: number; alpha: number;
  angle: number = 0;

  constructor(
    cx: number,
    cy: number,
    burst: boolean,
    W: number,
    H: number,
    tailRatio: number = Math.random(),
    side: number = Math.random() < 0.5 ? 1 : -1,
  ) {
    if (burst) {
      this.x  = cx + (Math.random() - 0.5) * 10;
      this.y  = cy + (Math.random() - 0.5) * 10;
      // Burst: symmetric pairs — velocity mirrors across the movement axis
      const a = Math.random() * Math.PI;          // half-circle only
      const s = 3 + Math.random() * 8;
      this.vx = Math.cos(a) * s * side;
      this.vy = Math.sin(a) * s;
    } else {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
    }

    this.hx = Math.random() * W;
    this.hy = Math.random() * H;
    this.trail = [];

    // Longer trail for mid-tail particles so the wing fills in visually
    this.TLEN  = Math.round(30 + tailRatio * 45);
    this.phase = Math.random() * Math.PI * 2;

    // Size: large nucleus → tiny tip
    this.sz = (10 + Math.random() * 7) * (1 - tailRatio * 0.70);

    this.tailRatio = tailRatio;
    this.side      = tailRatio < 0.12 ? 0 : side;   // nucleus is centerline

    this.sym    = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    this.isBill = tailRatio < 0.18 && Math.random() < 0.55;

    this.hue   = 142 + Math.random() * 20;
    this.lit   = 52 + Math.random() * 18;
    this.alpha = (0.88 + Math.random() * 0.12) * (1 - tailRatio * 0.60);
  }

  color(a: number) {
    return `hsla(${this.hue},100%,${this.lit}%,${a})`;
  }

  update(frame: number, env: SwarmEnv) {
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > this.TLEN) this.trail.length = this.TLEN;

    // Nucleus particles flutter gently; tail particles stay rigid
    this.angle = this.tailRatio < 0.25
      ? Math.sin(frame * 0.04 + this.phase) * 0.55
      : 0;

    if (env.mouse.on) {
      /*
       * SYMMETRIC BILATERAL COMET
       * ─────────────────────────
       * The comet has two wings that mirror each other across the
       * tail axis.  Each wing is built from:
       *
       *   tailDist   — how far behind the mouse along the tail axis
       *   wingSpread — perpendicular offset (positive for one side,
       *                negative for the other → perfect mirror)
       *
       * Wing profile: narrow at nucleus, widest at ~40% of tail,
       * then tapers back to a point → classic manta-ray silhouette.
       */
      const tailLength = Math.min(340, env.mouseSpeed * 18 + 65);
      const tailDist   = this.tailRatio * tailLength;

      // Symmetric wing profile: sin curve peaking at tailRatio ≈ 0.40
      const profile     = Math.pow(Math.sin(this.tailRatio * Math.PI * 0.85), 0.55);
      const wingSpread  = 28 * profile;

      // Perpendicular axis (90° from tail direction)
      const perpAngle = env.tailAngle + Math.PI * 0.5;

      // `this.side` is ±1, so the two wings are exact mirrors
      const tx = env.mouse.x
        + Math.cos(env.tailAngle) * tailDist
        + Math.cos(perpAngle) * this.side * wingSpread;
      const ty = env.mouse.y
        + Math.sin(env.tailAngle) * tailDist
        + Math.sin(perpAngle) * this.side * wingSpread;

      const dx = tx - this.x;
      const dy = ty - this.y;
      const d  = Math.hypot(dx, dy) + 1;

      // Nucleus snaps instantly; tail tip lags → creates elongated wing
      const snap = 0.40 - this.tailRatio * 0.30;
      const f    = Math.min(0.20, snap / (d * 0.07 + 1)) * 0.30;
      this.vx += dx * f;
      this.vy += dy * f;
    } else {
      // Gentle drift back to idle home position
      this.vx += (this.hx - this.x) * 0.007;
      this.vy += (this.hy - this.y) * 0.007;
    }

    // Turbulence: nucleus gets a tiny flutter; tail stays smooth
    const turb = 0.14 * (1 - this.tailRatio * 0.65);
    this.vx += (Math.random() - 0.5) * turb;
    this.vy += (Math.random() - 0.5) * turb;

    this.vx *= 0.910;
    this.vy *= 0.910;
    this.x  += this.vx;
    this.y  += this.vy;
  }

  drawTrail(env: SwarmEnv) {
    const n = this.trail.length;
    if (n < 2) return;
    env.ctx.lineCap = 'round';

    const maxW = this.sz * (this.tailRatio < 0.25 ? 0.60 : 0.38);

    for (let i = 0; i < n - 1; i++) {
      const tFrac = 1 - i / n;
      const t3    = tFrac * tFrac * tFrac;
      env.ctx.beginPath();
      env.ctx.moveTo(this.trail[i].x,     this.trail[i].y);
      env.ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
      env.ctx.strokeStyle = this.color(t3 * 0.80);
      env.ctx.lineWidth   = tFrac * maxW;
      env.ctx.stroke();
    }
  }

  drawHead(env: SwarmEnv) {
    // Deep tail particles → glowing micro-dot only
    if (this.tailRatio > 0.58) {
      const r = Math.max(0.7, this.sz * 0.42);
      env.ctx.beginPath();
      env.ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      env.ctx.fillStyle = this.color(this.alpha * 0.85);
      env.ctx.fill();
      return;
    }

    env.ctx.save();
    env.ctx.translate(this.x, this.y);
    env.ctx.rotate(this.angle);
    env.ctx.globalAlpha = this.alpha;

    if (this.isBill) {
      const w = this.sz * 2.1, h = this.sz * 1.15;
      env.ctx.fillStyle = this.color(1);
      env.ctx.fillRect(-w / 2, -h / 2, w, h);
      env.ctx.fillStyle = 'rgba(4,8,12,0.6)';
      env.ctx.fillRect(-w / 2 + 2.5, -h / 2 + 2, w - 5, h - 4);
      env.ctx.strokeStyle = this.color(0.6);
      env.ctx.lineWidth   = 0.7;
      env.ctx.strokeRect(-w / 2 + 1.5, -h / 2 + 1.5, w - 3, h - 3);
      env.ctx.fillStyle = this.color(1);
      env.ctx.font = `bold ${this.sz * 0.78}px 'Courier New',monospace`;
      env.ctx.textAlign    = 'center';
      env.ctx.textBaseline = 'middle';
      env.ctx.fillText(this.sym, 0, 0);
    } else {
      env.ctx.fillStyle = this.color(1);
      env.ctx.font = `bold ${this.sz * 1.1}px 'Courier New',monospace`;
      env.ctx.textAlign    = 'center';
      env.ctx.textBaseline = 'middle';
      env.ctx.fillText(this.sym, 0, 0);
      // Soft bloom layer
      env.ctx.globalAlpha = this.alpha * 0.20;
      env.ctx.font = `bold ${this.sz * 1.6}px 'Courier New',monospace`;
      env.ctx.fillText(this.sym, 0, 0);
    }

    env.ctx.restore();
    env.ctx.globalAlpha = 1;
  }
}

/* ─── Money Swarm Background ─────────────────────────────────────────── */
function MoneySwarmBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let canvasW = typeof window !== 'undefined' ? window.innerWidth : 800;
    let canvasH = typeof window !== 'undefined' ? window.innerHeight : 600;
    let animationFrameId: number;

    const mouse = { x: -1000, y: -1000, on: false };

    let mouseVx = 0, mouseVy = 0;
    let prevMX  = -1000, prevMY = -1000;
    let tailAngle  = Math.PI;
    let mouseSpeed = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;
      const rect = currentCanvas.getBoundingClientRect();
      canvasW = rect.width;
      canvasH = rect.height;
      currentCanvas.width = canvasW * dpr;
      currentCanvas.height = canvasH * dpr;
      const currentCtx = currentCanvas.getContext('2d');
      if (currentCtx) currentCtx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rawVx = e.clientX - prevMX;
      const rawVy = e.clientY - prevMY;

      mouseVx = rawVx * 0.38 + mouseVx * 0.62;
      mouseVy = rawVy * 0.38 + mouseVy * 0.62;

      const spd = Math.hypot(mouseVx, mouseVy);
      mouseSpeed = spd * 0.4 + mouseSpeed * 0.6;

      if (spd > 0.8) {
        tailAngle = Math.atan2(mouseVy, mouseVx) + Math.PI;
      }

      prevMX   = e.clientX;
      prevMY   = e.clientY;
      mouse.x  = e.clientX;
      mouse.y  = e.clientY;
      mouse.on = true;
    };

    const handleMouseLeave = () => {
      mouse.on  = false;
      mouseSpeed = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    /*
     * Particle pool — SYMMETRIC pairs
     * ────────────────────────────────
     * For every tail particle we create a mirrored counterpart with
     * side = +1 and side = -1 at the same tailRatio.  Nucleus particles
     * (tailRatio < 0.12) use side = 0 and are not mirrored.
     *
     * Distribution:
     *   20% nucleus  (tailRatio 0–0.12, side 0)
     *   80% wing     (tailRatio 0.12–1, side ±1 in equal halves)
     */
    const MAX   = 200;
    const COUNT = 40;
    const bills: BillParticle[] = [];

    const nucleusCount = Math.floor(COUNT * 0.20);
    const wingPairs    = Math.floor((COUNT - nucleusCount) / 2);

    // Nucleus cluster
    for (let i = 0; i < nucleusCount; i++) {
      bills.push(new BillParticle(canvasW * 0.5, canvasH * 0.5, true, canvasW, canvasH, Math.random() * 0.12, 0));
    }
    // Wing pairs — each pair shares the same tailRatio → perfect mirror
    for (let i = 0; i < wingPairs; i++) {
      const tr = 0.12 + (i / wingPairs) * 0.88;
      bills.push(new BillParticle(canvasW * 0.5, canvasH * 0.5, true, canvasW, canvasH, tr,  1));
      bills.push(new BillParticle(canvasW * 0.5, canvasH * 0.5, true, canvasW, canvasH, tr, -1));
    }

    const handleClick = (e: MouseEvent) => {
      const cx = e.clientX;
      const cy = e.clientY;
      // Click burst: symmetric pairs at random angles
      for (let i = 0; i < 10; i++) {
        const tr = i < 3 ? Math.random() * 0.10 : 0.10 + Math.random() * 0.90;
        bills.push(new BillParticle(cx, cy, true, canvasW, canvasH, tr,  1));
        bills.push(new BillParticle(cx, cy, true, canvasW, canvasH, tr, -1));
      }
      if (bills.length > MAX) bills.splice(0, bills.length - MAX);
    };
    window.addEventListener('click', handleClick);

    /* ── Render loop ──────────────────────────────────────────────────── */
    let frame = 0;
    function loop() {
      if (ctx) ctx.clearRect(0, 0, canvasW, canvasH);

      // Symmetric radial aura — two soft lobes along the tail axis
      if (mouse.on && ctx) {
        // Central nucleus glow
        const g0 = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
        g0.addColorStop(0,   'rgba(0,230,118,0.09)');
        g0.addColorStop(0.5, 'rgba(0,230,118,0.03)');
        g0.addColorStop(1,   'transparent');
        ctx.fillStyle = g0;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
        ctx.fill();

        // Two symmetric wing-tip glows placed symmetrically behind the cursor
        const wingDist = Math.min(160, mouseSpeed * 12 + 50);
        const perpAngle = tailAngle + Math.PI * 0.5;
        for (const s of [1, -1]) {
          const wx = mouse.x + Math.cos(tailAngle) * wingDist * 0.55
                             + Math.cos(perpAngle) * s * wingDist * 0.45;
          const wy = mouse.y + Math.sin(tailAngle) * wingDist * 0.55
                             + Math.sin(perpAngle) * s * wingDist * 0.45;
          const gw = ctx.createRadialGradient(wx, wy, 0, wx, wy, 80);
          gw.addColorStop(0,   'rgba(0,230,118,0.05)');
          gw.addColorStop(1,   'transparent');
          ctx.fillStyle = gw;
          ctx.beginPath();
          ctx.arc(wx, wy, 80, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const env: SwarmEnv = { W: canvasW, H: canvasH, ctx: ctx!, mouse, mouseSpeed, tailAngle };
      bills.forEach((b) => b.update(frame, env));
      bills.forEach((b) => b.drawTrail(env));
      bills.forEach((b) => b.drawHead(env));

      frame++;
      animationFrameId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity: 0.88 }}
    />
  );
}

/* ─── Boot Screen ─────────────────────────────────────────────────────── */
function BootScreen({ onDone }: BootScreenProps) {
  const [lines, setLines] = useState<string[]>([]);
  const idx = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      if (idx.current >= BOOT_LINES.length) {
        clearInterval(t);
        setTimeout(onDone, 400);
        return;
      }
      setLines((prev) => [...prev, BOOT_LINES[idx.current]]);
      idx.current += 1;
    }, 100);
    return () => clearInterval(t);
  }, [onDone]);

  return (
    <div className="immersive-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ fontSize: 13, lineHeight: 2, color: T.green }}>
          {lines.map((line, i) => {
            const safeLine = line || '';
            return (
              <div key={i} style={{
                animation: 'bootLine 0.15s ease forwards',
                opacity: 0,
                animationDelay: `${i * 0.01}s`,
                color: safeLine.startsWith('>>>') ? T.green : safeLine.includes('[OK]') ? '#4EB87F' : T.muted,
                fontWeight: safeLine.startsWith('>>>') ? 'bold' : 'normal',
                textShadow: safeLine.startsWith('>>>') ? `0 0 12px ${T.green}80` : 'none',
              }}>
                {safeLine || '\u00A0'}
              </div>
            );
          })}
          {lines.length < BOOT_LINES.length && (
            <span className="blink" style={{ color: T.green }}>▮</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Side HUD panel (decorative) ────────────────────────────────────── */
function SidePanel({ side, statsData }: { side: 'left' | 'right', statsData: { wallets: number; transactions: number; budgets: number } }) {
  const stats = [
    { label: 'WALLETS',      value: statsData.wallets.toString().padStart(2, '0') },
    { label: 'TRANSACTIONS', value: statsData.transactions.toLocaleString() },
    { label: 'CATEGORIES',   value: statsData.budgets.toString().padStart(2, '0') },
    { label: 'SYNC STATUS',  value: 'READY', green: true },
  ];

  return (
    <div className="hidden md:flex" style={{
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      [side]: 24,
      flexDirection: 'column',
      gap: 12,
      opacity: 0.6,
      fontSize: 10,
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          borderLeft:  side === 'left'  ? `2px solid ${T.brd2}` : 'none',
          borderRight: side === 'right' ? `2px solid ${T.brd2}` : 'none',
          padding: side === 'left' ? '6px 0 6px 10px' : '6px 10px 6px 0',
          textAlign: side === 'right' ? 'right' : 'left',
        }}>
          <div style={{ color: T.muted, letterSpacing: '0.15em' }}>{s.label}</div>
          <div style={{
            color: s.green ? T.green : T.text,
            fontSize: 13,
            fontFamily: "'Orbitron', monospace",
            fontWeight: 600,
            textShadow: s.green ? `0 0 8px ${T.green}60` : 'none',
          }}>{s.value}</div>
        </div>
      ))}
      <div style={{ marginTop: 8, color: T.muted, fontSize: 9, letterSpacing: '0.1em', lineHeight: 1.8 }}>
        {side === 'left'
          ? ['BUILD: 2025.04.04', 'SEC: AES-256', 'VER: v4.0.0'].map((l, i) => <div key={i}>{l}</div>)
          : ['PROTOCOL: TLS 1.3', 'SUPABASE: ACTIVE', 'GEMINI: LIVE'].map((l, i) => <div key={i}>{l}</div>)
        }
      </div>
    </div>
  );
}



interface LandingScreenProps {
  onEnter: () => void;
  statsData: { wallets: number; transactions: number; budgets: number };
}

/* ─── Landing Screen ──────────────────────────────────────────────────── */
function LandingScreen({ onEnter, statsData }: LandingScreenProps) {
  return (
    <div className="immersive-container scanlines dot-grid" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="scan-beam" />

      {/* Side decorative panels */}
      <SidePanel side="left"  statsData={statsData} />
      <SidePanel side="right" statsData={statsData} />

      {/* Radial glow center */}
      <div className="hidden md:block" style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: `radial-gradient(circle, ${T.green}06 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />

      {/* Main content */}
      <div style={{
        textAlign: 'center',
        maxWidth: 700,
        padding: '0 2rem',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* Top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          marginBottom: 48,
          animation: 'fadeUp 0.5s ease 0.2s both',
        }}>
          <div className="hidden sm:block" style={{ height: 1, width: 60, background: `linear-gradient(to right, transparent, ${T.brd2})` }} />
          <span style={{ fontSize: 11, color: T.muted, letterSpacing: '0.25em' }}>
            SYS://SINA_FN v4.0.0
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
            <span style={{ fontSize: 10, color: T.green, letterSpacing: '0.2em' }}>ONLINE</span>
          </div>
          <div className="hidden sm:block" style={{ height: 1, width: 60, background: `linear-gradient(to left, transparent, ${T.brd2})` }} />
        </div>

        {/* Logo / main title */}
        <div style={{ marginBottom: 12, animation: 'fadeUp 0.6s ease 0.4s both' }}>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.5em', marginBottom: 12 }}>
            ◈ PERSONAL FINANCE HUD ◈
          </div>
          <h1
            className="glitch-text"
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 'clamp(40px, 10vw, 96px)',
              fontWeight: 900,
              color: T.green,
              letterSpacing: '0.12em',
              lineHeight: 1,
            }}
          >
            SINA_FN
          </h1>
        </div>

        {/* Sub tagline */}
        <p style={{
          fontSize: 13,
          color: T.muted,
          letterSpacing: '0.2em',
          marginBottom: 48,
          animation: 'fadeUp 0.6s ease 0.6s both',
        }}>
          TRACK · BUDGET · UNDERSTAND · CONTROL
        </p>

        {/* Stats row */}
        <div className="flex-col sm:flex-row items-center" style={{
          display: 'flex',
          gap: 16,
          marginBottom: 52,
          animation: 'fadeUp 0.6s ease 0.8s both',
          justifyContent: 'center',
        }}>
          {[
            { label: 'WALLETS',        val: statsData.wallets.toString().padStart(2, '0'), unit: '' },
            { label: 'TRANSACTIONS',   val: statsData.transactions.toLocaleString(),       unit: '' },
            { label: 'BUDGETS ACTIVE', val: statsData.budgets.toString().padStart(2, '0'), unit: '' },
            { label: 'SYNC',           val: 'READY', unit: '', green: true },
          ].map((s, i) => (
            <div key={i} className="clip-ang-sm w-full sm:w-auto" style={{
              background: T.panel,
              border: `1px solid ${T.brd}`,
              padding: '12px 20px',
              textAlign: 'center',
              flex: 1,
              maxWidth: 140,
            }}>
              <div style={{ fontSize: 9, color: T.muted, letterSpacing: '0.15em', marginBottom: 6 }}>{s.label}</div>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: 15,
                fontWeight: 700,
                color: s.green ? T.green : T.text,
                textShadow: s.green ? `0 0 10px ${T.green}60` : 'none',
                letterSpacing: '0.05em',
              }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ animation: 'fadeUp 0.6s ease 1s both' }}>
          <button className="cta-btn" onClick={onEnter}>
            <span>◈ INITIALIZE SYSTEM ◈</span>
          </button>
        </div>

        {/* Bottom info */}
        <div className="flex-col sm:flex-row" style={{
          marginTop: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          animation: 'fadeUp 0.6s ease 1.2s both',
        }}>
          {['ENCRYPTION: AES-256', 'PROTOCOL: TLS 1.3', 'AUTH: PIN + BIOMETRIC'].map((txt, i) => (
            <span key={i} style={{ fontSize: 9, color: T.muted, letterSpacing: '0.15em' }}>{txt}</span>
          ))}
        </div>
      </div>

      {/* Removed WaveFlow call as requested */}
    </div>
  );
}

interface PinScreenProps {
  onSuccess: () => void;
  onBack: () => void;
  nickname: string;
}

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/* ─── PIN Screen ──────────────────────────────────────────────────────── */
function PinScreen({ onSuccess, onBack, nickname }: PinScreenProps) {
  const [pin, setPin]           = useState<string[]>([]);
  const [shake, setShake]       = useState(false);
  const [flash, setFlash]       = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyPin = useCallback(async (code: string) => {
    setIsVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('pin_hash')
        .eq('id', user.id)
        .single();

      if (!profile?.pin_hash) {
        window.location.href = '/onboarding/pin-setup';
        return;
      }

      const expected  = btoa(`sina_pin:${code}`);
      const isCorrect = expected === profile.pin_hash;

      if (isCorrect) {
        setFlash(true);
        setTimeout(onSuccess, 750);
      } else {
        setShake(true);
        setTimeout(() => { setPin([]); setShake(false); setIsVerifying(false); }, 600);
      }
    } catch (err) {
      console.error('PIN verify error:', err);
      setShake(true);
      setTimeout(() => { setPin([]); setShake(false); setIsVerifying(false); }, 600);
    }
  }, [onSuccess]);

  const addDigit = (d: string) => {
    if (pin.length >= 6 || isVerifying) return;
    const next = [...pin, d];
    setPin(next);
    if (next.length === 6) verifyPin(next.join(''));
  };

  const delDigit = () => {
    if (isVerifying) return;
    setPin((p) => p.slice(0, -1));
  };

  const handleLogout = async () => {
    document.cookie = 'pin_verified=; path=/; max-age=0';
    document.cookie = 'auth-session=; path=/; max-age=0';
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="immersive-container scanlines dot-grid" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {flash && <div className="flash-overlay" />}
      <div className="scan-beam" />

      {/* Back link */}
      <button onClick={onBack} style={{
        position: 'absolute', top: 24, left: 24,
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 11, color: T.muted, letterSpacing: '0.2em',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        ◂ BACK
      </button>

      {/* Sys label */}
      <div style={{
        position: 'absolute', top: 24, right: 24,
        fontSize: 10, color: T.muted, letterSpacing: '0.2em',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
        SECURE SESSION ACTIVE
      </div>

      {/* PIN card */}
      <div className="hud-frame screen-enter mx-4" style={{
        background: T.panel,
        border: `1px solid ${T.brd}`,
        padding: '40px 40px 44px',
        width: '100%',
        maxWidth: 380,
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="5" y="14" width="22" height="16" rx="2" fill="none" stroke={T.green} strokeWidth="1.5" />
              <path d="M10 14V10C10 6.686 12.686 4 16 4C19.314 4 22 6.686 22 10V14" stroke={T.green} strokeWidth="1.5" fill="none" />
              <rect x="14" y="19" width="4" height="5" rx="1" fill={T.green} />
              <circle cx="16" cy="20" r="2" fill={T.green} />
            </svg>
          </div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: '0.3em', marginBottom: 4 }}>
            AUTHORIZATION REQUIRED
          </div>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: '0.2em' }}>
            WELCOME, {nickname ? nickname.toUpperCase() : 'USER'}
          </div>
        </div>

        {/* PIN dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          marginBottom: 36,
          animation: shake ? 'shake 0.5s ease-out' : 'none',
        }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <div key={i} style={{
                width: 18, height: 18,
                borderRadius: '50%',
                border: `2px solid ${filled ? T.green : T.brd2}`,
                background: filled ? T.green : 'transparent',
                boxShadow: filled ? `0 0 10px ${T.green}70` : 'none',
                transition: 'all 0.15s',
                animation: filled ? 'pinPop 0.18s ease forwards' : 'none',
              }} />
            );
          })}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {PAD_KEYS.map((k, i) => {
            if (k === '') {
              return (
                <button
                  key={i}
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.brd}`,
                    color: T.muted,
                    cursor: 'pointer',
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    height: 66,
                    borderRadius: 4,
                    transition: 'all 0.12s',
                  }}
                  className="hover:border-red-500/50 hover:text-red-500"
                >
                  LOGOUT
                </button>
              );
            }
            if (k === '⌫') {
              return (
                <button key={i} className="num-btn del-btn" onClick={delDigit}>
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                    <path d="M7 1L1 8L7 15H19V1H7Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M11 5L15 11M15 5L11 11" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              );
            }
            return (
              <button key={i} className="num-btn" onClick={() => addDigit(k)}>
                {k}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        <div style={{ textAlign: 'center', marginTop: 20, minHeight: 16 }}>
          {isVerifying && !shake && (
            <span style={{ fontSize: 10, color: T.green, letterSpacing: '0.15em' }}>
              VERIFYING...
            </span>
          )}
          {shake && (
            <span style={{ fontSize: 10, color: T.red, letterSpacing: '0.15em' }}>
              INCORRECT PIN — ACCESS DENIED
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="hidden sm:block" style={{
        position: 'absolute', bottom: 24,
        fontSize: 9, color: T.muted, letterSpacing: '0.2em', textAlign: 'center',
      }}>
        SINA_FN OS v4.0.0 · SECURED WITH AES-256-GCM · ALL DATA ENCRYPTED AT REST
      </div>
    </div>
  );
}

/* ─── Success / Dashboard Teaser ─────────────────────────────────────── */
function SuccessScreen() {
  useEffect(() => {
    const t = setTimeout(() => {
      document.cookie = 'pin_verified=true; path=/; max-age=86400';
      window.location.href = '/';
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="immersive-container scanlines dot-grid" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="scan-beam" />

      {/* Green radial flash */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500, height: 500,
        background: `radial-gradient(circle, ${T.green}10 0%, transparent 60%)`,
        pointerEvents: 'none',
        animation: 'fadeIn 0.8s ease forwards',
      }} />

      <div className="screen-enter mx-4 w-full max-w-md" style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
        {/* Checkmark */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke={T.green} strokeWidth="1.5" opacity="0.4" />
            <circle cx="32" cy="32" r="24" stroke={T.green} strokeWidth="1"   opacity="0.2" />
            <path d="M18 32L28 42L46 22" stroke={T.green} strokeWidth="2.5" strokeLinecap="square"
              style={{ filter: `drop-shadow(0 0 8px ${T.green})` }} />
          </svg>
        </div>

        <div style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: 'clamp(28px, 6vw, 42px)',
          fontWeight: 900,
          color: T.green,
          letterSpacing: '0.15em',
          textShadow: `0 0 40px ${T.green}60`,
          marginBottom: 12,
          animation: 'fadeUp 0.5s ease forwards',
        }}>
          ACCESS GRANTED
        </div>

        <div style={{
          fontSize: 11,
          color: T.muted,
          letterSpacing: '0.25em',
          animation: 'fadeUp 0.5s ease 0.2s both',
        }}>
          INITIALIZING DASHBOARD...
        </div>
      </div>
    </div>
  );
}

/* ─── Root orchestrator ───────────────────────────────────────────────── */
type Screen = 'boot' | 'landing' | 'pin' | 'success';

export default function ImmersiveAuth() {
  const [screen, setScreen] = useState<Screen>('boot');
  const userProfile = useAppStore((state) => state.userProfile);
  const [statsData, setStatsData] = useState({ wallets: 0, transactions: 0, budgets: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Schedule state update to the next frame to avoid 'cascading render' lint errors in strict environments
    const handle = requestAnimationFrame(() => setIsClient(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const [w, tx, b] = await Promise.all([
          supabase.from('wallets').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        setStatsData({
          wallets:      w.count      ?? 0,
          transactions: tx.count     ?? 0,
          budgets:      b.count      ?? 0,
        });
      } catch { /* silent */ }
    }
    loadStats();
  }, []);

  if (!isClient) return <div className="fixed inset-0 bg-[#080B0F]" />;

  return (
    <div className="fixed inset-0 z-50 bg-[#080B0F] overflow-hidden">
      <MoneySwarmBackground />
      <Styles />
      {screen === 'boot'    && <BootScreen    onDone={() => setScreen('landing')} />}
      {screen === 'landing' && <LandingScreen onEnter={() => setScreen('pin')} statsData={statsData} />}
      {screen === 'pin'     && (
        <PinScreen
          onSuccess={() => setScreen('success')}
          onBack={() => setScreen('landing')}
          nickname={userProfile?.nickname ?? ''}
        />
      )}
      {screen === 'success' && <SuccessScreen />}
    </div>
  );
}
