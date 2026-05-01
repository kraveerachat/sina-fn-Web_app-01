// ═══════════════════════════════════════════════════════════════════
// lib/events.ts — Client-side Global Event Bus
// ═══════════════════════════════════════════════════════════════════

export const APP_MUTATE_EVENT = 'app_mutate';

/**
 * Dispatch a globally broadcasted mutation event.
 * Custom hooks should listen to this to invalidate and refetch their data.
 */
export function dispatchAppMutate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(APP_MUTATE_EVENT));
  }
}
