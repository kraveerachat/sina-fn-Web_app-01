'use client';

// ═══════════════════════════════════════════════════════════════════
// useAppLock — Idle Detection & Auto-Lock System
//
// Tracks user activity (mouse, keyboard, touch, scroll).
// When the idle timer expires or the window loses visibility,
// clears the pin_verified cookie and redirects to /pin-verify.
//
// Settings are stored in localStorage:
//   - sina_fn_app_lock: "true" | "false"
//   - sina_fn_lock_timer: minutes as string (1, 5, 10)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback, useState } from 'react';

const APP_LOCK_KEY = 'sina_fn_app_lock';
const LOCK_TIMER_KEY = 'sina_fn_lock_timer';
const DEFAULT_TIMER = 5; // minutes

export interface AppLockState {
  enabled: boolean;
  timerMinutes: number;
  setEnabled: (v: boolean) => void;
  setTimerMinutes: (m: number) => void;
}

export function useAppLock(): AppLockState {
  const [enabled, setEnabledRaw] = useState(false);
  const [timerMinutes, setTimerMinutesRaw] = useState(DEFAULT_TIMER);
  const [ready, setReady] = useState(false);
  const lastActivity = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Read from localStorage on mount ──
  useEffect(() => {
    const storedLock = localStorage.getItem(APP_LOCK_KEY);
    const storedTimer = localStorage.getItem(LOCK_TIMER_KEY);
    if (storedLock !== null) setEnabledRaw(storedLock === 'true');
    if (storedTimer !== null) setTimerMinutesRaw(Number(storedTimer) || DEFAULT_TIMER);
    setReady(true);
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledRaw(v);
    localStorage.setItem(APP_LOCK_KEY, String(v));
  }, []);

  const setTimerMinutes = useCallback((m: number) => {
    setTimerMinutesRaw(m);
    localStorage.setItem(LOCK_TIMER_KEY, String(m));
  }, []);

  // ── Lock action: clear cookie → redirect ──
  const triggerLock = useCallback(() => {
    document.cookie = 'pin_verified=; path=/; max-age=0';
    window.location.href = '/pin-verify';
  }, []);

  // ── Activity tracker ──
  const resetActivity = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  // ── Visibility change handler ──
  const handleVisibility = useCallback(() => {
    if (!enabled || !ready) return;
    if (document.visibilityState === 'hidden') {
      // Don't lock immediately — just mark the time.
      // On return, check elapsed idle time.
    } else {
      // Returning to the tab: check if we exceeded the timer while away
      const elapsed = (Date.now() - lastActivity.current) / 1000 / 60;
      if (elapsed >= timerMinutes) {
        triggerLock();
      }
    }
  }, [enabled, ready, timerMinutes, triggerLock]);

  // ── Setup activity listeners and idle check interval ──
  useEffect(() => {
    if (!ready || !enabled) {
      // Clean up any existing interval if lock is disabled
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'] as const;
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);

    // Check idle time every 15 seconds
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - lastActivity.current) / 1000 / 60;
      if (elapsed >= timerMinutes) {
        triggerLock();
      }
    }, 15_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ready, enabled, timerMinutes, resetActivity, handleVisibility, triggerLock]);

  return {
    enabled: ready ? enabled : false,
    timerMinutes,
    setEnabled,
    setTimerMinutes,
  };
}
