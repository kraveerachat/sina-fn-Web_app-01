'use client';

// ═══════════════════════════════════════════════════════════════════
// FloatingDock — Centered Floating Action Bar
//
// Mounted in layout.tsx OUTSIDE of PageTransition / DoF containers
// so that CSS `fixed` positioning is never broken by ancestor
// transforms, filters, or will-change properties.
// ═══════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { Plus, MessageSquare } from 'lucide-react';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useDockActions } from '@/hooks/useDockActions';

export default function FloatingDock() {
  const aiMag = useMagnetic(0.3);
  const addMag = useMagnetic(0.2);
  const { openAiChat, openQuickAdd } = useDockActions();

  return (
    <div className="fixed bottom-8 left-0 lg:left-[260px] right-0 z-[100] flex justify-center pointer-events-none">
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.92 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', damping: 22, stiffness: 260 }}
        className="
          pointer-events-auto flex items-center gap-4 p-2
          rounded-full border border-white/10
          bg-black/60 backdrop-blur-2xl
          shadow-2xl
        "
      >
        {/* AI Chat — magnetic hover + neon pulse */}
        <motion.button
          style={{ x: aiMag.x, y: aiMag.y }}
          onMouseMove={aiMag.onMouseMove}
          onMouseLeave={aiMag.onMouseLeave}
          onClick={openAiChat}
          whileTap={{ scale: 0.95 }}
          className="
            flex items-center justify-center gap-2
            rounded-full border border-(--cyber-green)/20 px-5 py-3
            text-(--cyber-green) font-semibold text-sm
            hover:bg-(--cyber-green)/8 hover:border-(--cyber-green)/40
            transition-all duration-200
            ai-core-btn
          "
        >
          <MessageSquare size={16} strokeWidth={2.5} />
          AI
        </motion.button>

        {/* Dock divider */}
        <div className="w-px h-8 bg-white/10" />

        {/* Quick Add — magnetic hover */}
        <motion.button
          style={{ x: addMag.x, y: addMag.y }}
          onMouseMove={addMag.onMouseMove}
          onMouseLeave={addMag.onMouseLeave}
          onClick={openQuickAdd}
          whileTap={{ scale: 0.95 }}
          className="
            flex items-center justify-center gap-2
            rounded-full bg-(--cyber-green) text-white px-6 py-3
            font-semibold text-sm
            shadow-[0_4px_24px_var(--cyber-green-glow)]
            hover:shadow-[0_4px_32px_var(--cyber-green-glow-sm)]
            hover:opacity-95 transition-all duration-200
          "
        >
          <Plus size={16} strokeWidth={2.5} />
          Quick Add
        </motion.button>
      </motion.div>
    </div>
  );
}
