// ─────────────────────────────────────────────────────────────────
// useToast — Zustand-based Toast Notification Store
//
// Usage:
//   const { toast } = useToast();
//   toast('Saved!', 'success');
//   toast('Error occurred', 'error');
//   toast('Are you sure?', 'warning', 6000);
// ─────────────────────────────────────────────────────────────────

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastStore {
  toasts: ToastItem[];
  toast: (message: string, type?: ToastType, duration?: number) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],

  toast: (message, type = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    // Auto-dismiss after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  dismissAll: () => set({ toasts: [] }),
}));
