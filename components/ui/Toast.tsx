'use client';

// ─────────────────────────────────────────────────────────────────
// ToastProvider — Cyberpunk Toast Notification Renderer
//
// Add <ToastProvider /> once in your layout (e.g. dashboard/layout.tsx).
// Then call useToast().toast() from any component.
//
// Design: bottom-right, 90-degree corners, neon glow matching type.
// ─────────────────────────────────────────────────────────────────

import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { useToast, type ToastType } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const toastConfig: Record<
  ToastType,
  {
    icon: React.ReactNode;
    accentColor: string;
    glowClass: string;
    labelClass: string;
  }
> = {
  success: {
    icon:       <Check size={13} />,
    accentColor:'border-l-[var(--cyber-green)]',
    glowClass:  'shadow-[0_0_16px_var(--cyber-green-glow)]',
    labelClass: 'text-[var(--cyber-green)]',
  },
  error: {
    icon:       <X size={13} />,
    accentColor:'border-l-[var(--cyber-red)]',
    glowClass:  'shadow-[0_0_16px_var(--cyber-red-glow)]',
    labelClass: 'text-[var(--cyber-red)]',
  },
  warning: {
    icon:       <AlertTriangle size={13} />,
    accentColor:'border-l-[var(--cyber-amber)]',
    glowClass:  'shadow-[0_0_16px_var(--cyber-amber-glow)]',
    labelClass: 'text-[var(--cyber-amber)]',
  },
  info: {
    icon:       <Info size={13} />,
    accentColor:'border-l-[var(--cyber-border)]',
    glowClass:  '',
    labelClass: 'text-[var(--cyber-text-secondary)]',
  },
};

const typeLabel: Record<ToastType, string> = {
  success: 'SUCCESS',
  error:   'ERROR',
  warning: 'WARN',
  info:    'INFO',
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
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{    opacity: 0, x: 48, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className={cn(
                // ── Base ── 
                'pointer-events-auto relative overflow-hidden',
                'rounded-none',
                'bg-[var(--cyber-surface)]',
                'border border-[var(--cyber-border)]',
                'border-l-2',
                cfg.accentColor,
                cfg.glowClass,
                'min-w-[280px] max-w-[380px]',
              )}
            >
              {/* Top-right corner accent */}
              <span className={cn(
                'absolute top-0 right-0 w-2.5 h-2.5',
                'border-t border-r opacity-30 pointer-events-none',
                cfg.labelClass.replace('text-', 'border-')
              )} />

              <div className="flex items-start gap-3 px-4 py-3">
                {/* Type icon */}
                <span className={cn('shrink-0 mt-0.5', cfg.labelClass)}>
                  {cfg.icon}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn('cyber-label mb-1', cfg.labelClass)}>
                    {typeLabel[item.type]}
                  </p>
                  <p className="text-sm text-[var(--cyber-text)] font-mono leading-snug">
                    {item.message}
                  </p>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => dismiss(item.id)}
                  className="shrink-0 mt-0.5 text-[var(--cyber-text-muted)] hover:text-[var(--cyber-text)] transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Auto-dismiss progress bar */}
              <motion.div
                className={cn('absolute bottom-0 left-0 h-[2px]', cfg.labelClass.replace('text-', 'bg-'))}
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
