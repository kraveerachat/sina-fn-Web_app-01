import { supabase } from './client';
import { AppTransaction, BudgetItem, categoryEmojiMap } from '@/store/appStore';
import type { Wallet } from '@/types';

// Helper to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL &&
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';
};

/**
 * Stringify a Supabase / PostgrestError properly.
 * Plain console.error(err) on a PostgrestError prints {} because it has
 * non-enumerable properties. This helper exposes the real message.
 */
export function formatSupabaseError(err: unknown): string {
  if (!err) return 'Unknown error';
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    return [
      e.message,
      e.details,
      e.hint,
      e.code ? `[${e.code}]` : null,
    ].filter(Boolean).join(' | ') || JSON.stringify(err);
  }
  return String(err);
}

// ── Transactions ──
export async function getTransactions(userId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name), wallets(name, type)')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(t => ({
    id: t.id,
    emoji: t.emoji || (t.categories ? categoryEmojiMap[t.categories.name] : '💸'),
    note: t.note,
    categoryName: t.categories?.name || 'ทั่วไป',
    amount: t.amount,
    type: t.type,
    transaction_date: t.transaction_date,
    walletId: t.wallet_id,
    walletName: t.wallets?.name || 'กระเป๋าหลัก',
    walletType: t.wallets?.type || 'cash'
  })) as AppTransaction[];
}

/**
 * Returns the UUID of an existing category (matching name + userId), OR
 * inserts a new one and returns the new id.
 * Returns null if both operations fail (e.g. RLS policy rejects insert)
 * so callers can decide whether to omit category_id.
 */
export async function getOrCreateCategory(
  name: string,
  userId: string
): Promise<string | null> {
  // 1. Look for an existing category
  const { data: existing, error: fetchErr } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .maybeSingle();

  if (fetchErr) {
    console.warn('[getOrCreateCategory] fetch failed:', formatSupabaseError(fetchErr));
  }
  if (existing) return existing.id;

  // 2. Insert if not found
  const { data: created, error: createError } = await supabase
    .from('categories')
    .insert([{
      user_id: userId,
      name,
      emoji: categoryEmojiMap[name] || '📦',
    }])
    .select('id')
    .single();

  if (createError) {
    console.warn(
      '[getOrCreateCategory] insert failed (will proceed without category):',
      formatSupabaseError(createError)
    );
    return null;
  }
  return created.id;
}

export async function addTransaction(transaction: Omit<AppTransaction, 'id'>, userId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  // Resolve category UUID (null-safe — returns null if category creation fails)
  const categoryId = await getOrCreateCategory(transaction.categoryName || 'อื่นๆ', userId);

  // ── DB schema columns: id, user_id, wallet_id, category_id,
  //    amount, type, note, transaction_date, created_at, updated_at, is_deleted
  // NOTE: 'wallet_name' and 'emoji' are AppTransaction ViewModel fields only — NOT in DB.
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      user_id:          userId,
      note:             transaction.note,
      ...(categoryId ? { category_id: categoryId } : {}),
      amount:           transaction.amount,
      type:             transaction.type,
      transaction_date: transaction.transaction_date,
      wallet_id:        transaction.walletId,
      // emoji       → NOT a DB column, omitted
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`addTransaction failed: ${formatSupabaseError(error)}`);
  }

  // ── Update wallet balance ──
  if (transaction.walletId) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', transaction.walletId)
      .single();

    if (wallet) {
      const delta = transaction.type === 'income'
        ? transaction.amount
        : -transaction.amount;

      await supabase
        .from('wallets')
        .update({
          balance: wallet.balance + delta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.walletId);
    }
  }

  return data as AppTransaction;
}

export async function deleteTransaction(id: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  // Read the transaction first so we can reverse the wallet balance
  const { data: tx } = await supabase
    .from('transactions')
    .select('amount, type, wallet_id')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // ── Reverse the wallet balance change ──
  if (tx?.wallet_id) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', tx.wallet_id)
      .single();

    if (wallet) {
      const reversal = tx.type === 'income'
        ? -tx.amount
        : tx.amount;

      await supabase
        .from('wallets')
        .update({
          balance: wallet.balance + reversal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tx.wallet_id);
    }
  }

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

/**
 * Creates a wallet and, when initialBalance > 0, immediately inserts an
 * "Opening Balance" income transaction so the balance survives any
 * recalculation that derives balance from the transactions table.
 *
 * Step 1 — insert wallet → get generated id
 * Step 2 — resolve category (graceful fallback to null if RLS rejects)
 * Step 3 — insert Opening Balance transaction with generated wallet id
 * Step 4 — rollback (soft-delete wallet) if transaction insert fails
 */
export async function createWalletWithOpeningBalance(
  wallet: Omit<Wallet, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>,
  userId: string
): Promise<Wallet> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const initialBalance = wallet.balance ?? 0;

  // ── STEP 1: Insert the wallet and retrieve its generated id ──────────────
  // Spread wallet but override user_id, balance, timestamps, is_deleted
  // so there are no duplicate or stale fields from the caller.
  const walletPayload = {
    name:       wallet.name,
    type:       wallet.type,
    icon:       wallet.icon,
    balance:    initialBalance,
    user_id:    userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_deleted: false,
  };

  const { data: newWallet, error: walletErr } = await supabase
    .from('wallets')
    .insert([walletPayload])
    .select()
    .single();

  if (walletErr) {
    throw new Error(`createWallet step 1 failed: ${formatSupabaseError(walletErr)}`);
  }

  // ── STEP 2: Resolve Opening Balance category (null-safe) ──────────────────
  if (initialBalance > 0) {
    const categoryId = await getOrCreateCategory('เปิดบัญชี', userId);

    // ── STEP 3: Insert Opening Balance transaction ─────────────────────────
    // Only use actual DB columns from the transactions table schema.
    // 'wallet_name' and 'emoji' are AppTransaction ViewModel fields — NOT in DB.
    const txPayload: Record<string, unknown> = {
      user_id:          userId,
      wallet_id:        newWallet.id,
      note:             'Opening Balance — ยอดเริ่มต้น',
      amount:           initialBalance,
      type:             'income',
      transaction_date: new Date().toISOString(),
    };
    // Only add category_id when we have a valid UUID (avoid FK violation)
    if (categoryId) txPayload.category_id = categoryId;

    const { error: txErr } = await supabase
      .from('transactions')
      .insert([txPayload]);

    // ── STEP 4: Rollback wallet if transaction failed ──────────────────────
    if (txErr) {
      console.error(
        '[createWalletWithOpeningBalance] tx insert failed — rolling back wallet:',
        formatSupabaseError(txErr)
      );
      await supabase
        .from('wallets')
        .update({ is_deleted: true })
        .eq('id', newWallet.id);
      throw new Error(`createWallet step 3 failed: ${formatSupabaseError(txErr)}`);
    }
  }

  return newWallet as Wallet;
}

