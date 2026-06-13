'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';
import Link from 'next/link';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const setUserProfile = useAppStore((state) => state.setUserProfile);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nickname || !email || !password || !confirmPassword) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // 1. Supabase Auth Registration (skip email confirmation)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: { name, nickname },
        },
      });

      if (authError) throw authError;

      // 2. Get user from authData (already available, no extra getUser() call needed)
      const user = authData.user;
      if (!user) throw new Error('Registration failed, no user returned.');

      // 3. Insert full profile row
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        name: name,
        persona: 'employee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      // 4. Create default wallet
      const { error: walletError } = await supabase.from('wallets').insert({
        user_id: user.id,
        name: 'กระเป๋าหลัก',
        icon: '💰',
        balance: 0,
        type: 'cash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
      });

      if (walletError) {
        console.error('Wallet creation error:', walletError);
      }

      // 5. Sync local store
      setUserProfile({ name, nickname, email });

      // 6. Set auth cookie (use session from signUp response or fallback)
      const token = authData.session?.access_token || 'registered';
      document.cookie = `auth-session=${token}; path=/; max-age=86400`;

      // 7. Redirect to PIN setup — next step in onboarding flow
      window.location.href = '/onboarding/pin-setup';
    } catch (err: unknown) {
      setError((err as Error).message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo / Brand */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-(--blue) to-(--blue-ink) p-1.5 shadow-[0_8px_24px_color-mix(in_srgb,var(--blue)_35%,transparent)]">
          <img src="/logo-sn.png" alt="Sina_FN Logo" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-(--text)">
          สร้างบัญชีใหม่
        </h1>
        <p className="mt-1 text-[13px] text-(--text-2)">
          เริ่มต้นจัดการการเงินของคุณกับ Sina_FN
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-(--border) bg-(--surface) p-8 shadow-(--shadow-lg)"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <CyberInput
            type="text"
            placeholder="ชื่อ-นามสกุล"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User size={15} />}
          />

          <CyberInput
            type="text"
            placeholder="ชื่อเล่น"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            icon={<User size={15} />}
          />

          <CyberInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={15} />}
          />

          <CyberInput
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={15} />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-(--text-3) hover:text-(--text) transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          <CyberInput
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock size={15} />}
          />

          {error && (
            <p className="rounded-xl border border-(--red)/25 bg-(--red-soft) p-3 text-[13px] text-(--red)">
              {error}
            </p>
          )}

          <div className="pt-2">
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
              {isLoading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
            </CyberButton>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="flex items-center justify-center gap-1 text-[13px] text-(--text-2) hover:text-(--blue) transition-colors"
            >
              ← กลับสู่หน้า Login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
