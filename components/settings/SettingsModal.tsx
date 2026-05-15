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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className={`relative w-full max-w-md backdrop-blur-3xl bg-[var(--cyber-bg)]/80 border ${accentBorder} rounded-none p-0 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.3)]`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* HUD corner accents */}
            <span className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${accentBorder} pointer-events-none`} />
            <span className={`absolute top-0 right-0 w-3 h-3 border-t border-r ${accentBorder} pointer-events-none`} />
            <span className={`absolute bottom-0 left-0 w-3 h-3 border-b border-l ${accentBorder} pointer-events-none`} />
            <span className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${accentBorder} pointer-events-none`} />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-none flex items-center justify-center"
                  style={{
                    background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--cyber-text)] font-mono uppercase tracking-[2px]">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-[10px] font-mono text-[var(--cyber-text-muted)] uppercase tracking-wider">
                      {subtitle}
                    </p>
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

            {/* Animated scan line */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accentColor} 40%, transparent), transparent)`,
              }}
              animate={{ y: [0, 400, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
