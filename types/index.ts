// ═══════════════════════════════════════════════════
// SINA_FN — TypeScript Interfaces
// ═══════════════════════════════════════════════════

export type PersonaType = 'student' | 'employee' | 'freelance' | 'business' | 'family';
export type WalletType = 'bank' | 'ewallet' | 'cash' | 'credit' | 'savings';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense' | 'transfer';
export type RolloverPolicy = 'reset' | 'rollover' | 'save';

export interface Profile {
  id: string;
  name: string | null;
  persona: PersonaType | null;
  pin_hash: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  balance: number;
  type: WalletType;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  type: CategoryType;
  color: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  note: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  // Multi-currency
  amount_thb?: number | null;
  currency?: string | null;
  exchange_rate?: number | null;
  // AI & metadata flags
  is_ai_generated?: boolean | null;
  emoji?: string | null;
  // Split & OCR
  is_split?: boolean | null;
  split_pending_amount?: number | null;
  ocr_image_url?: string | null;
  // Budget link
  budget_id?: string | null;
  // Joined fields (optional, for display)
  category?: Category;
  wallet?: Wallet;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  limit_amount: number;
  spent_amount: number;
  month: number;
  year: number;
  rollover_policy: RolloverPolicy;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  // Joined
  category?: Category;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  image_url: string | null;
  linked_wallet_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  // Joined
  wallet?: Wallet;
}

export interface MonthlyBill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  remaining_amount: number;
  principal_amount: number | null;
  interest_rate: number | null;
  minimum_payment: number | null;
  due_day: number | null;
  total_installments: number | null;
  remaining_installments: number | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

// ── AI Parsed Transaction ──
export interface ParsedTransaction {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  emoji: string;
}

export interface AiParseResponse {
  transactions: ParsedTransaction[];
}

// ── Dashboard Summary ──
export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  month: number;
  year: number;
}

// ═══════════════════════════════════════════════════════════════════
// ── UI ViewModels ─────────────────────────────────────────────────
// These are the shapes that UI components and hooks consume.
// They are derived/mapped from the raw DB types above.
// ═══════════════════════════════════════════════════════════════════

/**
 * The UI-friendly transaction object consumed by hooks, components,
 * and pages. Mapped from the raw DB `Transaction` type in queries.ts.
 */
export interface AppTransaction {
  id: string;
  /** Category emoji resolved at query time */
  emoji: string;
  /** User note or category name fallback */
  note: string;
  /** Human-readable category name (from categories.name join) */
  categoryName: string;
  amount: number;
  type: TransactionType;
  transaction_date: string;
  walletId: string;
  walletName: string;
  walletType: string;
  // Multi-currency (optional for display)
  amount_thb?: number | null;
  currency?: string | null;
  // AI & metadata flags
  is_ai_generated?: boolean | null;
  // Split & OCR
  is_split?: boolean | null;
  ocr_image_url?: string | null;
}

/**
 * The UI-friendly budget envelope object consumed by hooks and pages.
 * Mapped from the raw DB `Budget` type.
 */
export interface BudgetItem {
  id: string;
  categoryName: string;
  icon: string;
  spent: number;
  limit: number;
  color: string;
  rolloverPolicy: RolloverPolicy;
  month: number;
  year: number;
}

// ── Category Display Map ──────────────────────────────────────────
/** Maps Thai category names to emoji glyphs for display purposes */
export const categoryEmojiMap: Record<string, string> = {
  'อาหาร':      '🍚',
  'เครื่องดื่ม': '☕',
  'เดินทาง':    '🚗',
  'ช้อปปิ้ง':   '🛍️',
  'บันเทิง':    '🎬',
  'สุขภาพ':     '💊',
  'การศึกษา':   '📚',
  'บิล':        '📄',
  'รายได้':     '💰',
  'อื่นๆ':      '📦',
};

