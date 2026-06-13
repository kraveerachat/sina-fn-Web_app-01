'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/store/appStore';

export default function LoginPage() {
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      setIsLoading(true);
      setError('');

      // 1. Supabase Auth Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed, no user returned.');

      // 2. Clear stale PIN session cookie (force re-verify)
      document.cookie = 'pin_verified=; path=/; max-age=0';

      // 3. Sync local store
      setUserProfile({ name: email.split('@')[0], email: authData.user.email });

      // 4. Redirect to dashboard — proxy.ts handles the gate logic:
      //    • No PIN set → /onboarding/pin-setup
      //    • PIN set, no cookie → /pin-verify
      //    • Fully verified → /
      window.location.href = '/';


    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo / Brand */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br from-(--blue) to-(--blue-ink) p-2 shadow-[0_8px_24px_color-mix(in_srgb,var(--blue)_35%,transparent)]">
          <img src="/logo-sn.png" alt="Sina_FN Logo" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-(--text)">
          Sina_FN
        </h1>
        <p className="mt-1 text-[13px] text-(--text-2)">Personal Finance</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl border border-(--border) bg-(--surface) p-8 shadow-(--shadow-lg)"
      >
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-(--text)">
              เข้าสู่ระบบ
            </h2>
            <p className="mt-0.5 text-[13px] text-(--text-3)">
              ลงชื่อเข้าใช้เพื่อจัดการการเงินของคุณ
            </p>
          </div>

          <div className="space-y-4">
            <CyberInput
              type="text"
              placeholder="Username or Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
            />

            <CyberInput
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-(--text-3) hover:text-(--text) transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          {error && (
            <p className="rounded-xl border border-(--red)/25 bg-(--red-soft) p-3 text-[13px] text-(--red)">
              {error}
            </p>
          )}

          <CyberButton
            variant="primary"
            fullWidth
            glow
            size="lg"
            type="submit"
            icon={
              isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )
            }
            disabled={isLoading}
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </CyberButton>

          <div className="mt-4 border-t border-(--border-2) pt-4 text-center">
            <Link
              href="/register"
              className="text-[13px] text-(--text-2) hover:text-(--blue) transition-colors"
            >
              ยังไม่มีบัญชี? <span className="font-medium text-(--blue)">สมัครสมาชิก</span>
            </Link>
          </div>
        </form>
      </motion.div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-(--text-3)">
        Secured by Supabase Auth
      </p>
    </div>
  );
}
