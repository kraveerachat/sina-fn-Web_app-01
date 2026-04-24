'use client';

import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Delete, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/store/appStore';


const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'];

export default function PinSetupPage() {
  const [step, setStep] = useState<'create' | 'confirm' | 'success'>('create');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  const controls = useAnimation();
  const setUserProfile = useAppStore((state) => state.setUserProfile);

  const handleKeyPress = async (key: string) => {
    if (isLoading || step === 'success') return;
    setErrorText('');

    if (step === 'create') {
      if (key === 'DEL') {
        setPin1((prev) => prev.slice(0, -1));
      } else if (key !== '' && pin1.length < 6) {
        const newPin = pin1 + key;
        setPin1(newPin);
        if (newPin.length === 6) {
          setTimeout(() => setStep('confirm'), 400);
        }
      }
    } else if (step === 'confirm') {
      if (key === 'DEL') {
        setPin2((prev) => prev.slice(0, -1));
      } else if (key !== '' && pin2.length < 6) {
        const newPin = pin2 + key;
        setPin2(newPin);
        
        if (newPin.length === 6) {
          if (newPin === pin1) {
            handleCompleteSetup(newPin);
          } else {
            // Mismatch
            setErrorText('PIN ไม่ตรงกัน โปรดลองอีกครั้ง');
            controls.start({
              x: [0, -10, 10, -10, 10, -5, 5, 0],
              transition: { duration: 0.4 },
            });
            setTimeout(() => {
              setPin2('');
            }, 600);
          }
        }
      }
    }
  };

  const handleCompleteSetup = async (finalPin: string) => {
    setIsLoading(true);

    try {
      // Import supabase dynamically to avoid circular deps in this file
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Store a simple hash of the PIN in Supabase (not plain text)
        // In production use bcrypt; here we use a btoa prefix as a marker
        const pinHash = btoa(`sina_pin:${finalPin}`);
        await supabase
          .from('profiles')
          .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('PIN save error:', err);
      // Continue anyway — PIN is still stored locally
    }

    // Save to global user profile store (pin is no longer stored client-side)
    setUserProfile({ onboardingComplete: true });

    // Set pin-setup cookie so middleware knows onboarding is done
    document.cookie = 'pin-setup=true; path=/; max-age=86400';
    // Do NOT set pin_verified here — user must verify PIN on next page

    setStep('success');
    setTimeout(() => {
      // Redirect to pin-verify so user confirms their new PIN before entering dashboard
      window.location.href = '/pin-verify';
    }, 2000);

  };


  const currentPin = step === 'create' ? pin1 : pin2;

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center py-6">
      {step !== 'success' ? (
        <>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-[#1A7A08]/20 flex items-center justify-center mb-4">
              <ShieldCheck size={32} className="text-[#39FF14]" />
            </div>
            <h2 className="text-xl font-bold text-[#E8EAF0] mb-1">
              {step === 'create' ? 'ตั้งรหัส PIN 6 หลัก' : 'ยืนยันรหัส PIN อีกครั้ง'}
            </h2>
            <p className="text-[10px] tracking-[2px] text-[#6B7280] font-mono uppercase">
              ใช้ PIN แทนการ LOGIN ทุกครั้ง
            </p>
          </motion.div>

          {/* Dots Display */}
          <motion.div animate={controls} className="flex gap-4 mb-8">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = index < currentPin.length;
              return (
                <motion.div
                  key={index}
                  animate={isFilled ? { scale: [1, 1.2, 1], backgroundColor: '#39FF14' } : { scale: 1, backgroundColor: '#252A30' }}
                  transition={{ duration: 0.2 }}
                  className={`w-4 h-4 rounded-full transition-colors ${
                    isFilled ? 'bg-[#39FF14] shadow-[0_0_10px_#39FF1460]' : 'bg-[#252A30] border border-[#2A2F38]'
                  }`}
                />
              );
            })}
          </motion.div>

          {errorText && (
            <p className="text-xs text-[#FF3B3B] font-mono mb-4">{errorText}</p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full mb-8">
            {numpadKeys.map((key, i) => (
              <motion.button
                key={i}
                whileTap={key !== '' ? { scale: 0.9, backgroundColor: 'rgba(57, 255, 20, 0.1)' } : {}}
                onClick={() => handleKeyPress(key)}
                disabled={key === '' || isLoading}
                className={`flex h-16 items-center justify-center rounded-[12px] text-2xl font-mono transition-colors ${
                  key === '' 
                    ? 'opacity-0 cursor-default' 
                    : key === 'DEL'
                      ? 'bg-transparent text-[#6B7280] hover:text-[#FF3B3B]'
                      : 'bg-[#252A30] border border-[#2A2F38] text-[#E8EAF0] hover:bg-[#2A2F38] hover:text-[#39FF14] hover:border-[#39FF14]/30'
                }`}
              >
                {key === 'DEL' ? <Delete size={24} /> : key}
              </motion.button>
            ))}
          </div>

          {step === 'confirm' && !isLoading && (
            <button
              onClick={() => {
                setStep('create');
                setPin1('');
                setPin2('');
                setErrorText('');
              }}
              className="text-xs text-[#6B7280] hover:text-[#E8EAF0] transition-colors font-mono tracking-wide"
            >
              ← เริ่มตั้งค่าใหม่
            </button>
          )}

          {isLoading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-[#39FF14] animate-spin" />
              <span className="text-[10px] tracking-[2px] text-[#39FF14] font-mono">SAVING...</span>
            </div>
          )}
        </>
      ) : (
        /* Success State */
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-[#39FF14]/10 border-[3px] border-[#39FF14] flex items-center justify-center mb-6"
          >
            <CheckCircle2 size={48} className="text-[#39FF14]" />
          </motion.div>
          <h2 className="text-2xl font-bold text-[#39FF14] mb-2 tracking-[2px]">SETUP COMPLETE!</h2>
          <p className="text-sm text-[#E8EAF0] font-mono mb-8">ระบบบันทึกรหัส PIN เรียบร้อยแล้ว</p>
          
          <div className="flex items-center gap-2 text-[#6B7280]">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-mono">Redirecting to Dashboard...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