/** Soft-deletes a wallet (sets is_deleted = true). */
export async function deleteWallet(id: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('wallets')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
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

// ── Wallet Balance Recalculation (data repair utility) ──
export async function recalculateWalletBalances(userId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  // 1. Get all wallets for user
  const { data: wallets, error: wErr } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .eq('is_deleted', false);

  if (wErr) throw wErr;
  if (!wallets || wallets.length === 0) return [];

  const results: { walletId: string; oldBalance: number; newBalance: number }[] = [];

  for (const wallet of wallets) {
    // 2. Get current stored balance
    const { data: current } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', wallet.id)
      .single();

    const oldBalance = current?.balance ?? 0;

    // 3. Sum all income transactions for this wallet
    const { data: incomeRows } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('wallet_id', wallet.id)
      .eq('type', 'income');

    const totalIncome = (incomeRows || []).reduce((sum, r) => sum + r.amount, 0);

    // 4. Sum all expense transactions for this wallet
    const { data: expenseRows } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('wallet_id', wallet.id)
      .eq('type', 'expense');

    const totalExpense = (expenseRows || []).reduce((sum, r) => sum + r.amount, 0);

    // 5. True balance = income - expense
    const newBalance = totalIncome - totalExpense;

    // 6. Update the wallet
    await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    results.push({ walletId: wallet.id, oldBalance, newBalance });
  }

  return results;
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

// ── Goals ──
import type { Goal } from '@/types';

export async function uploadGoalImage(file: Blob, userId: string): Promise<string> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const ext = file.type === 'image/png' ? 'png' : 'jpeg';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('goal-images')
    .upload(fileName, file, { upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: publicUrlData } = supabase.storage
    .from('goal-images')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

export async function getGoals(userId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('goals')
    .select('*, wallets(*)')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  // Combine wallet balance into goal mapping if necessary, or just return as is
  return (data as Array<{ wallets?: unknown } & Record<string, unknown>>).map(g => ({
    ...g,
    wallet: g.wallets
  })) as Goal[];
}

export async function createGoal(
  goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'wallet' | 'linked_wallet_id'>,
  userId: string
): Promise<Goal> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  // Step 1: Create a savings wallet linked to this goal
  const walletPayload = {
    name:       `🎯 ${goal.name}`,
    type:       'savings',
    icon:       '🎯',
    balance:    0,
    user_id:    userId,
    is_deleted: false,
  };

  const { data: newWallet, error: walletErr } = await supabase
    .from('wallets')
    .insert([walletPayload])
    .select()
    .single();

  if (walletErr) {
    throw new Error(`createGoal step 1 (wallet) failed: ${formatSupabaseError(walletErr)}`);
  }

  // Step 2: Insert the goal linking to the new wallet
  const goalPayload = {
    user_id: userId,
    name: goal.name,
    target_amount: goal.target_amount,
    target_date: goal.target_date,
    image_url: goal.image_url,
    linked_wallet_id: newWallet.id,
    is_deleted: false,
  };

  const { data: newGoal, error: goalErr } = await supabase
    .from('goals')
    .insert([goalPayload])
    .select()
    .single();

  if (goalErr) {
    // Note: robust implementation should rollback the wallet here
    await supabase.from('wallets').delete().eq('id', newWallet.id);
    throw new Error(`createGoal step 2 failed: ${formatSupabaseError(goalErr)}`);
  }

  return {
    ...newGoal,
    wallet: newWallet
  } as Goal;
}

export async function deleteGoal(id: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  // We could soft-delete or hard-delete. Assuming soft-delete for consistency.
  // We should also probably hide/delete the linked wallet if preferred, but it might have transactions.
  // For safety, let's just soft-delete the goal.
  const { error } = await supabase
    .from('goals')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  return true;
}
