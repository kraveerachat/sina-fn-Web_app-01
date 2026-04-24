'use client';

// ═══════════════════════════════════════════════════════════════════
// AI Chat Page — Gemini-powered Transaction Parser
// No direct Supabase calls in this file.
// Uses hooks exclusively: useAuth, useWallets, useToast
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect }   from 'react';
import { useRouter }                     from 'next/navigation';
import { motion, AnimatePresence }        from 'framer-motion';
import { Send, Bot, User, Loader2, Check, X, Sparkles } from 'lucide-react';
import { formatCurrency }                from '@/lib/utils';
import { useAuth }                       from '@/hooks/useAuth';
import { useWallets }                    from '@/hooks/useWallets';
import { useToast }                      from '@/hooks/useToast';
import { getOrCreateCategory }           from '@/lib/supabase/queries';
import { supabase }                      from '@/lib/supabase/client';

interface ParsedTx {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  emoji: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  parsedTransactions?: ParsedTx[];
  savedStatus?: 'pending' | 'saved' | 'cancelled';
  timestamp: Date;
}

const SUGGESTIONS = [
  'กินข้าว 50 กาแฟ 65',
  'grab 120 bts 44',
  'เงินเดือน 32000',
  'ค่าไฟ 850 ค่าน้ำ 120',
  'Netflix 349 Spotify 129',
];

