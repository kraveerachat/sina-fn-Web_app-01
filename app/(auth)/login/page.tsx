'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import CyberInput from '@/components/ui/CyberInput';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/store/appStore';

type OAuthProvider = 'google' | 'facebook';

// Brand glyphs (lucide ships no brand logos). Declared at module level so
// they keep a stable identity and never remount the buttons.
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
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

  // OAuth (Google / Facebook). signInWithOAuth performs a full-page redirect
  // to the provider, then back to redirectTo where the code is exchanged for
  // a session. We don't reset oauthLoading on success because the page leaves.
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
      // success → browser is redirecting; leave the spinner running.
    } catch (err: unknown) {
      setError((err as Error).message || `ไม่สามารถเข้าสู่ระบบด้วย ${provider} ได้`);
      setOauthLoading(null);
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
            disabled={isLoading || oauthLoading !== null}
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </CyberButton>

          {/* OAuth providers */}
          <div className="flex items-center gap-3 pt-1">
            <span className="h-px flex-1 bg-(--border)" />
            <span className="text-[12px] text-(--text-3)">หรือดำเนินการต่อด้วย</span>
            <span className="h-px flex-1 bg-(--border)" />
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
