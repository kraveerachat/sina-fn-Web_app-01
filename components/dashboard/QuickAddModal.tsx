'use client';

// ═══════════════════════════════════════════════════════════════════
// QuickAddModal — Fast Transaction Entry (Minimal / Modern / Clean)
// ═══════════════════════════════════════════════════════════════════

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  X, Plus, ArrowUp, ArrowDown, Check, Delete, Mic,
  Utensils, Coffee, Car, ShoppingBag, Clapperboard,
  Heart, FileText, Package, GraduationCap,
  Briefcase, TrendingUp, Gift, Landmark, Coins,
  type LucideIcon,
} from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import Portal from '@/components/ui/Portal';
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useAuth }    from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
import { useToast }   from '@/hooks/useToast';
import { addTransaction } from '@/lib/supabase/queries';
import { dispatchAppMutate } from '@/lib/events';

// ── Props ──────────────────────────────────────────────────────────
interface QuickAddModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  onSave?:  () => void;
}

// ── Category definitions ───────────────────────────────────────────
interface CategoryDef {
  icon: LucideIcon;
  name: string;
}

const EXPENSE_CATEGORIES: CategoryDef[] = [
  { icon: Utensils,      name: 'อาหาร' },
  { icon: Coffee,        name: 'เครื่องดื่ม' },
  { icon: Car,           name: 'เดินทาง' },
  { icon: ShoppingBag,   name: 'ช้อปปิ้ง' },
  { icon: Clapperboard,  name: 'บันเทิง' },
  { icon: Heart,         name: 'สุขภาพ' },
  { icon: GraduationCap, name: 'การศึกษา' },
  { icon: FileText,      name: 'บิล' },
  { icon: Package,       name: 'อื่นๆ' },
];

const INCOME_CATEGORIES: CategoryDef[] = [
  { icon: Briefcase,  name: 'เงินเดือน' },
  { icon: TrendingUp, name: 'ลงทุน' },
  { icon: Coins,      name: 'รายได้เสริม' },
  { icon: Gift,       name: 'โบนัส' },
  { icon: Landmark,   name: 'ดอกเบี้ย' },
  { icon: Package,    name: 'อื่นๆ' },
];

const NUMPAD_KEYS = ['7','8','9','4','5','6','1','2','3','.','0','DEL'] as const;

// ── Framer-motion variants (explicitly typed to fix TS2322) ────────
const gridVariants: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.14 } },
};

