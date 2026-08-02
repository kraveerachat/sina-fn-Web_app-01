import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════
// Agentic Intent Router — 2-Step AI Process
// Step 1: Intent Detection → Step 2: Action Processing
// ═══════════════════════════════════════════════════════════════════

// ── Intent Types ──
type Intent =
  | 'record_transaction'
  | 'query_data'
  | 'add_wallet'
  | 'set_budget'
  | 'add_debt'
  | 'add_to_goal'
  | 'general_chat';

// ── Zod Schemas ──
const TransactionSchema = z.object({
  transactions: z.array(z.object({
    description: z.string().min(1),
    amount: z.number().positive(),
    type: z.enum(['income', 'expense']),
    category: z.string(),
    emoji: z.string().optional(),
    wallet_hint: z.string().default('เงินสด'),
    currency: z.string().default('THB'),
  })),
  message: z.string().optional()
});

const WalletSchema = z.object({
  name: z.string().min(1),
  balance: z.number().min(0),
});

const BudgetSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
});

const DebtSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  interestRate: z.number().min(0),
});

const GoalSavingSchema = z.object({
  goal_name: z.string().min(1),
  amount: z.number().positive(),
  wallet_hint: z.string().default('เงินสด'),
  emoji: z.string().default('🎯')
});

// ── Helper: Call Gemini ──
async function callGemini(system: string, prompt: string, temperature = 0.1) {
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system,
    prompt,
    temperature,
  });
  return text;
}

