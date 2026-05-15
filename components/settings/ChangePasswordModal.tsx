'use client';

// ═══════════════════════════════════════════════════════════════════
// ChangePasswordModal — Password Update Flow
//
// Step 1: Enter current password (verified via signInWithPassword)
// Step 2: Enter new password + confirm
// Uses supabase.auth.updateUser({ password })
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { verifyUserPassword, changePassword } from '@/lib/supabase/queries';
import { useToast } from '@/hooks/useToast';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function ChangePasswordModal({
  open,
  onClose,
  userEmail,
}: ChangePasswordModalProps) {
  const { toast } = useToast();

  const [step, setStep] = useState<'verify' | 'create'>('verify');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetState = () => {
    setStep('verify');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setShowCurrent(false);
    setShowNew(false);
    setLoading(false);
    setError('');
  };

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  const handleVerify = async () => {
    if (!currentPw.trim() || loading) return;
    setLoading(true);
    setError('');

    const valid = await verifyUserPassword(userEmail, currentPw);
    if (valid) {
      setStep('create');
    } else {
      setError('รหัสผ่านปัจจุบันไม่ถูกต้อง');
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (loading) return;
    setError('');

    if (newPw.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPw !== confirmPw) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPw);
      toast('เปลี่ยนรหัสผ่านสำเร็จ', 'success');
      resetState();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-none border border-[var(--cyber-border)] bg-[var(--cyber-surface)] px-4 py-3 pr-12 text-sm font-mono text-[var(--cyber-text)] placeholder-[var(--cyber-text-muted)] outline-none transition-all focus:border-[var(--cyber-amber)]/40 focus:shadow-[0_0_12px_rgba(255,179,0,0.1)]';

  return (
    <SettingsModal
      open={open}
      onClose={handleClose}
      title="CHANGE PASSWORD"
      subtitle={step === 'verify' ? 'STEP 1: VERIFY IDENTITY' : 'STEP 2: SET NEW PASSWORD'}
      icon={<Lock size={20} className="text-[var(--cyber-amber)]" />}
      accentBorder="border-[var(--cyber-amber)]/50"
      accentColor="var(--cyber-amber)"
    >
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-none border flex items-center justify-center text-[10px] font-mono ${
            step === 'verify'
              ? 'border-[var(--cyber-amber)] text-[var(--cyber-amber)] bg-[var(--cyber-amber)]/10'
              : 'border-[var(--cyber-green)] text-[var(--cyber-green)] bg-[var(--cyber-green)]/10'
          }`}>
            {step === 'create' ? <Check size={12} /> : '1'}
          </div>
          <div className="flex-1 h-px bg-[var(--cyber-border)]" />
          <div className={`w-6 h-6 rounded-none border flex items-center justify-center text-[10px] font-mono ${
            step === 'create'
              ? 'border-[var(--cyber-amber)] text-[var(--cyber-amber)] bg-[var(--cyber-amber)]/10'
              : 'border-[var(--cyber-border)] text-[var(--cyber-text-muted)]'
          }`}>
            2
          </div>
        </div>

        {step === 'verify' ? (
          /* Step 1: Verify current password */
          <div className="space-y-3">
            <label className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-[2px]">
              CURRENT PASSWORD
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="รหัสผ่านปัจจุบัน"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cyber-text-muted)] hover:text-[var(--cyber-text)]"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: New password */
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-[2px]">
                NEW PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                  autoFocus
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cyber-text-muted)] hover:text-[var(--cyber-text)]"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-[2px]">
                CONFIRM NEW PASSWORD
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="ยืนยันรหัสผ่านใหม่"
                onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs font-mono text-[var(--cyber-red)]">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-3 rounded-none border border-white/10 bg-white/5 text-sm font-mono text-[var(--cyber-text-secondary)] uppercase tracking-[2px] hover:bg-white/10 transition-all disabled:opacity-30"
          >
            ยกเลิก
          </button>
          <button
            onClick={step === 'verify' ? handleVerify : handleChangePassword}
            disabled={loading || (step === 'verify' ? !currentPw.trim() : !newPw.trim())}
            className="flex-1 py-3 rounded-none border border-[var(--cyber-amber)]/30 bg-[var(--cyber-amber)]/10 text-sm font-mono text-[var(--cyber-amber)] uppercase tracking-[2px] flex items-center justify-center gap-2 hover:bg-[var(--cyber-amber)]/20 transition-all disabled:opacity-30"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {step === 'verify' ? 'ยืนยัน' : 'เปลี่ยนรหัสผ่าน'}
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
