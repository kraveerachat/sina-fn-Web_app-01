'use client';

// ═══════════════════════════════════════════════════════════════════
// Portal — React Portal for Escaping Stacking Contexts
//
// Renders children directly into document.body via createPortal,
// breaking free from any parent transform/filter/perspective that
// would otherwise trap `position: fixed` elements.
//
// Also includes automatic body scroll lock: when children are
// rendered (i.e., a modal is open), document.body overflow is
// set to 'hidden' to prevent background scrolling.
//
// Usage:
//   <Portal>
//     <AnimatePresence>
//       {isOpen && <MyModal />}
//     </AnimatePresence>
//   </Portal>
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  /** When true, locks body scroll. Defaults to false — caller controls. */
  lockScroll?: boolean;
}

export default function Portal({ children, lockScroll = false }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  // Only render portal client-side (document.body doesn't exist in SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (!lockScroll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lockScroll]);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
