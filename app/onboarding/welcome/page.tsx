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
      {/* Hero Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="mb-8 flex flex-col items-center"
      >
        <div className="relative mb-4 flex items-center justify-center">
          <img
            src="/logo-sn.png"
            alt="Sina_FN Logo"
            className="h-24 w-24 object-contain filter drop-shadow-[0_8px_30px_rgba(0,122,255,0.35)]"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-(--text)">Sina_FN</h1>
      </motion.div>

      {/* Welcome Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12 space-y-2"
      >
        <p className="text-[13px] text-(--text-2)">Personal Finance</p>
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-(--text)">ยินดีต้อนรับ, {nickname}</h2>
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
            <h3 className="text-lg font-medium text-[var(--text)]">{features[currentSlide].title}</h3>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-0 flex gap-2">
          {features.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentSlide ? 'w-6 bg-(--blue)' : 'w-1.5 bg-(--surface-3)'
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
          onClick={() => window.location.href = '/register'}
        >
          สมัครสมาชิก
        </CyberButton>
      </motion.div>
    </div>
  );
}
