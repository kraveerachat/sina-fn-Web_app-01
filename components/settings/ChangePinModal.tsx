'use client';

// ═══════════════════════════════════════════════════════════════════
// ChangePinModal — 6-Digit PIN Update Flow
//
// Step 1: Enter current PIN (verified against profiles.pin_hash)
// Step 2: Enter new 6-digit PIN
// Step 3: Confirm new PIN
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { ShieldCheck, Loader2, Delete } from 'lucide-react';
import { motion } from 'framer-motion';
import SettingsModal from './SettingsModal';
import { verifyPin, updatePin } from '@/lib/supabase/queries';
import { useToast } from '@/hooks/useToast';

type PinStep = 'current' | 'new' | 'confirm';

const STEP_LABELS: Record<PinStep, string> = {
  current: 'ป้อน PIN ปัจจุบัน',
  new: 'ตั้ง PIN ใหม่ (6 หลัก)',
  confirm: 'ยืนยัน PIN ใหม่อีกครั้ง',
};

interface ChangePinModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'];

export default function ChangePinModal({ open, onClose, userId }: ChangePinModalProps) {
  const { toast } = useToast();

  const [step, setStep] = useState<PinStep>('current');
  const [pin, setPin] = useState('');
  const [newPinStore, setNewPinStore] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const resetState = useCallback(() => {
    setStep('current');
    setPin('');
    setNewPinStore('');
    setLoading(false);
    setError('');
    setShake(false);
  }, []);

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => {
      setPin('');
      setShake(false);
    }, 500);
  };

  const handlePinComplete = async (code: string) => {
    if (step === 'current') {
      setLoading(true);
      setError('');
      const valid = await verifyPin(userId, code);
      setLoading(false);
      if (valid) {
        setPin('');
        setStep('new');
      } else {
        setError('PIN ปัจจุบันไม่ถูกต้อง');
        triggerShake();
      }
    } else if (step === 'new') {
      setNewPinStore(code);
      setPin('');
      setStep('confirm');
    } else if (step === 'confirm') {
      if (code === newPinStore) {
        setLoading(true);
        setError('');
        try {
          await updatePin(userId, code);
          toast('เปลี่ยน PIN สำเร็จ', 'success');
          resetState();
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
          setLoading(false);
        }
      } else {
        setError('PIN ไม่ตรงกัน โปรดลองอีกครั้ง');
        triggerShake();
        // Go back to "new" step
        setTimeout(() => {
          setStep('new');
          setNewPinStore('');
          setError('');
        }, 800);
      }
    }
  };

  const handleKeyPress = (key: string) => {
    if (loading) return;
    setError('');

    if (key === 'DEL') {
      setPin((p) => p.slice(0, -1));
    } else if (key !== '' && pin.length < 6) {
      const next = pin + key;
      setPin(next);
      if (next.length === 6) {
        handlePinComplete(next);
      }
    }
  };

  const stepNum = step === 'current' ? 1 : step === 'new' ? 2 : 3;

  return (
    <SettingsModal
      open={open}
      onClose={handleClose}
      title="CHANGE PIN"
      subtitle={`STEP ${stepNum}/3`}
      icon={<ShieldCheck size={20} className="text-[var(--cyber-green)]" />}
    >
      <div className="space-y-5">
        {/* Step label */}
        <p className="text-sm text-[var(--cyber-text-secondary)] text-center font-mono">
          {STEP_LABELS[step]}
        </p>

        {/* PIN dots */}
        <motion.div
          className="flex justify-center gap-3"
          animate={shake ? { x: [0, -10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <motion.div
                key={i}
                animate={filled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`w-4 h-4 rounded-full transition-all ${
                  filled
                    ? 'bg-[var(--cyber-green)] shadow-[0_0_10px_var(--cyber-green-glow)]'
                    : 'bg-[var(--cyber-surface-alt)] border border-[var(--cyber-border)]'
                }`}
              />
            );
          })}
        </motion.div>

        {/* Error */}
        {error && (
          <p className="text-xs font-mono text-[var(--cyber-red)] text-center">{error}</p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center">
            <Loader2 size={20} className="text-[var(--cyber-green)] animate-spin" />
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
          {PAD_KEYS.map((key, i) => (
            <button
              key={i}
              onClick={() => handleKeyPress(key)}
              disabled={key === '' || loading}
              className={`h-14 flex items-center justify-center rounded-none text-lg font-mono transition-all ${
                key === ''
                  ? 'opacity-0 cursor-default'
                  : key === 'DEL'
                    ? 'bg-transparent text-[var(--cyber-text-muted)] hover:text-[var(--cyber-red)] border border-[var(--cyber-border)]'
                    : 'bg-[var(--cyber-surface)] border border-[var(--cyber-border)] text-[var(--cyber-text)] hover:bg-[var(--cyber-surface-alt)] hover:text-[var(--cyber-green)] hover:border-[var(--cyber-green)]/30'
              } disabled:opacity-30`}
            >
              {key === 'DEL' ? <Delete size={18} /> : key}
            </button>
          ))}
        </div>

        {/* Back button (step > 1) */}
        {step !== 'current' && !loading && (
          <button
            onClick={() => {
              setPin('');
              setError('');
              if (step === 'confirm') {
                setStep('new');
                setNewPinStore('');
              } else {
                setStep('current');
              }
            }}
            className="w-full text-center text-xs text-[var(--cyber-text-muted)] hover:text-[var(--cyber-text)] font-mono transition-colors"
          >
            ← ย้อนกลับ
          </button>
        )}
      </div>
    </SettingsModal>
  );
}
