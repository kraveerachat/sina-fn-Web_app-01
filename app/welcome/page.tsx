'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Wallet, ShieldCheck, Zap, Lock, Cpu } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import dynamic from 'next/dynamic';

const Welcome3DCanvas = dynamic(() => import('@/components/ui/Welcome3DCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] md:h-[480px] animate-pulse bg-neutral-100 dark:bg-[#111315] rounded-3xl border border-black/5 dark:border-white/10 my-6 flex items-center justify-center">
      <span className="text-xs font-mono text-(--text-3)">Loading 3D Canvas...</span>
    </div>
  ),
});

export default function EnterpriseWelcomePage() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Detect system or attribute theme
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeMode(isDark ? 'dark' : 'light');
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

  const handleProceed = (targetUrl: string = '/login') => {
    document.cookie = 'sina_welcomed=true; max-age=31536000; path=/';
    window.location.href = targetUrl;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-(--bg) text-(--text) flex flex-col items-center justify-between px-4 py-8 md:py-12">
      {/* ── Ambient Blurred Radial Mesh Glow ── */}
      <div className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 -z-10 flex items-center justify-center">
        <div className="h-[280px] w-[280px] rounded-full bg-[#007AFF] opacity-20 blur-[100px] dark:opacity-25" />
        <div className="absolute h-[220px] w-[220px] rounded-full bg-[#D4AF37] opacity-15 blur-[90px] dark:opacity-20" />
      </div>

      {/* ── Main Container ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-5xl flex flex-col items-center my-auto"
      >
        {/* ── HERO SECTION ── */}
        <motion.div variants={itemVariants} className="text-center mb-6 md:mb-8">
          {/* Floating Logo with Aura Glow */}
          <div className="relative mb-4 inline-flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="relative z-10"
            >
              <img
                src="/logo-sn.png"
                alt="Sina_FN Logo"
                className="h-20 w-20 md:h-24 md:w-24 object-contain filter drop-shadow-[0_12px_32px_rgba(0,122,255,0.4)]"
              />
            </motion.div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-(--text) mb-2">
            Sina_FN
          </h1>
          <p className="text-base md:text-lg font-medium text-(--text-2) max-w-lg mx-auto">
            ศูนย์บัญชาการการเงินอัจฉริยะส่วนบุคคล
          </p>
        </motion.div>

        {/* ── 3D INTERACTIVE CANVAS ── */}
        <motion.div variants={itemVariants} className="w-full max-w-5xl">
          <Welcome3DCanvas theme={themeMode} />
        </motion.div>

        {/* ── BENTO SHOWCASE GRID ── */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl my-8"
        >
          {/* Card A: AI Ingestion */}
          <motion.div
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#111315]/80 p-6 md:p-7 shadow-xl backdrop-blur-xl transition-all duration-300 flex flex-col justify-between min-h-[240px]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Zap size={22} />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500 border border-emerald-500/20">
                  <Sparkles size={11} /> Gemini 2.0
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-(--text) mb-2">
                สแกนสลิป & ดักจับธุรกรรมอัจฉริยะ
              </h3>
              <p className="text-xs md:text-sm text-(--text-2) leading-relaxed">
                ถอดข้อมูลจากสลิปโอนเงินและการแจ้งเตือนอัตโนมัติด้วย AI ปัญญาประดิษฐ์แม่นยำสูง
              </p>
            </div>

            {/* Laser scanning visual representation */}
            <div className="relative mt-6 h-14 w-full overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-emerald-500 animate-pulse" />
                <span className="text-[12px] font-mono text-(--text-2)">0.04s Ingested</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-500">+฿1,500.00</span>
              <motion.div
                animate={{ x: ['-100%', '300%'] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent blur-xs"
              />
            </div>
          </motion.div>

          {/* Card B: Wealth Hub */}
          <motion.div
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#111315]/80 p-6 md:p-7 shadow-xl backdrop-blur-xl transition-all duration-300 flex flex-col justify-between min-h-[240px]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Wallet size={22} />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-500 border border-blue-500/20">
                  Multi-Wallet
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-(--text) mb-2">
                บริหารสินทรัพย์ & กระเป๋าเงินครอบครัว
              </h3>
              <p className="text-xs md:text-sm text-(--text-2) leading-relaxed">
                ภาพรวมยอดเงินรวม สินทรัพย์ และหนี้สินแบบ Real-time บนแดชบอร์ด Quiet Luxury
              </p>
            </div>

            {/* Holographic mini wallet visual */}
            <div className="relative mt-6 h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600/15 to-indigo-600/15 border border-blue-500/20 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                <span className="text-[12px] font-medium text-(--text)">รวมสินทรัพย์สุทธิ</span>
              </div>
              <span className="text-[13px] font-bold font-mono text-blue-400">฿450,000</span>
            </div>
          </motion.div>

          {/* Card C: Bank-Grade Security */}
          <motion.div
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#111315]/80 p-6 md:p-7 shadow-xl backdrop-blur-xl transition-all duration-300 flex flex-col justify-between min-h-[240px]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <ShieldCheck size={22} />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-500 border border-amber-500/20">
                  <Lock size={11} /> Biometrics
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-(--text) mb-2">
                ปลอดภัยระดับ Private Enclave
              </h3>
              <p className="text-xs md:text-sm text-(--text-2) leading-relaxed">
                ปกป้องข้อมูลการเงินด้วย PIN 2 ชั้น และระบบเข้ารหัสข้อมูลความปลอดภัยสูง
              </p>
            </div>

            {/* Security Enclave visual */}
            <div className="relative mt-6 h-14 w-full rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-500" />
                <span className="text-[12px] font-mono text-(--text-2)">Hardware Encrypted</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-500">AES-256</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ── ACTION DOCK (Floating Bottom CTAs) ── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mt-4"
        >
          <motion.div whileTap={{ scale: 0.95 }} className="w-full sm:w-auto flex-1">
            <CyberButton
              variant="primary"
              glow
              fullWidth
              size="lg"
              icon={<ArrowRight size={18} />}
              onClick={() => handleProceed('/login')}
            >
              เริ่มใช้งานระบบ
            </CyberButton>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }} className="w-full sm:w-auto flex-1">
            <CyberButton
              variant="outline"
              fullWidth
              size="lg"
              onClick={() => handleProceed('/login')}
            >
              เข้าสู่ระบบ (สมาชิกเดิม)
            </CyberButton>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Footer ── */}
      <footer className="mt-8 text-center text-xs font-mono text-(--text-3)">
        Sina Engine v3.0 · Powered by Three.js & React Three Fiber
      </footer>
    </div>
  );
}
