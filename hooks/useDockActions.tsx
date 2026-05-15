'use client';

// ═══════════════════════════════════════════════════════════════════
// DockActions — Lightweight context bridging FloatingDock (layout)
// with modals that live in page-level components.
//
// The dock lives in layout.tsx (outside PageTransition transforms).
// The modals (QuickAddModal, AIChatBottomSheet) live in page.tsx
// because they need useDashboard().refetch.
//
// This context lets the dock open them without prop-drilling.
// ═══════════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface DockActionsState {
  aiChatOpen: boolean;
  quickAddOpen: boolean;
  openAiChat: () => void;
  closeAiChat: () => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
}

const DockActionsContext = createContext<DockActionsState | null>(null);

export function DockActionsProvider({ children }: { children: ReactNode }) {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const openAiChat = useCallback(() => setAiChatOpen(true), []);
  const closeAiChat = useCallback(() => setAiChatOpen(false), []);
  const openQuickAdd = useCallback(() => setQuickAddOpen(true), []);
  const closeQuickAdd = useCallback(() => setQuickAddOpen(false), []);

  return (
    <DockActionsContext.Provider
      value={{ aiChatOpen, quickAddOpen, openAiChat, closeAiChat, openQuickAdd, closeQuickAdd }}
    >
      {children}
    </DockActionsContext.Provider>
  );
}

export function useDockActions(): DockActionsState {
  const ctx = useContext(DockActionsContext);
  if (!ctx) throw new Error('useDockActions must be used within DockActionsProvider');
  return ctx;
}
