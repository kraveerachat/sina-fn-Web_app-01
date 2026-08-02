'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/store/appStore';

type OAuthProvider = 'google' | 'facebook';

function GoogleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21 12.2c0-.6-.1-1.2-.2-1.8H12v3.5h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7z" />
      <path fill="#34A853" d="M12 21c2.4 0 4.5-.8 6-2.2l-3.1-2.4c-.8.6-1.9.9-2.9.9-2.3 0-4.2-1.5-4.9-3.6H3.9v2.5A9 9 0 0 0 12 21z" />
      <path fill="#FBBC05" d="M7.1 13.7a5.4 5.4 0 0 1 0-3.4V7.8H3.9a9 9 0 0 0 0 8.4z" />
      <path fill="#EA4335" d="M12 6.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 3.9 7.8l3.2 2.5C7.8 8.1 9.7 6.6 12 6.6z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'TH' | 'EN'>('TH');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'TH' ? 'EN' : 'TH'));
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(lang === 'TH' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError(lang === 'TH' ? 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
      return;
    }
    try {
      setIsLoading(true);
      setError('');

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed, no user returned.');

      document.cookie = 'pin_verified=; path=/; max-age=0';
      setUserProfile({ name: email.split('@')[0], email: authData.user.email });

      window.location.href = '/';
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    if (oauthLoading || isLoading) return;
    setError('');
    setOauthLoading(provider);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError((err as Error).message || `ไม่สามารถเข้าสู่ระบบด้วย ${provider} ได้`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-white dark:bg-[#0A0A0A]">
      {/* TOP-RIGHT CONTROLS (Theme & Language) */}
      {mounted && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            type="button"
            className="px-3.5 py-1.5 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/15 text-xs font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-white/30 dark:hover:bg-black/40 transition-all cursor-pointer shadow-sm"
          >
            {lang}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle theme"
            className="p-2 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/15 text-neutral-800 dark:text-neutral-100 hover:bg-white/30 dark:hover:bg-black/40 transition-all cursor-pointer shadow-sm"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      )}

      {/* BACKGROUND IMAGE LAYER (Matching Welcome Screen, No Overlays) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {mounted && (
          <Image
            src={
              isDark
                ? '/assets/images/welcome/WELCOME_SINA_FN_4K_DarkMode.png'
                : '/assets/images/welcome/WELCOME_SINA_FN_4K_LightMode.png'
            }
            alt="Sina_FN Background"
            fill
            priority
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      {/* AUTH CONTAINER & GLASSMORPHIC CARD */}
      <div className="relative z-10 w-full max-w-md my-auto">
        {/* Logo / Brand */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <div className="relative mb-3 inline-flex items-center justify-center">
            <img
              src="/logo-sn.png"
              alt="Sina_FN Logo"
              className="h-20 w-20 object-contain filter drop-shadow-[0_8px_30px_rgba(0,122,255,0.4)] transition-transform duration-300 hover:scale-105"
            />
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-neutral-900 dark:text-white drop-shadow-sm">
            Sina_FN
          </h1>
          <p className="mt-1 text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
            Personal Finance
          </p>
        </motion.div>

        {/* Glassmorphic Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl border border-white/30 dark:border-white/15 bg-white/20 dark:bg-black/40 backdrop-blur-2xl p-8 shadow-2xl"
        >
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight text-neutral-900 dark:text-white">
                {lang === 'TH' ? 'เข้าสู่ระบบ' : 'Sign In'}
              </h2>
              <p className="mt-0.5 text-[13px] text-neutral-600 dark:text-neutral-300">
                {lang === 'TH'
                  ? 'ลงชื่อเข้าใช้เพื่อจัดการการเงินของคุณ'
                  : 'Sign in to manage your financial portfolio'}
              </p>
            </div>

            <div className="space-y-4">
              <CyberInput
                type="text"
                placeholder={lang === 'TH' ? 'ชื่อผู้ใช้ หรือ อีเมล' : 'Username or Email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={16} />}
              />

              <CyberInput
                type={showPassword ? 'text' : 'password'}
                placeholder={lang === 'TH' ? 'รหัสผ่าน' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={16} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-600 dark:text-red-400">
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
              disabled={isLoading || oauthLoading !== null}
            >
              {isLoading
                ? lang === 'TH'
                  ? 'กำลังเข้าสู่ระบบ...'
                  : 'Signing in...'
                : lang === 'TH'
                ? 'เข้าสู่ระบบ'
                : 'Sign In'}
            </CyberButton>

            {/* OAuth providers */}
            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-white/20 dark:bg-white/10" />
              <span className="text-[12px] text-neutral-600 dark:text-neutral-400">
                {lang === 'TH' ? 'หรือดำเนินการต่อด้วย' : 'Or continue with'}
              </span>
              <span className="h-px flex-1 bg-white/20 dark:bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CyberButton
                variant="outline"
                size="md"
                fullWidth
                type="button"
                icon={<FacebookIcon />}
                loading={oauthLoading === 'facebook'}
                disabled={isLoading || oauthLoading !== null}
                onClick={() => handleOAuth('facebook')}
              >
                Facebook
              </CyberButton>
              <CyberButton
                variant="outline"
                size="md"
                fullWidth
                type="button"
                icon={<GoogleIcon />}
                loading={oauthLoading === 'google'}
                disabled={isLoading || oauthLoading !== null}
                onClick={() => handleOAuth('google')}
              >
                Google
              </CyberButton>
            </div>

            <div className="mt-4 border-t border-white/20 dark:border-white/10 pt-4 text-center">
              <Link
                href="/register"
                className="text-[13px] text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {lang === 'TH' ? 'ยังไม่มีบัญชี?' : "Don't have an account?"}{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {lang === 'TH' ? 'สมัครสมาชิก' : 'Sign Up'}
                </span>
              </Link>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-neutral-600 dark:text-neutral-400">
          Secured by Supabase Auth
        </p>
      </div>
    </div>
  );
}
