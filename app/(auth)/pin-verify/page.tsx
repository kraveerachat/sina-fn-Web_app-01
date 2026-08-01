'use client';

// ═══════════════════════════════════════════════════════════════════
// PIN Verify — quiet lock screen
//
// Centered card with PIN dots and a clean numpad. Wrong PIN shakes
// the dots; correct PIN sets the session cookie and enters the app.
// Verification logic (Supabase pin_hash compare, cookies) unchanged.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Delete } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/store/appStore';

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'logout', '0', 'del'];

function NumKey({
  children,
  onClick,
  muted = false,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  muted?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`press tap flex h-16 items-center justify-center rounded-2xl border text-xl font-medium transition-colors ${
        muted
          ? 'border-transparent bg-transparent text-[13px] font-medium text-(--text-3) hover:text-(--red)'
          : 'border-(--border) bg-(--surface) text-(--text) hover:bg-(--surface-2) active:bg-(--surface-2)'
      }`}
    >
      {children}
    </button>
  );
}

export default function PinVerifyPage() {
  const userProfile = useAppStore((state) => state.userProfile);
  const nickname = userProfile?.nickname ?? '';

  const [pin, setPin] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

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

      const expected = btoa(`sina_pin:${code}`);
      const isCorrect = expected === profile.pin_hash;

      if (isCorrect) {
        setSuccess(true);
        setTimeout(() => {
          document.cookie = 'pin_verified=true; path=/; max-age=86400';
          window.location.href = '/';
        }, 900);
      } else {
        setShake(true);
        setTimeout(() => { setPin([]); setShake(false); setIsVerifying(false); }, 600);
      }
    } catch (err) {
      console.error('PIN verify error:', err);
      setShake(true);
      setTimeout(() => { setPin([]); setShake(false); setIsVerifying(false); }, 600);
    }
  }, []);

  const addDigit = useCallback((d: string) => {
    if (isVerifying) return;
    setPin((prev) => {
      if (prev.length >= 6) return prev;
      const next = [...prev, d];
      if (next.length === 6) verifyPin(next.join(''));
      return next;
    });
  }, [isVerifying, verifyPin]);

  const delDigit = useCallback(() => {
    if (isVerifying) return;
    setPin((p) => p.slice(0, -1));
  }, [isVerifying]);

  const handleLogout = async () => {
    document.cookie = 'pin_verified=; path=/; max-age=0';
    document.cookie = 'auth-session=; path=/; max-age=0';
    await supabase.auth.signOut();
    window.location.href = '/onboarding/welcome';
  };

  // Hardware keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) addDigit(e.key);
      if (e.key === 'Backspace') delDigit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addDigit, delDigit]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[380px] rounded-3xl border border-(--border) bg-(--surface) p-8 shadow-(--shadow-lg)"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors duration-300 ${
              success ? 'bg-(--green)' : 'bg-(--blue-soft)'
            }`}
          >
            {success ? (
              <Check size={24} className="text-white" />
            ) : (
              <Lock size={22} className="text-(--blue)" />
            )}
          </div>
          <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-(--text)">
            {success ? 'ปลดล็อกสำเร็จ' : 'ใส่รหัส PIN'}
          </h1>
          <p className="mt-1 text-[13px] text-(--text-2)">
            {success
              ? 'กำลังเข้าสู่แดชบอร์ด...'
              : nickname
                ? `ยินดีต้อนรับกลับ, ${nickname}`
                : 'ยืนยันตัวตนเพื่อเข้าใช้งาน'}
          </p>
        </div>

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [0, -10, 10, -7, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-9 flex justify-center gap-3.5"
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <span
                key={i}
                className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                  shake
                    ? 'border-(--red) bg-(--red)'
                    : filled
                      ? 'border-(--blue) bg-(--blue) scale-110'
                      : 'border-(--surface-3) bg-transparent'
                }`}
              />
            );
          })}
        </motion.div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2.5">
          {PAD_KEYS.map((k) => {
            if (k === 'logout') {
              return (
                <NumKey key={k} onClick={handleLogout} muted label="Log out">
                  ออกจากระบบ
                </NumKey>
              );
            }
            if (k === 'del') {
              return (
                <NumKey key={k} onClick={delDigit} label="Delete digit">
                  <Delete size={20} className="text-(--text-2)" />
                </NumKey>
              );
            }
            return (
              <NumKey key={k} onClick={() => addDigit(k)} label={`Digit ${k}`}>
                {k}
              </NumKey>
            );
          })}
        </div>

        {/* Feedback */}
        <div className="mt-5 min-h-[18px] text-center">
          {isVerifying && !shake && !success && (
            <span className="text-[13px] text-(--text-3)">กำลังตรวจสอบ...</span>
          )}
          {shake && (
            <span className="text-[13px] font-medium text-(--red)">
              รหัส PIN ไม่ถูกต้อง ลองอีกครั้ง
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
