import { supabase } from './client';
import { AppTransaction, BudgetItem, categoryEmojiMap } from '@/store/appStore';
import type { Wallet } from '@/types';

// Helper to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';
};

// ── Transactions ──
export async function getTransactions(userId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(t => ({
    id: t.id,
    emoji: t.emoji || (t.categories ? categoryEmojiMap[t.categories.name] : '💸'),
    note: t.note,
    categoryName: t.categories?.name || t.category_id || 'ทั่วไป',
    amount: t.amount,
    type: t.type,
    transaction_date: t.transaction_date,
    walletId: t.wallet_id,
    walletName: t.wallet_name || 'กระเป๋าหลัก'
  })) as AppTransaction[];
}

export async function getOrCreateCategory(name: string, userId: string): Promise<string> {
  // 1. Try to find existing category
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle();

  if (existing) return existing.id;

  // 2. Create new if not found
  const { data: created, error: createError } = await supabase
    .from('categories')
    .insert([{
      user_id: userId,
      name: name,
      emoji: categoryEmojiMap[name] || '📦'
    }])
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}

export async function addTransaction(transaction: Omit<AppTransaction, 'id'>, userId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  // Resolve category UUID
  const categoryId = await getOrCreateCategory(transaction.categoryName || 'อื่นๆ', userId);

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      user_id: userId,
      note: transaction.note,
      category_id: categoryId,
      amount: transaction.amount,
      type: transaction.type,
      transaction_date: transaction.transaction_date,
      wallet_id: transaction.walletId,
    }])
    .select()
    .single();

  if (error) throw error;
  return data as AppTransaction;
}

export async function deleteTransaction(id: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// ── Wallets ──
export async function getWallets(userId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false);

  if (error) throw error;
  return data as Wallet[];
}

export async function addWallet(wallet: Omit<Wallet, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>, userId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('wallets')
    .insert([{ ...wallet, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data as Wallet;
}

export async function updateWalletBalance(id: string, newBalance: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Wallet;
}

// ── Budgets ──
export async function getBudgets(userId: string, month: number, year: number) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year);

  if (error) throw error;
  return data as BudgetItem[];
}

export async function upsertBudget(budget: Omit<BudgetItem, 'id'>, userId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  // Logic: check if budget for category already exists for month/year
  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', userId)
    .eq('categoryName', budget.categoryName)
    .eq('month', budget.month)
    .eq('year', budget.year)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('budgets')
      .update(budget)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as BudgetItem;
  } else {
    const { data, error } = await supabase
      .from('budgets')
      .insert([{ ...budget, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data as BudgetItem;
  }
}

// ── Bills (stub — schema planned for Phase 3) ──
export async function getBills(_userId: string): Promise<never[]> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  // Bills table not yet created — returns empty until Phase 3 implementation
  return [];
}

export async function toggleBillPaid(_id: string): Promise<true> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  return true;
}
