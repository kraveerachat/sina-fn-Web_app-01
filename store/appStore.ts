'use client';

// ═══════════════════════════════════════════════════════════════════
// SINA_FN — App Store (Zustand)
//
// SCOPE: This store manages ONLY client-side UI state:
//   • userProfile  — display name, onboarding flag
//   • clearState   — called on logout to wipe local state
//
// TYPE CONTRACT:
//   AppTransaction, BudgetItem, categoryEmojiMap are now defined in
//   types/index.ts (single source of truth per Finding #6).
//   They are re-exported here for backward compatibility.
//
// All server data (wallets, transactions, budgets) is managed
// exclusively by the custom hooks in /hooks/*.
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Re-export from canonical types (backward compatibility) ──────────
// New code should import directly from @/types
export type { AppTransaction, BudgetItem } from '@/types';
export { categoryEmojiMap }               from '@/types';

// ── User Profile ──────────────────────────────────────────────────
export interface UserProfile {
  name: string;
  nickname: string;
  email: string;
  onboardingComplete: boolean;
}

// ── Store Interface ───────────────────────────────────────────────
interface AppState {
  userProfile: UserProfile | null;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  /** Called on logout — wipes all persisted client state */
  clearState: () => void;
}

// ── Store Definition ──────────────────────────────────────────────
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userProfile: null,

      setUserProfile: (data) =>
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, ...data }
            : {
                name: '',
                nickname: '',
                email: '',
                onboardingComplete: false,
                ...data,
              },
        })),

      clearState: () =>
        set(() => ({
          userProfile: null,
        })),
    }),
    {
      name: 'sina-fn-storage',
    }
  )
);
