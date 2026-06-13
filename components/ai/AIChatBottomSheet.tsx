'use client';

// ═══════════════════════════════════════════════════════════════════
// AIChatBottomSheet — Holographic AI Chat Panel
//
// Utopia Tokyo §5: Floating holographic panel with premium
// glassmorphism (bg-black/40 + backdrop-blur-3xl).
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
import { useToast } from '@/hooks/useToast';
import { addTransaction } from '@/lib/supabase/queries';
import { dispatchAppMutate } from '@/lib/events';
import Portal from '@/components/ui/Portal';
import ConfirmationPreview, { type PreviewTransaction } from './ConfirmationPreview';

const CASH_NAMES = ['cash', 'เงินสด', 'กระเป๋าหลัก'];

function matchWallet(
  hint: string,
  wallets: { id: string; name: string; type: string }[]
): string {
  if (wallets.length === 0) return '';
  const h = hint.toLowerCase().trim();
  const exact = wallets.find((w) => w.name.toLowerCase() === h);
  if (exact) return exact.id;
  const partial = wallets.find((w) => {
    const wn = w.name.toLowerCase();
    return wn.includes(h) || h.includes(wn);
  });
  if (partial) return partial.id;
  const cashWallet = wallets.find(
    (w) => CASH_NAMES.some((cn) => w.name.toLowerCase().includes(cn)) || w.type === 'cash'
  );
  return cashWallet?.id ?? wallets[0]?.id ?? '';
}

type SheetStatus = 'idle' | 'loading' | 'preview' | 'saving' | 'saved' | 'cancelled' | 'error';

interface SheetMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface AIChatBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const QUICK_INPUTS = ['กินข้าว 50', 'กาแฟ 65', 'เงินเดือน 25000'];

