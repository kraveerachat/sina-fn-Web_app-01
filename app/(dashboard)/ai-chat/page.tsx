'use client';

// ═══════════════════════════════════════════════════════════════════
// AI Chat Page — Agentic Intent Router Frontend
// Handles: record_transaction, add_wallet, set_budget, add_debt,
//          query_data, general_chat
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect }   from 'react';
import { useRouter }                     from 'next/navigation';
import { motion, AnimatePresence }        from 'framer-motion';
import { Send, Bot, User, Loader2, Check, X, Sparkles, Wallet, PiggyBank, CreditCard, Target } from 'lucide-react';
import { formatCurrency }                from '@/lib/utils';
import { useAuth }                       from '@/hooks/useAuth';
import { useWallets }                    from '@/hooks/useWallets';
import { useToast }                      from '@/hooks/useToast';
import { addTransaction, createWalletWithOpeningBalance, upsertBudget, getGoals } from '@/lib/supabase/queries';
import { supabase }                      from '@/lib/supabase/client';
import { dispatchAppMutate }             from '@/lib/events';
import ConfirmationPreview               from '@/components/ai/ConfirmationPreview';

interface ParsedTx {
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

// ── Smart wallet matching — case-insensitive, partial match, cash fallback ──
const CASH_NAMES = ['cash', 'เงินสด', 'กระเป๋าหลัก'];

function matchWallet(hint: string, wallets: { id: string; name: string; type: string }[]): string {
  if (wallets.length === 0) return '';
  const h = hint.toLowerCase().trim();

  const exact = wallets.find((w) => w.name.toLowerCase() === h);
  if (exact) return exact.id;

  const partial = wallets.find((w) => {
    const wn = w.name.toLowerCase();
    return wn.includes(h) || h.includes(wn);
  });
  if (partial) return partial.id;

  const aliasMap: Record<string, string[]> = {
    scb:    ['ไทยพาณิชย์', 'scb', 'siam commercial'],
    kbank:  ['กสิกร', 'kbank', 'kasikorn'],
    ktb:    ['กรุงไทย', 'ktb', 'krungthai'],
    ttb:    ['ทหารไทย', 'ttb', 'tmbthanachart', 'ธนชาต'],
    bbl:    ['กรุงเทพ', 'bbl', 'bangkok bank'],
    promptpay: ['promptpay', 'พร้อมเพย์'],
  };

  for (const [, aliases] of Object.entries(aliasMap)) {
    if (aliases.some((a) => h.includes(a) || a.includes(h))) {
      const found = wallets.find((w) => {
        const wn = w.name.toLowerCase();
        return aliases.some((a) => wn.includes(a) || a.includes(wn));
      });
      if (found) return found.id;
    }
  }

  const cashWallet = wallets.find((w) =>
    CASH_NAMES.some((cn) => w.name.toLowerCase().includes(cn)) || w.type === 'cash'
  );
  if (cashWallet) return cashWallet.id;

  return wallets[0].id;
}

type IntentType = 'record_transaction' | 'add_wallet' | 'set_budget' | 'add_debt' | 'add_to_goal' | 'query_data' | 'general_chat' | 'error';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  intent?: IntentType;
  parsedTransactions?: ParsedTx[];
  actionData?: {
    name?: string;
    balance?: number;
    category?: string;
    amount?: number;
    interestRate?: number;
    goal_name?: string;
    emoji?: string;
  };
  savedStatus?: 'pending' | 'saved' | 'cancelled';
  timestamp: Date;
}