// ═══════════════════════════════════════════════════════════════════
export default function QuickAddModal({ isOpen, onClose, onSave }: QuickAddModalProps) {

  // ── State ──
  const [amount,           setAmount]           = useState('');
  const [txType,           setTxType]           = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [note,             setNote]             = useState('');
  const [saving,           setSaving]           = useState(false);
  const [saved,            setSaved]            = useState(false);

  const noteRef = useRef<HTMLInputElement>(null);

  // ── Hooks ──
  const { user }                             = useAuth();
  const { wallets, refetch: refetchWallets } = useWallets(user?.id);
  const { toast }                            = useToast();

  const defaultWalletId   = wallets[0]?.id ?? '';
  const effectiveWalletId = selectedWalletId || defaultWalletId;
  const categories        = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // ── Tab switch — reset category inline (no useEffect to avoid cascading setState) ──
  const handleSetTxType = (type: 'expense' | 'income') => {
    setTxType(type);
    setSelectedCategory(null);
  };

  // ── Numpad ──
  const handleNumpad = useCallback((val: string) => {
    if (val === 'DEL') { setAmount(prev => prev.slice(0, -1)); return; }
    if (val === '.') {
      setAmount(prev => prev.includes('.') ? prev : (prev === '' ? '0.' : prev + '.'));
      return;
    }
    setAmount(prev => {
      const parts = prev.split('.');
      if (parts[1] && parts[1].length >= 2) return prev;
      if (!prev.includes('.') && parts[0].length >= 10) return prev;
      return prev + val;
    });
  }, []);

  // ── Category select — auto-focus note ──
  const handleCategorySelect = useCallback((name: string) => {
    setSelectedCategory(name);
    setTimeout(() => noteRef.current?.focus(), 100);
  }, []);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    const parsed = parseFloat(amount);
    if (!amount || !selectedCategory || parsed <= 0) return;
    if (!user) { toast('กรุณาเข้าสู่ระบบก่อน', 'error'); return; }
    if (!effectiveWalletId) { toast('กรุณาเพิ่มกระเป๋าเงินก่อน', 'warning'); return; }

    try {
      setSaving(true);
      await addTransaction(
        {
          note:             note || selectedCategory,
          categoryName:     selectedCategory,
          amount:           parsed,
          type:             txType,
          transaction_date: new Date().toISOString(),
          walletId:         effectiveWalletId,
          walletName:       wallets.find(w => w.id === effectiveWalletId)?.name ?? 'กระเป๋าหลัก',
          walletType:       wallets.find(w => w.id === effectiveWalletId)?.type ?? 'cash',
          emoji:            '💸',
        },
        user.id
      );

      setSaved(true);
      toast(`บันทึกแล้ว — ${txType === 'expense' ? '-' : '+'}${formatCurrency(parsed)}`, 'success');
      await refetchWallets();
      dispatchAppMutate();

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
  }, [amount, selectedCategory, user, effectiveWalletId, note, txType, wallets, toast, refetchWallets, onClose, onSave]);

  // ── Close + reset ──
  const handleClose = useCallback(() => {
    if (saving) return;
    setAmount(''); setNote(''); setSelectedCategory(null);
    setSelectedWalletId(''); setSaved(false);
    onClose();
  }, [saving, onClose]);

  // ── Desktop keyboard support ──
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key >= '0' && e.key <= '9')               { e.preventDefault(); handleNumpad(e.key); }
      else if (e.key === '.' || e.key === ',')         { e.preventDefault(); handleNumpad('.'); }
      else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); handleNumpad('DEL'); }
      else if (e.key === 'Enter')                      { e.preventDefault(); handleSubmit(); }
      else if (e.key === 'Escape')                     { e.preventDefault(); handleClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleNumpad, handleSubmit, handleClose]);

  const displayAmount = amount || '0';
  const isValid       = !!amount && parseFloat(amount) > 0 && !!selectedCategory;
  const isExpense     = txType === 'expense';

  // ── Accent classes (pure Tailwind, no CSS vars) ────────────────
  const accentText   = isExpense ? 'text-rose-400'     : 'text-emerald-400';
  const accentBorder = isExpense ? 'border-rose-400'   : 'border-emerald-400';
  const accentBg     = isExpense ? 'bg-rose-400/10'    : 'bg-emerald-400/10';

  return (
    <Portal lockScroll={isOpen}>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] h-[100dvh] w-screen flex items-end justify-center lg:items-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-md max-h-[92vh] rounded-t-2xl lg:rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden flex flex-col shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
          >

            {/* ── Success overlay ── */}
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-zinc-900/95 flex flex-col items-center justify-center gap-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="w-16 h-16 rounded-full bg-emerald-400/10 border-2 border-emerald-400 flex items-center justify-center"
                  >
                    <Check size={28} className="text-emerald-400" />
                  </motion.div>
                  <p className="text-sm font-medium text-zinc-100 tracking-wide">บันทึกสำเร็จ!</p>
                  <p className="text-xs text-zinc-400 font-mono">
                    {isExpense ? '-' : '+'}{formatCurrency(parseFloat(amount || '0'))}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0">
              <h2 className="text-sm font-semibold text-zinc-100 tracking-wide">บันทึกรายการ</h2>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex px-5 gap-1 shrink-0">
              {(['expense', 'income'] as const).map((type) => {
                const active = txType === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleSetTxType(type)}
                    className={[
                      'flex-1 flex items-center justify-center gap-2 py-2.5',
                      'text-xs font-medium tracking-wide uppercase',
                      'transition-all duration-200 relative rounded-t-lg',
                      active ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
                    ].join(' ')}
                  >
                    {type === 'expense'
                      ? <ArrowDown size={14} className={active ? 'text-rose-400' : ''} />
                      : <ArrowUp   size={14} className={active ? 'text-emerald-400' : ''} />
                    }
                    <span>{type === 'expense' ? 'รายจ่าย' : 'รายรับ'}</span>

                    {active && (
                      <motion.span
                        layoutId="tab-underline"
                        className={`absolute bottom-0 left-2 right-2 h-[2px] rounded-full ${type === 'expense' ? 'bg-rose-400' : 'bg-emerald-400'}`}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-700 mx-5" />

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Amount */}
              <div className="text-center py-3">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">จำนวนเงิน</p>
                <motion.p
                  key={amount}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.1 }}
                  className={`text-4xl font-bold font-mono tracking-tight ${accentText}`}
                >
                  ฿{displayAmount}
                </motion.p>
              </div>

              {/* Note */}
              <div className="relative">
                <input
                  ref={noteRef}
                  type="text"
                  placeholder="โน้ต (ไม่จำเป็น)"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/40 transition-colors"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-md">
                  <Mic size={14} />
                </button>
              </div>

              {/* Categories */}
              <div>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-3">หมวดหมู่</p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={txType}
                    variants={gridVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="grid grid-cols-3 gap-2.5"
                  >
                    {categories.map((cat) => {
                      const Icon       = cat.icon;
                      const isSelected = selectedCategory === cat.name;
                      return (
                        <motion.button
                          key={cat.name}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => handleCategorySelect(cat.name)}
                          className={[
                            'flex flex-col items-center gap-1.5 rounded-lg p-3',
                            'text-center transition-all duration-200 border',
                            isSelected
                              ? `${accentBg} ${accentBorder} ${accentText}`
                              : 'border-transparent bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700',
                          ].join(' ')}
                        >
                          <Icon size={20} strokeWidth={1.6} />
                          <span className="text-[10px] tracking-wide uppercase truncate w-full">
                            {cat.name}
                          </span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Wallet selector — only when multiple wallets */}
              {wallets.length > 1 && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">กระเป๋าเงิน</p>
                  <div className="flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 hide-scrollbar">
                    {wallets.map(wallet => (
                      <button
                        key={wallet.id}
                        onClick={() => setSelectedWalletId(wallet.id)}
                        className={[
                          'shrink-0 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-all duration-200',
                          effectiveWalletId === wallet.id
                            ? 'bg-violet-500 text-white border-violet-500 font-medium'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-violet-500/30',
                        ].join(' ')}
                      >
                        {wallet.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2">
                {NUMPAD_KEYS.map(key => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNumpad(key)}
                    className={[
                      'flex h-12 items-center justify-center rounded-lg border',
                      'text-lg font-mono transition-all duration-150',
                      key === 'DEL'
                        ? 'bg-rose-400/10 border-rose-400/20 text-rose-400 hover:bg-rose-400/15'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700',
                    ].join(' ')}
                  >
                    {key === 'DEL' ? <Delete size={18} /> : key}
                  </motion.button>
                ))}
              </div>

            </div>{/* end scrollable body */}

            {/* ── Submit ── */}
            <div className="flex-shrink-0 p-4 border-t border-zinc-700 bg-zinc-900">
              <CyberButton
                variant={isExpense ? 'danger' : 'primary'}
                fullWidth
                glow
                size="lg"
                icon={<Plus size={18} />}
                onClick={handleSubmit}
                disabled={!isValid}
                loading={saving}
              >
                {isExpense ? 'บันทึกรายจ่าย' : 'บันทึกรายรับ'}
              </CyberButton>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
