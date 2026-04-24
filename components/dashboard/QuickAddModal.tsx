'use client';

// ═══════════════════════════════════════════════════════════════════
// QuickAddModal — Fast Transaction Entry
// Uses hooks exclusively — no direct Supabase calls in this component.
// ═══════════════════════════════════════════════════════════════════

import { motion, AnimatePresence }  from 'framer-motion';
import { X, Plus, ArrowUp, ArrowDown, Mic, Check, Delete } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import { useState }                      from 'react';
import { formatCurrency }           from '@/lib/utils';
import { useAuth }                  from '@/hooks/useAuth';
import { useWallets }               from '@/hooks/useWallets';
import { useToast }                 from '@/hooks/useToast';
import { addTransaction }                from '@/lib/supabase/queries';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful save so the parent can refresh its data */
  onSave?: () => void;
}

const CATEGORIES = [
  { emoji: '🍚', name: 'อาหาร' },
  { emoji: '☕', name: 'เครื่องดื่ม' },
  { emoji: '🚗', name: 'เดินทาง' },
  { emoji: '🛍️', name: 'ช้อปปิ้ง' },
  { emoji: '🎬', name: 'บันเทิง' },
  { emoji: '💊', name: 'สุขภาพ' },
  { emoji: '📄', name: 'บิล' },
  { emoji: '💰', name: 'รายได้' },
  { emoji: '📦', name: 'อื่นๆ' },
];

const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'DEL'];