// ── Helper: Extract JSON from AI response ──
function extractJSON(text: string): Record<string, unknown> | null {
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  try {
    const { message, wallets = [], categories = [] } = await req.json();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Intent Detection
    // ═══════════════════════════════════════════════════════════════
    const intentPrompt = `Detect the INTENT of this Thai financial message. Return ONLY ONE of these exact strings:

"record_transaction" (user recording income/expense)
"query_data" (user asking about their finances/summary)
"add_wallet" (user wants to add a new wallet)
"set_budget" (user wants to set a budget)
"add_debt" (user wants to record a debt)
"add_to_goal" (user is saving money towards a specific goal, e.g., 'เก็บเงินค่า...', 'ออมเงิน...', 'หยอดกระปุก...', 'เก็บเงินซื้อ...')
"general_chat" (general question, greeting, or unclear)
PRIORITY RULE (CRITICAL): หากประโยคมีคำว่า 'แบ่งไปซื้อ', 'เก็บเงินซื้อ', 'หยอดกระปุก', หรือพูดถึงการแบ่งเงินไปเป้าหมาย (เช่น 'ได้เงินมาแบ่งไปซื้อ karina 1000 บาท') คุณ ต้อง ตอบ intent เป็น 'add_to_goal' เท่านั้น! ห้ามตอบเป็น record_transaction เด็ดขาด!`;

    const intentRaw = await callGemini(intentPrompt, message, 0.0);
    const intent = intentRaw.replace(/["\s]/g, '') as Intent;

    console.log('[Intent Router] detected:', intent, '| raw:', intentRaw);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Intent Routing & Processing
    // ═══════════════════════════════════════════════════════════════
    switch (intent) {

      // ── Case 1: Record Transaction ──
      case 'record_transaction': {
        const walletList = wallets.length > 0
          ? wallets.map((w: { name: string }) => w.name).join(', ')
          : 'เงินสด';

        const categoryList = categories.length > 0
          ? categories.map((c: { name: string }) => c.name).join(', ')
          : 'อาหาร, เครื่องดื่ม, เดินทาง, ช้อปปิ้ง, บันเทิง, สุขภาพ, บิล, รายได้, อื่นๆ';

        const systemPrompt = `You are a highly intelligent financial data extraction AI. Understand Thai natural language, semantics, slang, and context perfectly.

DYNAMIC CONTEXT:
AVAILABLE CATEGORIES: ${categoryList}
AVAILABLE WALLETS: ${walletList}

CORE REASONING INSTRUCTIONS (CRITICAL):

1. Cashflow Direction (Income vs Expense):
   - Analyze the FINANCIAL INTENT, not just keywords.
   - If money enters the user's possession (refund, cashback, salary, gifts, transfers IN) → type = "income"
   - If money leaves the user (spending, paying, transferring OUT) → type = "expense"
   - Default to "expense" if ambiguous.

2. Semantic Amount Extraction:
   - Extract the correct monetary value in THB as a positive number.
   - Understand Thai numerical words (ห้าสิบ=50, พันสอง=1200).
   - Ignore non-monetary numbers (e.g., "2 คน" is not an amount).

3. Noise & Sentiment Filtering:
   - Extract ONLY the core financial action for description.
   - Strip emotional filler, complaints, slang (e.g., "วันนี้แม่งกินข้าวไป 50 โคตรแพง" → "กินข้าว").

4. Wallet Normalization:
   - Identify payment source/destination semantically (กสิกร/KBank/แบงก์เขียว = same wallet).
   - Map to the EXACT matching string in AVAILABLE WALLETS.
   - If no wallet mentioned → default to "เงินสด".

5. Multi-Transaction Parsing:
   - If multiple financial events in one sentence, split them into separate objects.
   - "ข้าว 50 กาแฟ 60" = 2 transactions, not 1 merged transaction.

6. Category Mapping (STRICT VOCABULARY):
   - Map to the most appropriate category from AVAILABLE CATEGORIES.
   - 'เครื่องดื่ม': กาแฟ, ชา, น้ำ, นม, น้ำอัดลม, เครื่องดื่ม, โออิชิ, อิชิตัน, เป๊ปซี่, โค้ก, สตาร์บัค, เต่าบิน, แอลกอฮอล์, เบียร์, เหล้า, coffee, drink. (ALL DRINKABLE LIQUIDS GO HERE).
   - 'อาหาร': ข้าว, ก๋วยเตี๋ยว, ขนม, อาหาร, หมูกระทะ, ชาบู, food, eat. (DO NOT put drinks here).
   - 'เดินทาง': รถ, น้ำมัน, วิน, แท็กซี่, บีทีเอส, bts, mrt, grab, bolt.
   - 'ช้อปปิ้ง': ซื้อเสื้อผ้า, รองเท้า, shopee, lazada. (DO NOT put health/skincare/supplements/laundry/services here).
   - 'สุขภาพ': ยา, หมอ, คลินิก, โรงพยาบาล, อาหารเสริม, วิตามิน, เวย์โปรตีน, ครีม, โลชั่น, เซรั่ม, สกินแคร์, ครีมกันแดด, มาร์กหน้า, โฟมล้างหน้า, skincare, supplement, doctor, hospital.
   - 'บิล': ค่าน้ำ, ค่าไฟ, ค่าเน็ต, ค่าเช่า, ผ่อนรถ, บัตรเครดิต, ซักผ้า, ซักอบผ้า, ตู้ซักผ้า, หยอดเหรียญ, ล้างรถ, ค่าซักแห้ง, ค่าบริการงานบ้าน.
   - 'บันเทิง': ดูหนัง, netflix, spotify, เกม, เติมเกม, steam.

7. EMOJI SELECTION RULES:
   ข้าว/อาหาร/ร้านอาหาร → 🍚 🍜 🍱 | กาแฟ/ชา/เครื่องดื่ม → ☕ 🧋 🥤 | grab/taxi/BTS/MRT → 🚗 🚕 🚇 | ช้อปปิ้ง/ห้าง/ออนไลน์ → 🛍 🛒 | Netflix/Spotify/YouTube → 📺 🎵 📱 | ยา/หมอ/โรงพยาบาล/อาหารเสริม/ครีม/เซรั่ม/สกินแคร์ → 💊 🏥 🧴 🧪 🩺 | ค่าไฟ/ค่าน้ำ/ค่าเน็ต/ซักผ้า/ค่าบริการ → 💡 💧 📶 🧺 🧼 | เงินเดือน/โบนัส → 💰 💵 | แม่ให้/พ่อให้/โอนมา → 🏦 💸 | ออม/ลงทุน → 📈 🏛
   STRICT RULE: Description contains 'karina' (or variations) -> Use emoji 🎯 (or a heart).

8. Error Handling:
   - If input contains no financial transaction, return empty array with message.

EXAMPLES:
Input: "แม่โอนเงินเข้า SCB 500"
Output: {"transactions":[{"description":"แม่โอนเงิน","amount":500,"type":"income","category":"รายได้","emoji":"🏦","wallet_hint":"SCB"}]}

Input: "กินข้าว 50 กาแฟ 65"
Output: {"transactions":[{"description":"กินข้าว","amount":50,"type":"expense","category":"อาหาร","emoji":"🍚","wallet_hint":"เงินสด"},{"description":"กาแฟ","amount":65,"type":"expense","category":"เครื่องดื่ม","emoji":"☕","wallet_hint":"เงินสด"}]}

Input: "ได้เงินคืนค่ากาแฟ 65 บาท"
Output: {"transactions":[{"description":"เงินคืนค่ากาแฟ","amount":65,"type":"income","category":"รายได้","emoji":"💰","wallet_hint":"เงินสด"}]}

Input: "ซื้อโออิชิ 20 บาท"
Output: {"transactions":[{"description":"ซื้อโออิชิ","amount":20,"type":"expense","category":"เครื่องดื่ม","emoji":"🥤","wallet_hint":"เงินสด"}]}

REQUIRED OUTPUT FORMAT (strict JSON, no markdown, no backticks):
{"transactions":[{"description":"string","amount":number,"type":"income|expense","category":"string","emoji":"string","wallet_hint":"string"}]}`;

        const text = await callGemini(systemPrompt, message);
        console.log('[record_transaction] AI raw:', text);

        const parsed = extractJSON(text);
        if (!parsed) {
          return NextResponse.json({
            intent: 'record_transaction',
            data: { transactions: [], message: 'ไม่สามารถแยกแยะข้อมูลได้ กรุณาลองพิมพ์ใหม่อีกครั้ง' }
          });
        }

        const validated = TransactionSchema.parse(parsed);

        // Enrich each transaction with AI-generation metadata and THB amount
        const enriched = {
          ...validated,
          transactions: validated.transactions.map((tx) => ({
            ...tx,
            amount_thb: tx.currency === 'THB' ? tx.amount : null,
            is_ai_generated: true,
          })),
        };

        return NextResponse.json({ intent: 'record_transaction', data: enriched });
      }

      // ── Case 2: Add Wallet ──
      case 'add_wallet': {
        const walletPrompt = `You are a Thai financial assistant. Parse the user's message to extract wallet details.
Return strict JSON (no markdown, no backticks):
{"name":"wallet name","balance":initial_balance_number}

Rules:
- Extract the wallet/bank name (e.g., "กสิกร", "SCB", "บัญชีออมทรัพย์", "TTB")
- Extract initial balance if mentioned, default to 0 if not mentioned.
- Understand Thai and English bank names.

Examples:
Input: "เพิ่มกระเป๋า TTB 5000"
Output: {"name":"TTB","balance":5000}

Input: "สร้างบัญชี กสิกร"
Output: {"name":"กสิกร","balance":0}`;

        const text = await callGemini(walletPrompt, message);
        console.log('[add_wallet] AI raw:', text);

        const parsed = extractJSON(text);
        if (!parsed) {
          return NextResponse.json({
            intent: 'add_wallet',
            data: null,
            message: 'ไม่สามารถแยกแยะข้อมูลกระเป๋าเงินได้ กรุณาลองใหม่'
          });
        }

        const validated = WalletSchema.parse(parsed);
        return NextResponse.json({ intent: 'add_wallet', data: validated });
      }

      // ── Case 3: Set Budget ──
      case 'set_budget': {
        const categoryList = categories.length > 0
          ? categories.map((c: { name: string }) => c.name).join(', ')
          : 'อาหาร, เครื่องดื่ม, เดินทาง, ช้อปปิ้ง, บันเทิง, สุขภาพ, บิล, อื่นๆ';

        const budgetPrompt = `You are a Thai financial assistant. Parse the user's message to extract budget details.
Return strict JSON (no markdown, no backticks):
{"category":"category_name","amount":budget_limit_number}

AVAILABLE CATEGORIES: ${categoryList}

Rules:
- Map to the closest matching category from AVAILABLE CATEGORIES.
- Extract the budget limit amount in THB.

Examples:
Input: "ตั้งงบอาหาร 3000"
Output: {"category":"อาหาร","amount":3000}

Input: "budget เดินทาง 1500 บาท"
Output: {"category":"เดินทาง","amount":1500}`;

        const text = await callGemini(budgetPrompt, message);
        console.log('[set_budget] AI raw:', text);

        const parsed = extractJSON(text);
        if (!parsed) {
          return NextResponse.json({
            intent: 'set_budget',
            data: null,
            message: 'ไม่สามารถแยกแยะข้อมูลงบประมาณได้ กรุณาลองใหม่'
          });
        }

        const validated = BudgetSchema.parse(parsed);
        return NextResponse.json({ intent: 'set_budget', data: validated });
      }

      // ── Case 4: Add Debt ──
      case 'add_debt': {
        const debtPrompt = `You are a Thai financial assistant. Parse the user's message to extract debt details.
Return strict JSON (no markdown, no backticks):
{"name":"debt_name","amount":total_debt_number,"interestRate":annual_interest_rate_number}

Rules:
- Extract the debt name/description (e.g., "ผ่อนรถ", "หนี้ กยศ", "บัตรเครดิต KTC")
- Extract total debt amount in THB.
- Extract annual interest rate as a percentage number (e.g., 3.5 for 3.5%). Default to 0 if not mentioned.

Examples:
Input: "บันทึกหนี้ กยศ 200000 ดอกเบี้ย 1%"
Output: {"name":"กยศ","amount":200000,"interestRate":1}

Input: "ผ่อนรถ 500000 ดอก 3.5%"
Output: {"name":"ผ่อนรถ","amount":500000,"interestRate":3.5}

Input: "หนี้บัตรเครดิต 30000"
Output: {"name":"บัตรเครดิต","amount":30000,"interestRate":0}`;

        const text = await callGemini(debtPrompt, message);
        console.log('[add_debt] AI raw:', text);

        const parsed = extractJSON(text);
        if (!parsed) {
          return NextResponse.json({
            intent: 'add_debt',
            data: null,
            message: 'ไม่สามารถแยกแยะข้อมูลหนี้สินได้ กรุณาลองใหม่'
          });
        }

        const validated = DebtSchema.parse(parsed);
        return NextResponse.json({ intent: 'add_debt', data: validated });
      }

      // ── Case 5: Add to Goal (Savings) ──
      case 'add_to_goal': {
        const walletList = wallets.length > 0
          ? wallets.map((w: { name: string }) => w.name).join(', ')
          : 'เงินสด';

        const goalPrompt = `You are a Thai financial assistant. Parse the user's message to extract savings goal details.
Return strict JSON (no markdown, no backticks):
{"goal_name":"name of the goal","amount":savings_amount_number,"wallet_hint":"source wallet name","emoji":"selected emoji"}

AVAILABLE WALLETS: ${walletList}

Rules:
- Extract the goal_name, amount, wallet_hint, and select an appropriate emoji.
- EMOJI RULES: If the goal_name is 'karina' (or related to idols/people), use 🎯, 💖, or 👩. Otherwise, default to 🎯.
- The goal_name should be clean — just the goal name without prefixes like "ค่า", "เงิน", "ซื้อ".

Examples:
Input: "เก็บเงินค่า karina 1000"
Output: {"goal_name":"karina","amount":1000,"wallet_hint":"เงินสด","emoji":"💖"}

Input: "ออมเงินซื้อ iPhone 2000 จาก SCB"
Output: {"goal_name":"iPhone","amount":2000,"wallet_hint":"SCB","emoji":"🎯"}

Input: "หยอดกระปุกท่องเที่ยว 500"
Output: {"goal_name":"ท่องเที่ยว","amount":500,"wallet_hint":"เงินสด","emoji":"🎯"}`;

        const text = await callGemini(goalPrompt, message);
        console.log('[add_to_goal] AI raw:', text);

        const parsed = extractJSON(text);
        if (!parsed) {
          return NextResponse.json({
            intent: 'add_to_goal',
            data: null,
            message: 'ไม่สามารถแยกแยะข้อมูลการออมได้ กรุณาลองใหม่'
          });
        }

        const validated = GoalSavingSchema.parse(parsed);
        return NextResponse.json({ intent: 'add_to_goal', data: validated });
      }

      // ── Case 6 & 7: Query Data / General Chat ──
      case 'query_data':
      case 'general_chat':
      default: {
        const chatPrompt = `You are a friendly Thai financial assistant named "Sina AI" (สินะ).
Respond in Thai naturally. Be concise and helpful.
If the user is asking about financial data, acknowledge that you can help and suggest what they can do (record transactions, add wallets, set budgets, track debts).
If it's a greeting, respond warmly.
Keep responses under 3 sentences.`;

        const text = await callGemini(chatPrompt, message, 0.7);
        return NextResponse.json({
          intent: intent === 'query_data' ? 'query_data' : 'general_chat',
          data: { message: text }
        });
      }
    }

  } catch (error) {
    console.error('[Intent Router] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        intent: 'error',
        data: null,
        message: 'ระบบ AI ประมวลผลผิดพลาด (Zod Validation) กรุณาลองใหม่'
      }, { status: 422 });
    }

    return NextResponse.json({
      intent: 'error',
      data: null,
      message: error instanceof Error ? error.message : 'Internal Server Error'
    }, { status: 500 });
  }
}
