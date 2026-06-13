'use client';

// ═══════════════════════════════════════════════════════════════════
// WipeDataModal — Multi-Step Danger-Zone Confirmation
//
// 4-step security sequence:
//   Step 1: Enter account password  (verified via signInWithPassword)
//   Step 2: Enter 6-digit PIN       (verified against profiles.pin_hash)
//   Step 3: Type "DELETE" to confirm (text confirmation gate)
//
// Glassmorphism aesthetic: backdrop-blur-3xl, red-950/40, HUD corners.
// Framer Motion spring entrance/exit transitions.
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Loader2, Lock, ShieldCheck, Check, Delete } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { verifyUserPassword, verifyPin } from '@/lib/supabase/queries';

type WipeStep = 'password' | 'pin' | 'confirm';

const CONFIRM_WORD = 'DELETE';

interface WipeDataModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string;
  userId: string;
}

export default function WipeDataModal({
  open,
  onClose,
  onConfirm,
  userEmail,
  userId,
}: WipeDataModalProps) {
  const [step, setStep] = useState<WipeStep>('password');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const isConfirmed = confirmInput.trim().toUpperCase() === CONFIRM_WORD;

  const resetState = () => {
    setStep('password');
    setPassword('');
    setPin('');
    setConfirmInput('');
    setLoading(false);
    setError('');
    setShake(false);
  };

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  // Step 1: Verify password
  const handlePasswordVerify = async () => {
    if (!password.trim() || loading) return;
    setLoading(true);
    setError('');
    const valid = await verifyUserPassword(userEmail, password);
    setLoading(false);
    if (valid) {
      setStep('pin');
    } else {
      setError('รหัสผ่านไม่ถูกต้อง');
    }
  };

  // Step 2: Verify PIN
  const handlePinComplete = async (code: string) => {
    setLoading(true);
    setError('');
    const valid = await verifyPin(userId, code);
    setLoading(false);
    if (valid) {
      setStep('confirm');
    } else {
      setError('PIN ไม่ถูกต้อง');
      setShake(true);
      setTimeout(() => { setPin(''); setShake(false); }, 500);
    }
  };

  const handlePinKey = (key: string) => {
    if (loading) return;
    setError('');
    if (key === 'DEL') {
      setPin((p) => p.slice(0, -1));
    } else if (key !== '' && pin.length < 6) {
      const next = pin + key;
      setPin(next);
      if (next.length === 6) handlePinComplete(next);
    }
  };

  // Step 3: Final confirm
  const handleFinalConfirm = async () => {
    if (!isConfirmed || loading) return;
    setLoading(true);
    try {
      await onConfirm();
      resetState();
      onClose();
    } catch {
      // parent handles toast
    } finally {
      setLoading(false);
    }
  };

  const stepNum = step === 'password' ? 1 : step === 'pin' ? 2 : 3;

  const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'];

  return (
    <Portal lockScroll={open}>
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] h-[100dvh] w-screen flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-(--scrim) backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md backdrop-blur-3xl bg-red-950/40 border border-red-500/50 rounded-xl p-0 overflow-hidden shadow-none"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* HUD corner accents */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/60 pointer-events-none" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500/60 pointer-events-none" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500/60 pointer-events-none" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500/60 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-red-300 font-medium tracking-[0.04em]">
                    DANGER ZONE
                  </h2>
                  <p className="text-[10px] font-mono text-red-400/60 ">
                    STEP {stepNum} OF 3 — IDENTITY VERIFICATION
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 text-red-400/60 hover:text-red-300 transition-colors disabled:opacity-30"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 px-6 pb-4">
              {[
                { icon: <Lock size={10} />, label: 'PASSWORD' },
                { icon: <ShieldCheck size={10} />, label: 'PIN' },
                { icon: <Trash2 size={10} />, label: 'CONFIRM' },
              ].map((s, i) => {
                const isActive = i + 1 === stepNum;
                const isDone = i + 1 < stepNum;
                return (
                  <React.Fragment key={i}>
                    <div className={`w-6 h-6 rounded-xl border flex items-center justify-center ${
                      isDone
                        ? 'border-green-500/60 text-green-400 bg-green-500/10'
                        : isActive
                          ? 'border-red-400 text-red-400 bg-red-500/10'
                          : 'border-red-500/20 text-red-500/30'
                    }`}>
                      {isDone ? <Check size={10} /> : s.icon}
                    </div>
                    {i < 2 && (
                      <div className={`flex-1 h-px ${isDone ? 'bg-green-500/40' : 'bg-red-500/20'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Body */}
            <div className="px-6 pb-4 space-y-4">
              <AnimatePresence mode="wait">
                {/* ── Step 1: Password ── */}
                {step === 'password' && (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-red-200/80 leading-relaxed">
                      เพื่อความปลอดภัย กรุณายืนยันตัวตนด้วย<span className="text-red-300 font-bold">รหัสผ่านของคุณ</span>
                    </p>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="รหัสผ่านบัญชี"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handlePasswordVerify()}
                      className="w-full rounded-xl border bg-(--surface-2) px-4 py-3 text-sm font-mono text-red-200 placeholder-red-500/30 outline-none transition-all border-red-500/30 focus:border-red-400 shadow-none"
                    />
                  </motion.div>
                )}

                {/* ── Step 2: PIN ── */}
                {step === 'pin' && (
                  <motion.div
                    key="pin"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-red-200/80 text-center">
                      ป้อน <span className="text-red-300 font-bold">PIN 6 หลัก</span> ของคุณ
                    </p>

                    {/* PIN dots */}
                    <motion.div
                      className="flex justify-center gap-3"
                      animate={shake ? { x: [0, -10, 10, -10, 10, -5, 5, 0] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full transition-all ${
                            i < pin.length
                              ? 'bg-red-400 shadow-none'
                              : 'bg-red-900/40 border border-red-500/20'
                          }`}
                        />
                      ))}
                    </motion.div>

                    {/* Mini numpad */}
                    <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto">
                      {PAD_KEYS.map((key, i) => (
                        <button
                          key={i}
                          onClick={() => handlePinKey(key)}
                          disabled={key === '' || loading}
                          className={`h-11 flex items-center justify-center rounded-xl text-base font-mono transition-all ${
                            key === ''
                              ? 'opacity-0'
                              : key === 'DEL'
                                ? 'bg-transparent text-red-400/50 hover:text-red-300 border border-red-500/20'
                                : 'bg-red-900/20 border border-red-500/20 text-red-200 hover:bg-red-900/40 hover:text-red-100'
                          } disabled:opacity-20`}
                        >
                          {key === 'DEL' ? <Delete size={14} /> : key}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 3: Type DELETE ── */}
                {step === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-red-200/80 leading-relaxed">
                      การกระทำนี้จะ<span className="text-red-300 font-bold">ลบข้อมูลทั้งหมด</span>ของคุณ
                      รวมถึงธุรกรรม หนี้สิน เป้าหมาย และบิลรายเดือน
                      ข้อมูลจะ<span className="text-red-300 font-bold">ไม่สามารถกู้คืนได้</span>
                    </p>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-red-400/80 uppercase tracking-[0.04em]">
                        พิมพ์ &quot;{CONFIRM_WORD}&quot; เพื่อยืนยัน
                      </label>
                      <input
                        type="text"
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                        placeholder={CONFIRM_WORD}
                        disabled={loading}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleFinalConfirm()}
                        className="w-full rounded-xl border bg-(--surface-2) px-4 py-3 text-sm font-mono text-red-200 placeholder-red-500/30 outline-none transition-all disabled:opacity-50 border-red-500/30 focus:border-red-400 shadow-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <p className="text-xs font-mono text-red-400 text-center">{error}</p>
              )}

              {/* Loading */}
              {loading && step !== 'pin' && (
                <div className="flex justify-center">
                  <Loader2 size={18} className="text-red-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-(--border) bg-(--surface-2) text-sm font-medium text-(--text-2) hover:bg-(--surface-3) transition-all disabled:opacity-30"
              >
                ยกเลิก
              </button>
              {step === 'password' && (
                <button
                  onClick={handlePasswordVerify}
                  disabled={!password.trim() || loading}
                  className="flex-1 py-3 rounded-xl border border-red-500/30 bg-red-600/20 text-sm font-mono text-red-300 uppercase tracking-[0.04em] flex items-center justify-center gap-2 hover:bg-red-600/30 transition-all disabled:opacity-30"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  ยืนยันรหัสผ่าน
                </button>
              )}
              {step === 'confirm' && (
                <motion.button
                  onClick={handleFinalConfirm}
                  disabled={!isConfirmed || loading}
                  whileTap={isConfirmed && !loading ? { scale: 0.97 } : undefined}
                  className="flex-1 py-3 rounded-xl border font-mono text-sm uppercase tracking-[0.04em] flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-red-600/80 border-red-500/50 text-white hover:bg-red-500 shadow-none"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {loading ? 'กำลังลบ...' : 'ยืนยันการลบ'}
                </motion.button>
              )}
            </div>

            {/* Animated scan line */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent"
              animate={{ y: [0, 500, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}

// Need React import for JSX fragments used in step indicator
import React from 'react';
