'use client';

// ═══════════════════════════════════════════════════════════════════
// SettingsModal — Reusable Glassmorphism Modal Shell
//
// Utopia Tokyo aesthetic: backdrop-blur-3xl, HUD corners, scan line.
// Used by EditProfile, ChangePassword, ChangePin modals.
// ═══════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import React from 'react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  /** Border / accent color class — e.g. 'border-[var(--cyber-green)]' */
  accentBorder?: string;
  accentColor?: string;
  children: React.ReactNode;
}

export default function SettingsModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  accentBorder = 'border-[var(--cyber-green)]/50',
  accentColor = 'var(--cyber-green)',
  children,
}: SettingsModalProps) {
  return (
    <Portal lockScroll={open}>
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] h-[100dvh] w-screen flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-(--scrim) backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md rounded-3xl border border-(--border) bg-(--surface) shadow-(--shadow-lg) p-0 overflow-hidden"
            initial={{ scale: 0.96, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 18 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-(--text)">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-[12px] text-(--text-3)">{subtitle}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-[var(--cyber-text-muted)] hover:text-[var(--cyber-text)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
