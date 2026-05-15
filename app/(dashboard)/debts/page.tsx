'use client';

// ═══════════════════════════════════════════════════════════════════
// Phase 8 — The Cinematic Debt Destroyer
//
// A GSAP ScrollTrigger cinematic experience where a laser line
// grows downward as you scroll, shattering each debt card on
// contact, and culminating in a triumphant "FINANCIAL FREEDOM
// UNLOCKED" reveal with an aura shift from blood red → neon green.
// ═══════════════════════════════════════════════════════════════════

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import DebtCard from '@/components/debts/DebtCard';
import LaserLine from '@/components/debts/LaserLine';
import FreedomMessage from '@/components/debts/FreedomMessage';

gsap.registerPlugin(ScrollTrigger);

// ── Dummy debt data ──
const DEBTS = [
  { name: 'สินเชื่อบ้าน SCB',       amount: '฿1,245,000', rate: '3.5%', monthly: '฿12,800' },
  { name: 'บัตรเครดิต KBank',        amount: '฿87,400',    rate: '18%',  monthly: '฿4,500'  },
  { name: 'สินเชื่อรถยนต์ BAY',      amount: '฿342,000',   rate: '4.2%', monthly: '฿8,200'  },
  { name: 'สินเชื่อส่วนบุคคล TTB',   amount: '฿56,000',    rate: '22%',  monthly: '฿3,100'  },
];

export default function DebtsPage() {
  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const laserRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const freedomRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!containerRef.current || !pinnedRef.current || !laserRef.current) return;

      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      const totalCards = cards.length;

      // ──────────────────────────────────────────────
      // 1. Master timeline pinned to the scroll track
      // ──────────────────────────────────────────────
      const master = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: pinnedRef.current,
          scrub: 0.8,
          // anticipatePin helps smoothness on desktop
          anticipatePin: 1,
        },
      });

      // ──────────────────────────────────────────────
      // 2. Laser grows downward (0% → 100% of scroll)
      // ──────────────────────────────────────────────
      master.fromTo(
        laserRef.current,
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', duration: 1 },
        0
      );

      // ──────────────────────────────────────────────
      // 3. Shatter each debt card at evenly-spaced scroll positions
      //    Each card takes ~12% of scroll, with gaps between
      // ──────────────────────────────────────────────
      const cardSegment = 0.7 / totalCards; // 70% of scroll for cards, 30% for finale

      cards.forEach((card, i) => {
        const hitPoint = 0.05 + cardSegment * (i + 0.5); // center of each segment

        // Card entrance: fade in slightly before the hit
        master.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: cardSegment * 0.4, ease: 'power2.out' },
          hitPoint - cardSegment * 0.4
        );

        // Random shatter values for organic feel
        const shatterX = gsap.utils.random(-80, 80);
        const shatterRotate = gsap.utils.random(-20, 20);

        // Shatter: when laser hits
        master.to(
          card,
          {
            x: shatterX,
            opacity: 0,
            filter: 'blur(12px)',
            rotate: shatterRotate,
            scale: 0.6,
            duration: cardSegment * 0.5,
            ease: 'power3.in',
          },
          hitPoint
        );
      });

      // ──────────────────────────────────────────────
      // 4. Aura Shift: red/black → neon green (last 30%)
      // ──────────────────────────────────────────────
      if (auraRef.current) {
        master.to(
          auraRef.current,
          {
            background:
              'radial-gradient(ellipse at center, rgba(0,255,136,0.12) 0%, rgba(0,20,10,0.95) 70%)',
            duration: 0.25,
            ease: 'power2.inOut',
          },
          0.72
        );
      }

      // ──────────────────────────────────────────────
      // 5. Laser color shift: red → green at the end
      // ──────────────────────────────────────────────
      master.to(
        laserRef.current,
        {
          backgroundColor: '#00ff88',
          boxShadow:
            '0 0 15px #00ff88, 0 0 40px rgba(0,255,136,0.4), 0 0 80px rgba(0,255,136,0.15)',
          duration: 0.2,
          ease: 'power2.inOut',
        },
        0.75
      );

      // ──────────────────────────────────────────────
      // 6. Freedom Message reveal (last 10%)
      // ──────────────────────────────────────────────
      if (freedomRef.current) {
        master.fromTo(
          freedomRef.current,
          { opacity: 0, y: 60, scale: 0.85 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.15,
            ease: 'power3.out',
          },
          0.85
        );
      }
    },
    { scope: containerRef }
  );

  return (
    <>
      {/* ── Intro Header (above the scroll track) ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-red)] hud-dot" />
          <span className="text-[10px] tracking-[3px] text-[var(--cyber-red)] font-mono uppercase">
            PHASE 8 — DEBT DESTROYER
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--cyber-text)]">
          เลื่อนเพื่อทำลายหนี้ทั้งหมด
        </h1>
        <p className="text-sm text-[var(--cyber-text-secondary)] font-mono mt-1">
          Scroll down to unleash the laser
        </p>
      </div>

      {/* ── The Scroll Track: 300vh tall container ── */}
      <div ref={containerRef} className="relative h-[300vh]">
        {/* ── Pinned viewport (100vh, centered) ── */}
        <div
          ref={pinnedRef}
          className="w-full h-screen flex items-center justify-center overflow-hidden"
        >
          {/* Aura background — transitions from red to green */}
          <div
            ref={auraRef}
            className="absolute inset-0 transition-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, rgba(10,2,2,0.95) 70%)',
            }}
          />

          {/* Laser Line */}
          <LaserLine ref={laserRef} />

          {/* ── Debt Cards (stacked in center) ── */}
          <div className="relative z-10 w-full max-w-lg px-4">
            {DEBTS.map((debt, i) => (
              <div
                key={debt.name}
                className="absolute inset-x-0 px-4"
                style={{
                  // Stack cards vertically in the pinned area — they'll be
                  // animated in/out by the master timeline
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <DebtCard
                  ref={(el) => { cardRefs.current[i] = el; }}
                  name={debt.name}
                  amount={debt.amount}
                  rate={debt.rate}
                  monthly={debt.monthly}
                />
              </div>
            ))}
          </div>

          {/* ── Freedom Message (hidden until scroll end) ── */}
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <FreedomMessage ref={freedomRef} />
          </div>

          {/* ── Scroll hint at the very start ── */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 animate-bounce">
            <div className="w-5 h-8 rounded-full border-2 border-[var(--cyber-red)]/40 flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-[var(--cyber-red)]/60" />
            </div>
            <span className="text-[9px] font-mono text-[var(--cyber-text-muted)] uppercase tracking-widest">
              Scroll
            </span>
          </div>
        </div>
      </div>

      {/* ── Post-scroll spacer ── */}
      <div className="h-20" />
    </>
  );
}
