'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
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

      // 2. Clear stale PIN session cookie
      document.cookie = 'pin_verified=; path=/; max-age=0';

      // 3. Check profile in Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, pin_hash')
        .eq('id', authData.user.id)
        .single();

      // 4. Sync local store
      setUserProfile({ name: email.split('@')[0], email: authData.user.email });

      // 5. Hard redirect based on profile state
      if (!profile) {
        window.location.href = '/onboarding/welcome';
      } else if (!profile.pin_hash) {
        window.location.href = '/onboarding/pin-setup';
      } else {
        window.location.href = '/pin-verify';
      }


    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo / Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[12px] bg-[#39FF14]/10 border border-[#39FF14]/20 mb-4">
          <span className="text-2xl font-bold text-[#39FF14] font-mono">S</span>
        </div>
        <h1 className="text-xl font-bold text-[#E8EAF0] tracking-[4px] uppercase font-mono">SINA_FN</h1>
        <p className="text-[10px] tracking-[3px] text-[#39FF14] font-mono mt-1 uppercase">PERSONAL FINANCE HUD</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative rounded-[16px] border border-[#2A2F38] bg-[#1F2328] overflow-hidden"
      >
        {/* HUD corner accents */}
        <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#39FF14]/30" />
        <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#39FF14]/30" />
        <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#39FF14]/30" />
        <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#39FF14]/30" />

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} className="text-[#39FF14]" />
              <span className="text-[10px] tracking-[3px] text-[#39FF14] font-mono uppercase">SECURE LOGIN</span>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div className="relative group">
                <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#2A2F38] group-focus-within:border-[#39FF14]/40 transition-colors" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#2A2F38] group-focus-within:border-[#39FF14]/40 transition-colors" />
                <div className="flex items-center gap-2 rounded-[6px] border border-[#2A2F38] bg-[#252A30] group-focus-within:border-[#39FF14]/30 group-focus-within:shadow-[0_0_12px_#39FF1410] transition-all">
                  <span className="pl-3 text-[#374151] group-focus-within:text-[#39FF14]/60 transition-colors">
                    <Mail size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Username or Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent px-2 py-3 text-sm text-[#E8EAF0] placeholder-[#374151] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="relative group">
                <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#2A2F38] group-focus-within:border-[#39FF14]/40 transition-colors" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#2A2F38] group-focus-within:border-[#39FF14]/40 transition-colors" />
                <div className="flex items-center gap-2 rounded-[6px] border border-[#2A2F38] bg-[#252A30] group-focus-within:border-[#39FF14]/30 group-focus-within:shadow-[0_0_12px_#39FF1410] transition-all relative">
                  <span className="pl-3 text-[#374151] group-focus-within:text-[#39FF14]/60 transition-colors">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent px-2 py-3 pr-10 text-sm text-[#E8EAF0] placeholder-[#374151] outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#374151] hover:text-[#E8EAF0] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-[10px] text-[#FF3B3B] font-mono border border-[#FF3B3B]/20 bg-[#FF3B3B]/5 p-2 rounded">⚠ {error}</p>
            )}

            <CyberButton
              variant="primary"
              fullWidth
              glow
              type="submit"
              icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              disabled={isLoading}
            >
              {isLoading ? 'AUTHENTICATING...' : 'เข้าสู่ระบบ'}
            </CyberButton>

            <div className="pt-4 border-t border-[#2A2F38] text-center mt-4">
              <Link href="/register" className="text-xs text-[#6B7280] hover:text-[#39FF14] transition-colors font-mono tracking-wide">
                ยังไม่มีบัญชี? สมัครสมาชิก
              </Link>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="text-center text-[8px] tracking-[2px] text-[#374151] font-mono mt-6 uppercase">
        SINA_FN // V0.1.0 // SECURED BY SUPABASE AUTH
      </p>
    </div>
  );
}
