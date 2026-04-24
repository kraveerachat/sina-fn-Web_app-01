'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
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

      // 7. Redirect immediately — no email confirmation required
      window.location.href = '/onboarding/welcome';
    } catch (err: unknown) {
      setError((err as Error).message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo / Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-xl font-bold text-[#E8EAF0] tracking-[4px] uppercase font-mono">SINA_FN</h1>
        <p className="text-[10px] tracking-[3px] text-[#39FF14] font-mono mt-1 uppercase">CREATE NEW RECORD</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-[16px] border border-[#2A2F38] bg-[#1F2328] overflow-hidden"
      >
        <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#39FF14]/30" />
        <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#39FF14]/30" />
        <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#39FF14]/30" />
        <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#39FF14]/30" />

        <div className="p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Full Name & Nickname — stacked full width */}
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <div className="flex items-center gap-2 rounded-[6px] border border-[#2A2F38] bg-[#252A30] group-focus-within:border-[#39FF14]/30 transition-all">
                  <span className="pl-3 text-[#374151]"><User size={14} /></span>
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent px-2 py-2.5 text-xs text-[#E8EAF0] placeholder-[#374151] outline-none font-mono"
                  />
                </div>
              </div>
              <div className="relative group">
                <div className="flex items-center gap-2 rounded-[6px] border border-[#2A2F38] bg-[#252A30] group-focus-within:border-[#39FF14]/30 transition-all">
                  <span className="pl-3 text-[#374151]"><User size={14} /></span>
                  <input
                    type="text"
                    placeholder="ชื่อเล่น"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="flex-1 bg-transparent px-2 py-2.5 text-xs text-[#E8EAF0] placeholder-[#374151] outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="relative group">
              <div className="flex items-center gap-2 rounded-[6px] border border-[#2A2F38] bg-[#252A30] group-focus-within:border-[#39FF14]/30 transition-all">
                <span className="pl-3 text-[#374151]"><Mail size={14} /></span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent px-2 py-2.5 text-xs text-[#E8EAF0] placeholder-[#374151] outline-none font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="flex items-center gap-2 rounded-[6px] border border-[#2A2F38] bg-[#252A30] group-focus-within:border-[#39FF14]/30 transition-all relative">
                <span className="pl-3 text-[#374151]"><Lock size={14} /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent px-2 py-2.5 pr-10 text-xs text-[#E8EAF0] placeholder-[#374151] outline-none font-mono"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#374151] hover:text-[#E8EAF0]"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            
            {/* Confirm Password */}
            <div className="relative group">
              <div className="flex items-center gap-2 rounded-[6px] border border-[#2A2F38] bg-[#252A30] group-focus-within:border-[#39FF14]/30 transition-all">
                <span className="pl-3 text-[#374151]"><Lock size={14} /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 bg-transparent px-2 py-2.5 text-xs text-[#E8EAF0] placeholder-[#374151] outline-none font-mono"
                />
              </div>
            </div>

            {error && (
              <p className="text-[10px] text-[#FF3B3B] font-mono border border-[#FF3B3B]/20 bg-[#FF3B3B]/5 p-2 rounded">⚠ {error}</p>
            )}

            <div className="pt-2">
              <CyberButton
                variant="primary"
                fullWidth
                glow
                type="submit"
                icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                disabled={isLoading}
              >
                {isLoading ? 'CREATING...' : 'สมัครสมาชิก'}
              </CyberButton>
            </div>
            
            <div className="pt-2 text-center">
              <Link href="/login" className="text-xs text-[#6B7280] hover:text-[#39FF14] transition-colors font-mono tracking-wide flex items-center justify-center gap-1">
                ← กลับสู่หน้า Login
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