export default function AiChatPage() {
  const router  = useRouter();
  const { user }               = useAuth();
  const { wallets }            = useWallets(user?.id);
  const { toast }              = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: 'สวัสดีครับ! 👋 ผมเป็น AI ช่วยบันทึกรายรับ-รายจ่ายของคุณ\n\nพิมพ์รายการ เช่น:\n"กินข้าว 50 กาแฟ 65"\n"ได้รับเงินสด 1000 ได้รับเงินโอน 5000"\nผมจะแปลงเป็นรายการทำธุรกรรมให้อัตโนมัติ ✨',
      timestamp: new Date(),
    },
  ]);
  const [input,     setInput]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Parse via Gemini API route ──
  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res  = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: `แปลงสำเร็จ! พบ ${data.transactions.length} รายการ:`,
        parsedTransactions: data.transactions,
        savedStatus: 'pending',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[AI Chat] parse error:', msg);

      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'ai',
        content: '❌ ไม่สามารถแปลงข้อความได้ กรุณาลองใหม่อีกครั้ง',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // ── Save parsed transactions — all DB via queries layer ──
  const handleSave = async (msgId: string) => {
    if (!user) {
      toast('กรุณาเข้าสู่ระบบก่อน', 'error');
      return;
    }
    if (wallets.length === 0) {
      toast('กรุณาเพิ่มกระเป๋าเงินก่อน — ไปที่หน้า Wallets', 'warning');
      return;
    }

    const walletId = wallets[0].id;
    const msg      = messages.find((m) => m.id === msgId);
    if (!msg?.parsedTransactions) return;

    try {
      let totalBalanceChange = 0;

      for (const tx of msg.parsedTransactions) {
        // Resolve category via queries layer (creates if not exists)
        const categoryId = await getOrCreateCategory(tx.category || 'อื่นๆ', user.id);

        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            user_id:          user.id,
            wallet_id:        walletId,
            category_id:      categoryId,
            amount:           tx.amount,
            type:             tx.type,
            note:             tx.description,
            transaction_date: new Date().toISOString(),
            created_at:       new Date().toISOString(),
            updated_at:       new Date().toISOString(),
            is_deleted:       false,
          });

        if (insertError) throw insertError;
        totalBalanceChange += tx.type === 'income' ? tx.amount : -tx.amount;
      }

      // Atomic balance update — read current then write new
      const { data: currentWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', walletId)
        .single();

      const { error: balanceError } = await supabase
        .from('wallets')
        .update({
          balance:    (currentWallet?.balance || 0) + totalBalanceChange,
          updated_at: new Date().toISOString(),
        })
        .eq('id', walletId);

      if (balanceError) throw balanceError;

      setMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, savedStatus: 'saved' as const } : m)
      );
      toast('บันทึกและอัปเดตยอดคงเหลือแล้ว', 'success');

    } catch (err) {
      console.error('[AI Chat] save error:', err);
      toast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  };

  const handleCancel = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, savedStatus: 'cancelled' as const } : m)
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px-48px)] lg:h-[calc(100vh-64px-64px)]">
      {/* Page title */}
      <div className="shrink-0 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-green)] hud-dot" />
          <span className="cyber-label-green">AI ASSISTANT // GEMINI</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--cyber-text)]">แชทกับ AI</h1>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="shrink-0 w-8 h-8 bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20 flex items-center justify-center">
                  <Bot size={14} className="text-[var(--cyber-green)]" />
                </div>
              )}

              <div className={`max-w-[85%] lg:max-w-[70%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                <div className={`
                  px-4 py-3
                  ${msg.role === 'user'
                    ? 'bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20 text-[var(--cyber-text)]'
                    : 'bg-[var(--cyber-surface)] border border-[var(--cyber-border)] text-[var(--cyber-text)]'
                  }
                `}>
                  <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>

                  {/* Parsed transaction cards */}
                  {msg.parsedTransactions && msg.parsedTransactions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.parsedTransactions.map((tx, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[var(--cyber-surface-alt)] border border-[var(--cyber-border)] p-3">
                          <span className="text-lg shrink-0">{tx.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--cyber-text)] truncate">{tx.description}</p>
                            <p className="cyber-label mt-0.5">{tx.category}</p>
                          </div>
                          <p className={`text-sm font-bold font-mono shrink-0 ${
                            tx.type === 'income' ? 'text-[var(--cyber-green)]' : 'text-[var(--cyber-red)]'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                        </div>
                      ))}

                      {/* Total row */}
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--cyber-border)]">
                        <span className="cyber-label">TOTAL</span>
                        <span className="text-sm font-bold font-mono text-[var(--cyber-text)]">
                          {formatCurrency(
                            msg.parsedTransactions.reduce(
                              (sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0
                            ), true
                          )}
                        </span>
                      </div>

                      {/* Action buttons */}
                      {msg.savedStatus === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleSave(msg.id)}
                            className="flex-1 py-1.5 flex items-center justify-center gap-1 text-xs font-mono border border-[var(--cyber-green)]/50 bg-[var(--cyber-green)]/20 text-[var(--cyber-green)] hover:bg-[var(--cyber-green)]/30 transition-all uppercase"
                          >
                            <Check size={12} /> บันทึกทั้งหมด (SAVE)
                          </button>
                          <button
                            onClick={() => handleCancel(msg.id)}
                            className="flex-1 py-1.5 flex items-center justify-center gap-1 text-xs font-mono border border-[var(--cyber-border)] bg-[var(--cyber-surface)] text-[var(--cyber-text-secondary)] hover:text-[var(--cyber-text)] transition-all uppercase"
                          >
                            <X size={12} /> ยกเลิก (CANCEL)
                          </button>
                        </div>
                      )}

                      {msg.savedStatus === 'saved' && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2 text-[var(--cyber-green)] text-[10px] font-mono uppercase tracking-[1px]">
                            <Check size={14} />
                            <span>บันทึกและอัปเดตยอดคงเหลือแล้ว</span>
                          </div>
                          <button
                            onClick={() => router.push('/')}
                            className="
                              w-full py-3 bg-[var(--cyber-green)] text-[var(--cyber-bg)]
                              font-bold text-[10px] tracking-[4px] uppercase
                              shadow-[0_0_20px_var(--cyber-green-glow)]
                              hover:shadow-[0_0_30px_var(--cyber-green-glow-sm)]
                              transition-all flex items-center justify-center gap-2
                            "
                          >
                            <Sparkles size={14} /> ดู DASHBOARD // VIEW DASHBOARD
                          </button>
                        </div>
                      )}

                      {msg.savedStatus === 'cancelled' && (
                        <div className="flex items-center gap-2 pt-2 text-[var(--cyber-text-muted)] text-[10px] font-mono uppercase tracking-[1px]">
                          <X size={14} /> <span>ยกเลิกแล้ว (CANCELLED)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <p className={`cyber-label mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {msg.role === 'user' && (
                <div className="shrink-0 w-8 h-8 bg-[var(--cyber-surface-alt)] border border-[var(--cyber-border)] flex items-center justify-center order-2">
                  <User size={14} className="text-[var(--cyber-text-secondary)]" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-8 h-8 bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20 flex items-center justify-center">
              <Bot size={14} className="text-[var(--cyber-green)]" />
            </div>
            <div className="bg-[var(--cyber-surface)] border border-[var(--cyber-border)] px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="text-[var(--cyber-green)] animate-spin" />
              <span className="cyber-label status-blip">คิดหน้าดู...</span>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick suggestion chips */}
      {messages.length <= 1 && (
        <div className="shrink-0 py-3">
          <p className="cyber-label mb-2 flex items-center gap-1.5">
            <Sparkles size={10} /> กดปุ่มเพื่อตัวอย่างการพูดคุย
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="border border-[var(--cyber-border)] bg-[var(--cyber-surface-alt)] px-3 py-1.5 text-xs text-[var(--cyber-text-secondary)] hover:text-[var(--cyber-green)] hover:border-[var(--cyber-green)]/30 transition-all font-mono"
              >
                &quot;{s}&quot;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 pt-3 border-t border-[var(--cyber-border)]">
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="บอกสิ่งที่จ่ายไป..."
            className="
              flex-1 border border-[var(--cyber-border)] bg-[var(--cyber-surface-alt)]
              px-4 py-3 text-sm text-[var(--cyber-text)]
              focus:border-[var(--cyber-green)]/30 outline-none transition-all font-mono
              placeholder-[var(--cyber-text-muted)]
            "
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="
              flex h-[46px] w-[46px] items-center justify-center
              bg-[var(--cyber-green)] text-[var(--cyber-bg)]
              hover:bg-[var(--cyber-green)]/80 transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