export default function QuickAddModal({ isOpen, onClose, onSave }: QuickAddModalProps) {
  // ── Local UI state ──
  const [amount,            setAmount]            = useState('');
  const [txType,            setTxType]            = useState<'expense' | 'income'>('expense');
  const [selectedCategory,  setSelectedCategory]  = useState<string | null>(null);
  const [selectedWalletId,  setSelectedWalletId]  = useState('');
  const [note,              setNote]              = useState('');
  const [saving,            setSaving]            = useState(false);
  const [saved,             setSaved]             = useState(false);

  // ── Data hooks — no direct Supabase calls ──
  const { user }                         = useAuth();
  const { wallets, refetch: refetchWallets } = useWallets(user?.id);
  const { toast }                        = useToast();

  // Auto-select first wallet — derived, not set in an effect (avoids cascading renders)
  const defaultWalletId = wallets.length > 0 ? wallets[0].id : '';
  const effectiveWalletId = selectedWalletId || defaultWalletId;

  // ── Numpad handler ──
  const handleNumpad = (val: string) => {
    if (val === 'DEL') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (val === '.') {
      if (amount.includes('.')) return;
      setAmount((prev) => (prev === '' ? '0.' : prev + '.'));
    } else {
      const parts = amount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      if (!amount.includes('.') && parts[0].length >= 10) return;
      setAmount((prev) => prev + val);
    }
  };

  // ── Submit handler — all DB calls go through queries.ts ──
  const handleSubmit = async () => {
    if (!amount || !selectedCategory || parseFloat(amount) <= 0) return;
    if (!user) {
      toast('กรุณาเข้าสู่ระบบก่อน', 'error');
      return;
    }

    const walletId = effectiveWalletId;
    if (!walletId) {
      toast('กรุณาเพิ่มกระเป๋าเงินก่อน', 'warning');
      return;
    }

    try {
      setSaving(true);

      // Save transaction via queries layer
      // (getOrCreateCategory is called internally by addTransaction)
      await addTransaction(
        {
          note:             note || selectedCategory,
          categoryName:     selectedCategory,
          amount:           parseFloat(amount),
          type:             txType,
          transaction_date: new Date().toISOString(),
          walletId:         walletId,
          walletName:       wallets.find(w => w.id === walletId)?.name ?? 'กระเป๋าหลัก',
          emoji:            CATEGORIES.find(c => c.name === selectedCategory)?.emoji ?? '💸',
        },
        user.id
      );

      // Show success overlay
      setSaved(true);
      toast(
        `บันทึกแล้ว — ${txType === 'expense' ? '-' : '+'}${formatCurrency(parseFloat(amount))}`,
        'success'
      );

      // Refresh wallet data then close
      await refetchWallets();

      setTimeout(() => {
        setSaved(false);
        setSaving(false);
        setAmount('');
        setNote('');
        setSelectedCategory(null);
        setSelectedWalletId('');
        onClose();
        onSave?.();
      }, 1200);

    } catch (err) {
      setSaving(false);
      console.error('[QuickAddModal] save failed:', err);
      toast('บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  // ── Close + reset ──
  const handleClose = () => {
    if (saving) return; // prevent closing mid-save
    setAmount('');
    setNote('');
    setSelectedCategory(null);
    setSelectedWalletId('');
    setSaved(false);
    onClose();
  };

  const displayAmount = amount || '0';
  const isValid = !!amount && parseFloat(amount) > 0 && !!selectedCategory;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--cyber-bg)]/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="
              relative z-10 w-full max-w-md
              h-[95vh] md:max-h-[90vh]
              rounded-none border border-[var(--cyber-border)]
              bg-[var(--cyber-surface)] overflow-hidden flex flex-col
            "
          >
            {/* HUD corner accents on modal */}
            <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[var(--cyber-green)] opacity-30 pointer-events-none z-10" />
            <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[var(--cyber-green)] opacity-30 pointer-events-none z-10" />

            {/* Success overlay */}
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-[var(--cyber-surface)]/95 flex flex-col items-center justify-center gap-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="w-16 h-16 rounded-full bg-[var(--cyber-green)]/10 border-2 border-[var(--cyber-green)] flex items-center justify-center"
                  >
                    <Check size={28} className="text-[var(--cyber-green)]" />
                  </motion.div>
                  <p className="cyber-label-green tracking-[4px]">SAVED!</p>
                  <p className="text-xs text-[var(--cyber-text-secondary)] font-mono">
                    {txType === 'expense' ? '-' : '+'}{formatCurrency(parseFloat(amount || '0'))}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-[var(--cyber-border)] px-5 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-green)] hud-dot" />
                <span className="cyber-label-green">QUICK ADD // บันทึกด่วน</span>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center text-[var(--cyber-text-secondary)] hover:bg-[var(--cyber-surface-alt)] hover:text-[var(--cyber-red)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2">
                {(['expense', 'income'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTxType(type)}
                    className={`
                      flex-1 flex items-center justify-center gap-2
                      rounded-none py-2.5 text-xs tracking-[2px] uppercase
                      transition-all font-mono border
                      ${txType === type && type === 'expense'
                        ? 'bg-[var(--cyber-red-dim)] text-[var(--cyber-red)] border-[var(--cyber-red)]/30'
                        : txType === type && type === 'income'
                        ? 'bg-[var(--cyber-green-dim)] text-[var(--cyber-green)] border-[var(--cyber-green)]/30'
                        : 'bg-[var(--cyber-surface-alt)] text-[var(--cyber-text-secondary)] border-[var(--cyber-border)] hover:bg-[var(--cyber-border)]'
                      }
                    `}
                  >
                    {type === 'expense' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Amount display */}
              <div className="text-center py-2">
                <span className="cyber-label">AMOUNT (฿)</span>
                <motion.p
                  key={amount}
                  initial={{ scale: 1.04 }}
                  animate={{ scale: 1 }}
                  className={`text-4xl font-bold font-mono mt-1 tracking-tight ${
                    txType === 'expense' ? 'text-[var(--cyber-red)]' : 'text-[var(--cyber-green)]'
                  }`}
                >
                  ฿{displayAmount}
                </motion.p>
              </div>

              {/* Note input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="บันทึกรายการ..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="
                    w-full rounded-none border border-[var(--cyber-border)]
                    bg-[var(--cyber-surface-alt)] px-4 py-2.5
                    text-sm text-[var(--cyber-text)] placeholder-[var(--cyber-text-muted)]
                    outline-none focus:border-[var(--cyber-green)]/30 transition-colors font-mono
                  "
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--cyber-text-muted)] hover:text-[var(--cyber-green)] transition-colors">
                  <Mic size={14} />
                </button>
              </div>

              {/* Category grid */}
              <div>
                <p className="cyber-label mb-2">CATEGORY</p>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <motion.button
                      key={cat.name}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`
                        flex flex-col items-center gap-1 rounded-none p-2
                        text-center transition-all border
                        ${selectedCategory === cat.name
                          ? 'bg-[var(--cyber-green)]/10 border-[var(--cyber-green)]/30'
                          : 'bg-[var(--cyber-surface-alt)] border-transparent hover:border-[var(--cyber-border)]'
                        }
                      `}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className={`
                        text-[7px] tracking-[0.5px] uppercase truncate w-full font-mono
                        ${selectedCategory === cat.name ? 'text-[var(--cyber-green)]' : 'text-[var(--cyber-text-secondary)]'}
                      `}>
                        {cat.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Wallet selector */}
              <div>
                <p className="cyber-label mb-2">WALLET</p>
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  {wallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWalletId(wallet.id)}
                      className={`
                        px-3 py-1.5 rounded-none text-xs font-mono whitespace-nowrap border
                        transition-colors
                        ${selectedWalletId === wallet.id
                          ? 'bg-[var(--cyber-green)] text-[var(--cyber-bg)] border-[var(--cyber-green)]'
                          : 'bg-[var(--cyber-surface-alt)] text-[var(--cyber-text-secondary)] border-[var(--cyber-border)] hover:border-[var(--cyber-green)]/30'
                        }
                      `}
                    >
                      {wallet.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-1.5">
                {NUMPAD_KEYS.map((key) => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.93, backgroundColor: 'rgba(57, 255, 20, 0.08)' }}
                    onClick={() => handleNumpad(key)}
                    className={`
                      flex h-12 items-center justify-center
                      rounded-none border text-lg font-mono transition-colors
                      ${key === 'DEL'
                        ? 'bg-[var(--cyber-red-dim)]/30 border-[var(--cyber-red)]/20 text-[var(--cyber-red)] hover:bg-[var(--cyber-red-dim)]/50'
                        : 'bg-[var(--cyber-surface-alt)] border-[var(--cyber-border)] text-[var(--cyber-text)] hover:bg-[var(--cyber-border)]'
                      }
                    `}
                  >
                    {key === 'DEL' ? <Delete size={18} /> : key}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ── Sticky submit button ── */}
            <div className="flex-shrink-0 p-4 border-t border-[var(--cyber-border)] bg-[var(--cyber-surface)]">
              <CyberButton
                variant={txType === 'expense' ? 'danger' : 'primary'}
                fullWidth
                glow
                size="lg"
                icon={<Plus size={18} />}
                onClick={handleSubmit}
                disabled={!isValid}
                loading={saving}
              >
                {txType === 'expense' ? 'RECORD EXPENSE' : 'RECORD INCOME'}
              </CyberButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
