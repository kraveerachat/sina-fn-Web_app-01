'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import { useAppStore } from '@/store/appStore';

const features = [
  { id: 1, title: 'บันทึกรายรับรายจ่าย', icon: '💰' },
  { id: 2, title: 'AI ช่วยวิเคราะห์การเงิน', icon: '🧠' },
  { id: 3, title: 'วางแผนเป้าหมายระยะยาว', icon: '📈' },
];

export default function WelcomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const nickname = useAppStore((state) => state.userProfile?.nickname) || 'Guest';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      {/* Animated Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="mb-10"
      >
        <div className="inline-flex flex-col items-center justify-center p-6 rounded-[24px] bg-linear-to-br from-[#1F2328] to-[#1A1D21] border border-[#2A2F38] shadow-[0_0_40px_#39FF1415]">
          <span className="text-5xl font-black text-[#39FF14] font-mono leading-none mb-4">S</span>
          <h1 className="text-2xl font-bold text-[#E8EAF0] tracking-[6px] uppercase font-mono">SINA_FN</h1>
        </div>
      </motion.div>

      {/* Welcome Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12 space-y-2"
      >
        <p className="text-[10px] tracking-[4px] text-[#39FF14] font-mono uppercase">SYSTEM INITIALIZED</p>
        <h2 className="text-3xl font-bold text-[#E8EAF0]">ยินดีต้อนรับสู่ระบบ, {nickname}</h2>
      </motion.div>

      {/* Feature Slider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="h-[120px] w-full max-w-sm mb-12 relative flex flex-col items-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <span className="text-4xl mb-3">{features[currentSlide].icon}</span>
            <h3 className="text-lg font-medium text-[#E8EAF0]">{features[currentSlide].title}</h3>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-0 flex gap-2">
          {features.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentSlide ? 'w-6 bg-[#39FF14] shadow-[0_0_8px_#39FF1460]' : 'w-1.5 bg-[#2A2F38]'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Next Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="w-full max-w-xs"
      >
        <CyberButton
          variant="primary"
          glow
          fullWidth
          size="lg"
          icon={<ArrowRight size={18} />}
          onClick={() => window.location.href = '/onboarding/setup'}
        >
          เริ่มต้นใช้งาน
        </CyberButton>
      </motion.div>
    </div>
  );
}