export default function AIChatBottomSheet({
  isOpen,
  onClose,
  onSaved,
}: AIChatBottomSheetProps) {
  const { user } = useAuth();
  const { wallets } = useWallets(user?.id);
  const { toast } = useToast();

  const [input, setInput] = useState('');
  const [status, setStatus] = useState<SheetStatus>('idle');
  const [messages, setMessages] = useState<SheetMessage[]>([]);
  const [parsedTxs, setParsedTxs] = useState<PreviewTransaction[]>([]);
  const [previewStatus, setPreviewStatus] = useState<
    'pending' | 'saving' | 'saved' | 'cancelled'
  >('pending');

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, status]);

  const handleClose = useCallback(() => {
    if (status === 'saving') return;
    setInput('');
    setMessages([]);
    setParsedTxs([]);
    setStatus('idle');
    setPreviewStatus('pending');
    onClose();
  }, [status, onClose]);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || status === 'loading' || status === 'saving') return;

      setInput('');
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text: msg },
      ]);
      setStatus('loading');
      setParsedTxs([]);

      try {
        const res = await fetch('/api/ai/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msg,
            wallets: wallets.map((w) => ({ name: w.name, type: w.type })),
          }),
        });
        const data = await res.json();

        if (
          data.intent === 'record_transaction' &&
          data.data?.transactions?.length > 0
        ) {
          const txs: PreviewTransaction[] = data.data.transactions;
          setParsedTxs(txs);
          setPreviewStatus('pending');
          setStatus('preview');
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: 'ai',
              text: `พบ ${txs.length} รายการ — ตรวจสอบแล้วกด Save`,
            },
          ]);
        } else if (data.data?.message) {
          setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: 'ai', text: data.data.message },
          ]);
          setStatus('idle');
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: 'ai',
              text: 'ลองพิมพ์รายจ่าย เช่น "กินข้าว 50"',
            },
          ]);
          setStatus('idle');
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'ai',
            text: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
          },
        ]);
        setStatus('error');
      }
    },
    [input, status, wallets]
  );

  const handleConfirm = useCallback(async () => {
    if (!user || parsedTxs.length === 0) return;
    if (wallets.length === 0) {
      toast('กรุณาเพิ่มกระเป๋าเงินก่อน', 'warning');
      return;
    }
    setPreviewStatus('saving');
    setStatus('saving');

    try {
      for (const tx of parsedTxs) {
        const walletId = matchWallet(tx.wallet_hint, wallets);
        if (!walletId) continue;
        await addTransaction(
          {
            note: tx.description,
            categoryName: tx.category || 'อื่นๆ',
            amount: tx.amount,
            type: tx.type,
            transaction_date: new Date().toISOString(),
            walletId,
            walletName:
              wallets.find((w) => w.id === walletId)?.name ?? 'กระเป๋าหลัก',
            walletType:
              wallets.find((w) => w.id === walletId)?.type ?? 'cash',
            emoji: tx.emoji || '💸',
            amount_thb: tx.amount_thb ?? tx.amount,
            currency: tx.currency ?? 'THB',
            is_ai_generated: true,
          },
          user.id
        );
      }
      setPreviewStatus('saved');
      setStatus('saved');
      toast(`บันทึก ${parsedTxs.length} รายการแล้ว`, 'success');
      dispatchAppMutate();
      onSaved?.();
    } catch (err) {
      console.error('[AIChatBottomSheet] save error:', err);
      toast('บันทึกไม่สำเร็จ กรุณาลองใหม่', 'error');
      setPreviewStatus('pending');
      setStatus('preview');
    }
  }, [user, parsedTxs, wallets, toast, onSaved]);

  const handleCancelPreview = useCallback(() => {
    setPreviewStatus('cancelled');
    setStatus('idle');
  }, []);

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
            className="absolute inset-0 bg-(--scrim) backdrop-blur-md"
            onClick={handleClose}
          />

          {/* ── Holographic Sheet ── */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="
              relative z-10 w-full max-w-md max-h-[80vh]
              rounded-t-2xl lg:rounded-2xl overflow-hidden flex flex-col
              bg-(--surface)
              border-t border-(--border)
              shadow-[0_-8px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(139,140,248,0.04)]
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-(--border)">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20 flex items-center justify-center rounded-lg">
                  <MessageSquare
                    size={13}
                    className="text-[var(--cyber-green)]"
                  />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--cyber-text)]">
                    Sina AI
                  </h2>
                  <p className="text-[10px] text-[var(--cyber-text-muted)] tnum">
                    QUICK RECORD
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cyber-text-muted)] hover:bg-(--surface-2) hover:text-[var(--cyber-text)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]"
            >
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <Bot
                    size={28}
                    className="text-[var(--cyber-green)]/30 mx-auto mb-3"
                  />
                  <p className="text-xs text-[var(--cyber-text-muted)]">
                    พิมพ์รายจ่าย เช่น &quot;กินข้าว 50 กาแฟ 65&quot;
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {QUICK_INPUTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="px-2.5 py-1 rounded-lg border border-(--border) bg-(--surface-2) text-[10px] tnum text-[var(--cyber-text-secondary)] hover:text-[var(--cyber-green)] hover:border-[var(--cyber-green)]/30 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'ai' && (
                    <div className="shrink-0 w-6 h-6 bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20 flex items-center justify-center rounded">
                      <Bot
                        size={11}
                        className="text-[var(--cyber-green)]"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2 text-xs rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20 text-[var(--cyber-text)]'
                        : 'bg-(--surface-2) border border-(--border) text-[var(--cyber-text)]'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.role === 'user' && (
                    <div className="shrink-0 w-6 h-6 bg-(--surface-2) border border-(--border) flex items-center justify-center rounded">
                      <User
                        size={11}
                        className="text-[var(--cyber-text-secondary)]"
                      />
                    </div>
                  )}
                </motion.div>
              ))}

              {status === 'loading' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-6 h-6 bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20 flex items-center justify-center rounded">
                    <Bot
                      size={11}
                      className="text-[var(--cyber-green)]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-(--surface-2) border border-(--border) rounded-lg">
                    <Loader2
                      size={12}
                      className="text-[var(--cyber-green)] animate-spin"
                    />
                    <span className="text-[10px] text-[var(--cyber-text-muted)] tnum">
                      กำลังวิเคราะห์...
                    </span>
                  </div>
                </motion.div>
              )}

              {parsedTxs.length > 0 &&
                (status === 'preview' ||
                  status === 'saving' ||
                  status === 'saved') && (
                  <ConfirmationPreview
                    transactions={parsedTxs}
                    status={previewStatus}
                    onConfirm={handleConfirm}
                    onCancel={handleCancelPreview}
                  />
                )}
            </div>

            {/* Input bar */}
            <div className="shrink-0 p-3 border-t border-(--border)">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="พิมพ์รายจ่าย..."
                  disabled={status === 'saving'}
                  className="flex-1 border border-(--border) bg-(--surface-2) px-3 py-2.5 text-xs text-[var(--cyber-text)] focus:border-[var(--cyber-green)]/30 outline-none transition-all tnum placeholder-[var(--cyber-text-muted)] disabled:opacity-40 rounded-lg"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={
                    !input.trim() ||
                    status === 'loading' ||
                    status === 'saving'
                  }
                  className="flex h-[38px] w-[38px] items-center justify-center bg-[var(--cyber-green)] text-[var(--cyber-bg)] hover:bg-[var(--cyber-green)]/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-lg"
                >
                  {status === 'loading' ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
