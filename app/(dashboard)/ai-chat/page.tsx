'use client';

// ═══════════════════════════════════════════════════════════════════
// AI Chat — Agentic Intent Router frontend, reskinned to match the
// design prototype (page_aichat.jsx): one chat card (messages +
// suggestion chips + inset input with round blue send), user bubbles
// in blue, AI bubbles on surface-2 beside a blue-gradient avatar.
// Handles: record_transaction, add_wallet, set_budget, add_debt,
//          add_to_goal, query_data, general_chat — logic unchanged.
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect }   from 'react';
import { useRouter }                     from 'next/navigation';
import { motion, AnimatePresence }        from 'framer-motion';
import {
  Send, Loader2, Check, X, Sparkles, Wallet, PiggyBank, CreditCard, Target,
} from 'lucide-react';
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
              ? `รับทราบ! พบ ${txData.transactions.length} รายการ ตรวจสอบก่อนบันทึกได้เลย`
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
            toast('กรุณาเพิ่มกระเป๋าเงินก่อน — ไปที่หน้ากระเป๋าเงิน', 'warning');
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
              color:          'var(--blue)',
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

  // ── Helper: intent icon for action previews ──
  const getIntentIcon = (intent?: IntentType) => {
    switch (intent) {
      case 'add_wallet':  return <Wallet size={16} />;
      case 'set_budget':  return <PiggyBank size={16} />;
      case 'add_debt':    return <CreditCard size={16} />;
      case 'add_to_goal': return <Target size={16} />;
      default:            return null;
    }
  };

  // ── Helper: confirm button label ──
  const getConfirmLabel = (intent?: IntentType) => {
    switch (intent) {
      case 'record_transaction': return 'บันทึกรายการ';
      case 'add_wallet':         return 'เพิ่มกระเป๋า';
      case 'set_budget':         return 'ตั้งงบ';
      case 'add_debt':           return 'บันทึกหนี้';
      case 'add_to_goal':        return 'ออมเข้าเป้าหมาย';
      default:                   return 'ยืนยัน';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page head ── */}
      <div className="mb-1 mt-1.5">
        <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.025em] text-(--text) lg:text-[30px]">
          AI ผู้ช่วย
        </h1>
        <p className="mt-1 text-[14.5px] text-(--text-2)">
          พิมพ์ภาษาคนธรรมดา สิน่าเข้าใจและบันทึกให้
        </p>
      </div>

      {/* ── Chat card ── */}
      <div className="flex h-[min(64vh,640px)] flex-col overflow-hidden rounded-3xl border border-(--border) bg-(--surface) shadow-(--shadow)">
        {/* Messages */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={msg.role === 'user' ? 'self-end' : 'self-start'}
                style={{ maxWidth: msg.role === 'user' ? '78%' : '85%' }}
              >
                {msg.role === 'user' ? (
                  <div className="rounded-[18px_18px_5px_18px] bg-(--blue) px-[15px] py-2.5 text-[14.5px] text-white shadow-(--shadow-sm)">
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    {/* AI avatar */}
                    <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-(--blue) to-(--blue-ink) text-white">
                      <Sparkles size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="rounded-[18px_18px_18px_5px] bg-(--surface-2) px-[15px] py-2.5 text-[14.5px] text-(--text)">
                        <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                      </div>

                      {/* ── Transaction preview with confirmation ── */}
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

                      {/* ── Action preview card (wallet / budget / debt / goal) ── */}
                      {msg.actionData && msg.savedStatus === 'pending' && (
                        <div className="mt-2.5 rounded-2xl border border-(--border) bg-(--surface) p-[15px] shadow-(--shadow-sm)">
                          <p className="eyebrow mb-2.5">ตรวจสอบก่อนบันทึก</p>
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-(--blue-soft) text-(--blue)">
                              {getIntentIcon(msg.intent) ?? <Sparkles size={16} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-(--text)">
                                {msg.actionData.name || msg.actionData.category || msg.actionData.goal_name}
                              </p>
                              <p className="mt-0.5 text-xs text-(--text-3)">
                                {msg.intent === 'add_wallet' && 'กระเป๋าเงินใหม่'}
                                {msg.intent === 'set_budget' && 'งบประมาณรายเดือน'}
                                {msg.intent === 'add_debt' && (
                                  msg.actionData.interestRate && msg.actionData.interestRate > 0
                                    ? `ดอกเบี้ย ${msg.actionData.interestRate}%`
                                    : 'ไม่มีดอกเบี้ย'
                                )}
                                {msg.intent === 'add_to_goal' && 'ออมเงินเข้าเป้าหมาย'}
                              </p>
                            </div>
                            <p className={`tnum shrink-0 text-sm font-semibold ${
                              msg.intent === 'add_debt' ? 'text-(--expense)' : 'text-(--green)'
                            }`}>
                              {msg.intent === 'add_to_goal' && '+'}
                              {formatCurrency(
                                msg.actionData.balance ?? msg.actionData.amount ?? 0
                              )}
                            </p>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleSave(msg.id)}
                              className="pill pill-primary pill-sm press tap flex-1"
                            >
                              <Check /> {getConfirmLabel(msg.intent)}
                            </button>
                            <button
                              onClick={() => handleCancel(msg.id)}
                              className="pill pill-ghost pill-sm press tap"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── Saved confirmation ── */}
                      {msg.savedStatus === 'saved' && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-(--green-soft) px-3 py-1.5 text-[12.5px] font-semibold text-(--green)">
                            <Check size={13} /> บันทึกแล้ว
                          </span>
                          <button
                            onClick={() => router.push('/')}
                            className="text-[12.5px] font-medium text-(--blue) transition-opacity hover:opacity-70"
                          >
                            ดูแดชบอร์ด →
                          </button>
                        </div>
                      )}

                      {/* ── Cancelled ── */}
                      {msg.savedStatus === 'cancelled' && !msg.parsedTransactions && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-(--text-3)">
                          <X size={13} /> ยกเลิกแล้ว
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5 self-start">
              <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-(--blue) to-(--blue-ink) text-white">
                <Sparkles size={15} />
              </div>
              <div className="flex items-center gap-2 rounded-[18px_18px_18px_5px] bg-(--surface-2) px-[15px] py-2.5">
                <Loader2 size={14} className="animate-spin text-(--blue)" />
                <span className="text-[13px] text-(--text-2)">กำลังวิเคราะห์…</span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion chips */}
        <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="press tap shrink-0 rounded-full border border-(--border-2) bg-(--surface-2) px-3 py-1.5 text-[12.5px] font-medium text-(--text-2) transition-colors hover:text-(--text)"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2.5 border-t border-(--border-2) bg-(--surface) p-3 px-4">
          <div className="inset flex flex-1 items-center gap-2 pl-4 pr-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="ถามสิน่า หรือพิมพ์รายการใช้จ่าย…"
              className="w-full bg-transparent py-[13px] text-[15px] text-(--text) outline-none placeholder:text-(--text-3)"
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            aria-label="ส่งข้อความ"
            className="press tap flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-(--blue) text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--blue)_35%,transparent)] transition-[filter] hover:brightness-108 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