const SUGGESTIONS = [
  'กินข้าว 50 กาแฟ 65',
  'เพิ่มกระเป๋า TTB 5000',
  'ตั้งงบอาหาร 3000',
  'เก็บเงินค่า iPhone 2000',
  'สรุปเดือนนี้หน่อย',
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
      content: 'สวัสดีครับ! 👋 ผมเป็น Sina AI ช่วยจัดการการเงินของคุณ\n\nสิ่งที่ทำได้:\n• บันทึกรายรับ-รายจ่าย: "กินข้าว 50 กาแฟ 65"\n• เพิ่มกระเป๋าเงิน: "เพิ่มกระเป๋า TTB 5000"\n• ตั้งงบประมาณ: "ตั้งงบอาหาร 3000"\n• ออมเงินเป้าหมาย: "เก็บเงินค่า iPhone 2000"\n• ถามทั่วไป: "สรุปเดือนนี้หน่อย"',
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

  // ── Parse via Agentic Intent Router ──
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
        body: JSON.stringify({
          message: messageText,
          wallets: wallets.map((w) => ({ name: w.name, type: w.type })),
        }),
      });
      const data = await res.json();

      if (data.intent === 'error') throw new Error(data.message || 'Unknown error');

      // ── Route response by intent ──
      switch (data.intent as IntentType) {

        case 'record_transaction': {
          const txData = data.data;
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            intent: 'record_transaction',
            content: txData.transactions.length > 0
              ? `แปลงสำเร็จ! พบ ${txData.transactions.length} รายการ:`
              : txData.message || 'ไม่พบรายการทางการเงิน',
            parsedTransactions: txData.transactions,
            savedStatus: txData.transactions.length > 0 ? 'pending' : undefined,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          break;
        }

        case 'add_wallet': {
          const walletData = data.data;
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            intent: 'add_wallet',
            content: walletData
              ? `ต้องการเพิ่มกระเป๋า "${walletData.name}" ยอดเริ่มต้น ${formatCurrency(walletData.balance)} ใช่ไหม?`
              : data.message || 'ไม่สามารถแยกแยะข้อมูลได้',
            actionData: walletData,
            savedStatus: walletData ? 'pending' : undefined,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          break;
        }

        case 'set_budget': {
          const budgetData = data.data;
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            intent: 'set_budget',
            content: budgetData
              ? `ตั้งงบประมาณ "${budgetData.category}" จำนวน ${formatCurrency(budgetData.amount)} ใช่ไหม?`
              : data.message || 'ไม่สามารถแยกแยะข้อมูลได้',
            actionData: budgetData,
            savedStatus: budgetData ? 'pending' : undefined,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          break;
        }

        case 'add_debt': {
          const debtData = data.data;
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            intent: 'add_debt',
            content: debtData
              ? `บันทึกหนี้ "${debtData.name}" จำนวน ${formatCurrency(debtData.amount)}${debtData.interestRate > 0 ? ` ดอกเบี้ย ${debtData.interestRate}%` : ''} ใช่ไหม?`
              : data.message || 'ไม่สามารถแยกแยะข้อมูลได้',
            actionData: debtData,
            savedStatus: debtData ? 'pending' : undefined,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          break;
        }

        case 'add_to_goal': {
          const goalData = data.data;
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            intent: 'add_to_goal',
            content: goalData
              ? `ออมเงินเข้าเป้าหมาย "${goalData.goal_name}" จำนวน ${formatCurrency(goalData.amount)} ใช่ไหม?`
              : data.message || 'ไม่สามารถแยกแยะข้อมูลได้',
            actionData: goalData,
            savedStatus: goalData ? 'pending' : undefined,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          break;
        }

        case 'query_data':
        case 'general_chat':
        default: {
          const chatMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            intent: data.intent,
            content: data.data?.message || 'ไม่สามารถตอบได้ในตอนนี้',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, chatMsg]);
          break;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[AI Chat] error:', msg);

      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'ai',
        content: `❌ ${msg}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // ── Save / Confirm action based on intent ──
  const handleSave = async (msgId: string) => {
    if (!user) {
      toast('กรุณาเข้าสู่ระบบก่อน', 'error');
      return;
    }

    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    try {
      switch (msg.intent) {

        // ── Save Transactions ──
        case 'record_transaction': {
          if (!msg.parsedTransactions) return;
          if (wallets.length === 0) {
            toast('กรุณาเพิ่มกระเป๋าเงินก่อน — ไปที่หน้า Wallets', 'warning');
            return;
          }

          for (const tx of msg.parsedTransactions) {
            const walletId = matchWallet(tx.wallet_hint, wallets);
            if (!walletId) {
              toast(`ไม่พบกระเป๋าเงินที่ตรงกับ: ${tx.wallet_hint}`, 'warning');
              continue;
            }

            await addTransaction(
              {
                note:             tx.description,
                categoryName:     tx.category || 'อื่นๆ',
                amount:           tx.amount,
                type:             tx.type,
                transaction_date: new Date().toISOString(),
                walletId:         walletId,
                walletName:       wallets.find(w => w.id === walletId)?.name ?? 'กระเป๋าหลัก',
                walletType:       wallets.find(w => w.id === walletId)?.type ?? 'cash',
                emoji:            tx.emoji || '💸',
                amount_thb:       tx.amount_thb ?? tx.amount,
                currency:         tx.currency ?? 'THB',
                is_ai_generated:  tx.is_ai_generated ?? true,
              },
              user.id
            );
          }

          toast('บันทึกรายการเรียบร้อยแล้ว', 'success');
          break;
        }

        // ── Add Wallet ──
        case 'add_wallet': {
          const wd = msg.actionData;
          if (!wd) return;

          await createWalletWithOpeningBalance(
            {
              name:    wd.name || '',
              type:    'cash',
              icon:    '💳',
              balance: wd.balance || 0,
              user_id: user.id,
            },
            user.id
          );

          toast(`เพิ่มกระเป๋า "${wd.name || ''}" สำเร็จ!`, 'success');
          break;
        }

        // ── Set Budget ──
        case 'set_budget': {
          const bd = msg.actionData;
          if (!bd) return;

          const now = new Date();
          await upsertBudget(
            {
              categoryName:   bd.category || '',
              icon:           '📊',
              spent:          0,
              limit:          bd.amount || 0,
              color:          '#8B8CF8',
              rolloverPolicy: 'reset',
              month:          now.getMonth() + 1,
              year:           now.getFullYear(),
            },
            user.id
          );

          toast(`ตั้งงบ "${bd.category || ''}" ${formatCurrency(bd.amount || 0)} สำเร็จ!`, 'success');
          break;
        }

        // ── Add Debt ──
        case 'add_debt': {
          const dd = msg.actionData;
          if (!dd) return;

          const { error } = await supabase
            .from('debts')
            .insert([{
              user_id:          user.id,
              name:             dd.name || '',
              total_amount:     dd.amount || 0,
              remaining_amount: dd.amount || 0,
              interest_rate:    dd.interestRate || 0,
              is_deleted:       false,
            }]);

          if (error) throw error;

          toast(`บันทึกหนี้ "${dd.name || ''}" ${formatCurrency(dd.amount || 0)} สำเร็จ!`, 'success');
          break;
        }

        // ── Add to Goal (Savings) ──
        case 'add_to_goal': {
          const gd = msg.actionData;
          if (!gd || !gd.goal_name) {
            toast('ข้อผิดพลาด: ไม่พบชื่อเป้าหมาย', 'error');
            return;
          }

          // Find the matching goal by name (fuzzy match)
          const goals = await getGoals(user.id);
          const goalName = String(gd.goal_name).toLowerCase().trim();
          const matchedGoal = goals.find((g) => {
            const gn = g.name.toLowerCase();
            return gn.includes(goalName) || goalName.includes(gn);
          });

          if (!matchedGoal || !matchedGoal.linked_wallet_id) {
            toast(`ไม่พบเป้าหมาย "${gd.goal_name}" — กรุณาสร้างเป้าหมายก่อน`, 'warning');
            return;
          }

          // Insert income transaction into the goal's linked wallet
          await addTransaction(
            {
              note:             `${gd.emoji || '🎯'} ออมเงิน — ${matchedGoal.name}`,
              categoryName:     'ออมเงิน',
              amount:           gd.amount || 0,
              type:             'income',
              transaction_date: new Date().toISOString(),
              walletId:         matchedGoal.linked_wallet_id,
              walletName:       matchedGoal.wallet?.name ?? `🎯 ${matchedGoal.name}`,
              walletType:       'savings',
              emoji:            '',
            },
            user.id
          );

          toast(`ออมเงิน ${formatCurrency(gd.amount || 0)} เข้าเป้าหมาย "${matchedGoal.name}" สำเร็จ!`, 'success');
          break;
        }

        default:
          return;
      }

      // Mark as saved
      setMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, savedStatus: 'saved' as const } : m)
      );
      dispatchAppMutate();

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

  // ── Helper: Get intent icon ──
  const getIntentIcon = (intent?: IntentType) => {
    switch (intent) {
      case 'add_wallet':  return <Wallet size={14} className="text-[var(--cyber-green)]" />;
      case 'set_budget':  return <PiggyBank size={14} className="text-[var(--cyber-green)]" />;
      case 'add_debt':    return <CreditCard size={14} className="text-[var(--cyber-green)]" />;
      case 'add_to_goal': return <Target size={14} className="text-[var(--cyber-green)]" />;
      default:            return null;
    }
  };

  // ── Helper: Get confirm button label ──
  const getConfirmLabel = (intent?: IntentType) => {
    switch (intent) {
      case 'record_transaction': return 'Save Transactions';
      case 'add_wallet':         return 'Add Wallet';
      case 'set_budget':         return 'Set Budget';
      case 'add_debt':           return 'Add Debt';
      case 'add_to_goal':        return 'Save to Goal';
      default:                   return 'Confirm';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px-48px)] lg:h-[calc(100vh-64px-64px)]">
      {/* Page title */}
      <div className="shrink-0 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-green)] hud-dot" />
          <span className="cyber-label-green">AI ASSISTANT // SINA AGENT</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--cyber-text)]">แชทกับ AI</h1>
      </div>

      {/* Message list — heavy glassmorphism container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-2xl p-4">
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
                <div className="shrink-0 w-8 h-8 bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20 flex items-center justify-center rounded-lg">
                  <Bot size={14} className="text-[var(--cyber-green)]" />
                </div>
              )}

              <div className={`max-w-[85%] lg:max-w-[70%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                <div className={`
                  px-4 py-3 rounded-xl
                  ${msg.role === 'user'
                    ? 'bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20 text-[var(--cyber-text)]'
                    : 'bg-white/[0.04] border border-white/[0.08] text-[var(--cyber-text)]'
                  }
                `}>
                  {/* Intent badge for non-transaction actions */}
                  {msg.intent && msg.intent !== 'record_transaction' && msg.intent !== 'query_data' && msg.intent !== 'general_chat' && msg.intent !== 'error' && (
                    <div className="flex items-center gap-1.5 mb-2">
                      {getIntentIcon(msg.intent)}
                      <span className="text-[10px] uppercase tracking-wider text-[var(--cyber-text-muted)] font-mono">
                        {msg.intent.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>

                  {/* ── Transaction preview with animated confirmation ── */}
                  {msg.parsedTransactions && msg.parsedTransactions.length > 0 && (
                    <ConfirmationPreview
                      transactions={msg.parsedTransactions}
                      status={
                        msg.savedStatus === 'saved' ? 'saved'
                          : msg.savedStatus === 'cancelled' ? 'cancelled'
                          : 'pending'
                      }
                      onConfirm={() => handleSave(msg.id)}
                      onCancel={() => handleCancel(msg.id)}
                    />
                  )}

                  {/* ── Action preview card (wallet / budget / debt) — ai-sparkle ── */}
                  {msg.actionData && msg.savedStatus === 'pending' && (
                    <div className="mt-3 bg-white/[0.04] border border-white/[0.08] p-3 rounded-xl ai-sparkle">
                      {msg.intent === 'add_wallet' && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-base shrink-0">💳</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--cyber-text)]">{msg.actionData.name}</p>
                            <p className="text-xs text-[var(--cyber-text-muted)] mt-0.5">กระเป๋าเงินใหม่</p>
                          </div>
                          <p className="text-sm font-semibold font-mono text-[var(--cyber-green)] shrink-0">
                            {formatCurrency(msg.actionData.balance || 0)}
                          </p>
                        </div>
                      )}
                      {msg.intent === 'set_budget' && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-base shrink-0">📊</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--cyber-text)]">{msg.actionData.category}</p>
                            <p className="text-xs text-[var(--cyber-text-muted)] mt-0.5">งบประมาณรายเดือน</p>
                          </div>
                          <p className="text-sm font-semibold font-mono text-[var(--cyber-green)] shrink-0">
                            {formatCurrency(msg.actionData.amount || 0)}
                          </p>
                        </div>
                      )}
                      {msg.intent === 'add_debt' && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-base shrink-0">📋</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--cyber-text)]">{msg.actionData.name}</p>
                            <p className="text-xs text-[var(--cyber-text-muted)] mt-0.5">
                              {msg.actionData.interestRate && msg.actionData.interestRate > 0 ? `ดอกเบี้ย ${msg.actionData.interestRate}%` : 'ไม่มีดอกเบี้ย'}
                            </p>
                          </div>
                          <p className="text-sm font-semibold font-mono text-[var(--cyber-red)] shrink-0">
                            {formatCurrency(msg.actionData.amount || 0)}
                          </p>
                        </div>
                      )}
                      {msg.intent === 'add_to_goal' && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-base shrink-0">{msg.actionData.emoji || '🎯'}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--cyber-text)]">{msg.actionData.goal_name}</p>
                            <p className="text-xs text-[var(--cyber-text-muted)] mt-0.5">ออมเงินเข้าเป้าหมาย</p>
                          </div>
                          <p className="text-sm font-semibold font-mono text-[var(--cyber-green)] shrink-0">
                            +{formatCurrency(msg.actionData.amount || 0)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Success card after save ── */}
                  {msg.savedStatus === 'saved' && msg.actionData && (
                    <div className="mt-3 bg-[var(--cyber-green)]/5 border border-[var(--cyber-green)]/20 p-3 rounded-xl">
                      <div className="flex items-center gap-2 text-[var(--cyber-green)] text-sm font-medium">
                        <Check size={14} />
                        <span>
                          {msg.intent === 'add_wallet' && `เพิ่มกระเป๋า "${msg.actionData.name || ''}" ${formatCurrency(msg.actionData.balance || 0)} แล้ว`}
                          {msg.intent === 'set_budget' && `ตั้งงบ "${msg.actionData.category || ''}" ${formatCurrency(msg.actionData.amount || 0)} แล้ว`}
                          {msg.intent === 'add_debt' && `บันทึกหนี้ "${msg.actionData.name || ''}" ${formatCurrency(msg.actionData.amount || 0)} แล้ว`}
                          {msg.intent === 'add_to_goal' && `ออมเงิน ${formatCurrency(msg.actionData.amount || 0)} เข้า "${msg.actionData.goal_name || ''}" แล้ว`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── Action buttons for non-transaction intents ── */}
                  {msg.savedStatus === 'pending' && msg.intent !== 'record_transaction' && (
                    <div className="flex gap-2 pt-3">
                      <button
                        onClick={() => handleCancel(msg.id)}
                        className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg bg-transparent hover:bg-white/5 text-[var(--cyber-text-muted)] transition-all"
                      >
                        <X size={14} /> Cancel
                      </button>
                      <button
                        onClick={() => handleSave(msg.id)}
                        className="flex-[2] py-2 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/40 text-[var(--cyber-green)] hover:bg-[var(--cyber-green)]/20 hover:border-[var(--cyber-green)] transition-all"
                      >
                        <Check size={14} /> {getConfirmLabel(msg.intent)}
                      </button>
                    </div>
                  )}

                  {/* ── View Dashboard after save (transactions handled by ConfirmationPreview) ── */}
                  {msg.savedStatus === 'saved' && msg.intent === 'record_transaction' && (
                    <div className="pt-3">
                      <button
                        onClick={() => router.push('/')}
                        className="w-full py-2 px-4 bg-[var(--cyber-surface)] border border-[var(--cyber-green)]/30 text-[var(--cyber-text)] hover:text-[var(--cyber-green)] hover:bg-[var(--cyber-green)]/10 hover:border-[var(--cyber-green)] rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={13} /> View Dashboard
                      </button>
                    </div>
                  )}

                  {/* ── Saved status for wallet/budget/debt ── */}
                  {msg.savedStatus === 'saved' && msg.intent !== 'record_transaction' && msg.actionData && (
                    <div className="pt-3">
                      <button
                        onClick={() => router.push('/')}
                        className="w-full py-2 px-4 bg-[var(--cyber-surface)] border border-[var(--cyber-green)]/30 text-[var(--cyber-text)] hover:text-[var(--cyber-green)] hover:bg-[var(--cyber-green)]/10 hover:border-[var(--cyber-green)] rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={13} /> View Dashboard
                      </button>
                    </div>
                  )}

                  {/* ── Cancelled status for non-transaction intents ── */}
                  {msg.savedStatus === 'cancelled' && !msg.parsedTransactions && (
                    <div className="flex items-center gap-1.5 pt-3 text-[var(--cyber-text-muted)] text-xs font-medium">
                      <X size={14} /> <span>ยกเลิกแล้ว (Cancelled)</span>
                    </div>
                  )}
                </div>

                <p className={`cyber-label mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {msg.role === 'user' && (
                <div className="shrink-0 w-8 h-8 bg-white/[0.04] border border-white/[0.08] flex items-center justify-center order-2 rounded-lg">
                  <User size={14} className="text-[var(--cyber-text-secondary)]" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-8 h-8 bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20 flex items-center justify-center rounded-lg">
              <Bot size={14} className="text-[var(--cyber-green)]" />
            </div>
            <div className="bg-white/[0.04] border border-white/[0.08] px-4 py-3 flex items-center gap-2 rounded-xl">
              <Loader2 size={14} className="text-[var(--cyber-green)] animate-spin" />
              <span className="cyber-label status-blip">กำลังวิเคราะห์...</span>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick suggestion chips */}
      {messages.length <= 1 && (
        <div className="shrink-0 py-3">
          <p className="cyber-label mb-2 flex items-center gap-1.5">
            <Sparkles size={10} /> ลองพิมพ์หรือกดเลือก
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-[var(--cyber-text-secondary)] hover:text-[var(--cyber-green)] hover:border-[var(--cyber-green)]/30 transition-all font-mono rounded-lg"
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
            placeholder="พิมพ์อะไรก็ได้... บันทึกรายจ่าย เพิ่มกระเป๋า ตั้งงบ หรือถามทั่วไป"
            className="
              flex-1 border border-white/[0.08] bg-white/[0.03]
              px-4 py-3 text-sm text-[var(--cyber-text)]
              focus:border-[var(--cyber-green)]/30 outline-none transition-all font-mono
              placeholder-[var(--cyber-text-muted)] rounded-lg
            "
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="
              flex h-[46px] w-[46px] items-center justify-center
              bg-[var(--cyber-green)] text-[var(--cyber-bg)]
              hover:bg-[var(--cyber-green)]/80 transition-all
              disabled:opacity-40 disabled:cursor-not-allowed rounded-lg
            "
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
