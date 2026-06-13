'use client';

// ─────────────────────────────────────────────────────────────────
// ToastProvider — quiet toast notifications
//
// Add <ToastProvider /> once in your layout (e.g. dashboard/layout.tsx).
// Then call useToast().toast() from any component.
//
// Design: bottom-right, clean surface with hairline border, tinted
// icon circle per type, thin auto-dismiss progress line.
// ─────────────────────────────────────────────────────────────────

import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { useToast, type ToastType } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const toastConfig: Record<
  ToastType,
  { icon: React.ReactNode; iconClass: string; barClass: string }
> = {
  success: {
    icon: <Check size={13} />,
    iconClass: 'bg-(--green-soft) text-(--green)',
    barClass: 'bg-(--green)',
  },
  error: {
    icon: <X size={13} />,
    iconClass: 'bg-(--red-soft) text-(--red)',
    barClass: 'bg-(--red)',
  },
  warning: {
    icon: <AlertTriangle size={13} />,
    iconClass: 'bg-(--gold-soft) text-(--gold)',
    barClass: 'bg-(--gold)',
  },
  info: {
    icon: <Info size={13} />,
    iconClass: 'bg-(--blue-soft) text-(--blue)',
    barClass: 'bg-(--blue)',
  },
};

export default function ToastProvider() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => {
          const cfg = toastConfig[item.type];

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 48, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className={cn(
                'pointer-events-auto relative overflow-hidden',
                'rounded-2xl border border-(--border) bg-(--surface)',
                'shadow-(--shadow-lg)',
                'min-w-[280px] max-w-[380px]'
              )}
            >
              <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Type icon in tinted circle */}
                <span
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    cfg.iconClass
                  )}
                >
                  {cfg.icon}
                </span>

                {/* Message */}
                <p className="min-w-0 flex-1 pt-1 text-sm leading-snug text-(--text)">
                  {item.message}
                </p>

                {/* Dismiss */}
                <button
                  onClick={() => dismiss(item.id)}
                  className="mt-1 shrink-0 text-(--text-3) hover:text-(--text) transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Auto-dismiss progress line */}
              <motion.div
                className={cn('absolute bottom-0 left-0 h-[2px] opacity-60', cfg.barClass)}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: item.duration / 1000, ease: 'linear' }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
