'use client';

// ═══════════════════════════════════════════════════════════════════
// ConfirmationPreview — Holographic AI Transaction Confirmation
//
// Utopia Tokyo §5: Glass surface cards with animated AI-sparkle
// borders for AI-generated transactions. Premium glassmorphism
// replaces all solid backgrounds.
// ═══════════════════════════════════════════════════════════════════

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Check, X, Sparkles, Zap, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface PreviewTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  emoji: string;
  wallet_hint: string;
  currency?: string;
  amount_thb?: number | null;
  is_ai_generated?: boolean;
}

interface ConfirmationPreviewProps {
  transactions: PreviewTransaction[];
  status: 'pending' | 'saving' | 'saved' | 'cancelled';
  onConfirm: () => void;
  onCancel: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1, x: 0, scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 300 },
  },
};

const summaryVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.3 } },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1, y: 0,
    transition: { delay: 0.4, type: 'spring', damping: 22 },
  },
};

export default function ConfirmationPreview({
  transactions, status, onConfirm, onCancel,
}: ConfirmationPreviewProps) {
  if (transactions.length === 0) return null;

  const total = transactions.reduce(
    (sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0
  );
  const hasAiFlag = transactions.some((tx) => tx.is_ai_generated);

  return (
    <AnimatePresence mode="wait">
      {/* ── Saved state ── */}
      {status === 'saved' && (
        <motion.div
          key="saved"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 bg-[var(--cyber-green)]/5 border border-[var(--cyber-green)]/20 p-4 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-7 h-7 rounded-full bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/30 flex items-center justify-center"
            >
              <Check size={14} className="text-[var(--cyber-green)]" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-[var(--cyber-green)]">
                {transactions.length === 1
                  ? 'บันทึกรายการแล้ว'
                  : `บันทึก ${transactions.length} รายการแล้ว`}
              </p>
              <p className="text-[10px] text-[var(--cyber-text-muted)] mt-0.5 tnum">
                NET {formatCurrency(total, true)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Cancelled state ── */}
      {status === 'cancelled' && (
        <motion.div
          key="cancelled"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 mt-3 text-[var(--cyber-text-muted)] text-xs font-medium"
        >
          <X size={14} /> <span>ยกเลิกแล้ว</span>
        </motion.div>
      )}

      {/* ── Pending / Saving state ── */}
      {(status === 'pending' || status === 'saving') && (
        <motion.div
          key="preview"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mt-3 space-y-2"
        >
          {/* AI badge */}
          {hasAiFlag && (
            <motion.div
              variants={cardVariants}
              className="flex items-center gap-1.5 mb-1"
            >
              <Zap size={10} className="text-[var(--cyber-cyan)]" />
              <span className="text-[10px]  text-[var(--cyber-cyan)] tnum">
                AI-Generated
              </span>
            </motion.div>
          )}

          {/* Transaction cards — glassmorphism + AI sparkle */}
          {transactions.map((tx, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              className={`flex items-center gap-3 bg-(--surface-2) border border-(--border) p-3 rounded-xl hover:shadow-(--shadow-lg) transition-colors ${
                tx.is_ai_generated !== false ? 'ai-sparkle' : ''
              }`}
            >
              <motion.div
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  delay: i * 0.08 + 0.15,
                  type: 'spring',
                  damping: 14,
                }}
                className="w-9 h-9 rounded-full bg-(--surface-2) flex items-center justify-center text-lg shrink-0"
              >
                {tx.emoji}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--cyber-text)] truncate">
                  {tx.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[var(--cyber-text-muted)] tnum">
                    {tx.category}
                  </span>
                  {tx.currency && tx.currency !== 'THB' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cyber-cyan)]/10 text-[var(--cyber-cyan)] tnum">
                      {tx.currency}
                    </span>
                  )}
                </div>
              </div>
              <motion.p
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 + 0.2 }}
                className={`text-sm font-semibold tnum shrink-0 ${
                  tx.type === 'income'
                    ? 'text-[var(--cyber-green)]'
                    : 'text-[var(--cyber-red)]'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {formatCurrency(tx.amount)}
              </motion.p>
            </motion.div>
          ))}

          {/* Summary row */}
          <motion.div
            variants={summaryVariants}
            className="flex items-center justify-between pt-2 px-1 border-t border-(--border)"
          >
            <span className="text-xs text-[var(--cyber-text-muted)] font-medium tracking-wider">
              Total
            </span>
            <span className="text-sm font-bold tnum text-[var(--cyber-text)]">
              {formatCurrency(total, true)}
            </span>
          </motion.div>

          {/* Action buttons */}
          <motion.div variants={buttonVariants} className="flex gap-2 pt-2">
            <button
              onClick={onCancel}
              disabled={status === 'saving'}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg bg-transparent hover:bg-(--surface-2) text-[var(--cyber-text-muted)] transition-all disabled:opacity-40"
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={status === 'saving'}
              className="flex-[2] py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/40 text-[var(--cyber-green)] hover:bg-[var(--cyber-green)]/20 hover:border-[var(--cyber-green)] transition-all disabled:opacity-60"
            >
              {status === 'saving' ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Save{' '}
                  {transactions.length > 1
                    ? `${transactions.length} items`
                    : ''}
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
