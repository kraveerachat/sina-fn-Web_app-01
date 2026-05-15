'use client';

// ═══════════════════════════════════════════════════════════════════
// AppLockGuard — Auto-Lock Idle Detection Wrapper
//
// Mounts the useAppLock hook at the dashboard layout level so that
// idle detection runs globally across all dashboard pages.
// Renders nothing — purely a side-effect component.
// ═══════════════════════════════════════════════════════════════════

import { useAppLock } from '@/hooks/useAppLock';

export default function AppLockGuard() {
  // The hook handles all idle detection, visibility tracking,
  // and auto-redirect to /pin-verify internally.
  useAppLock();
  return null;
}
