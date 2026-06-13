'use client';

import { Moon, Sun } from 'lucide-react';
import { useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

// The <html data-theme> attribute is the single source of truth; the
// inline script in layout.tsx sets it before paint.
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'light';
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('sina-theme', next);
    } catch {}
  }, [theme]);

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      suppressHydrationWarning
      className="press tap flex h-10 w-10 items-center justify-center rounded-full border border-(--border) bg-(--surface) text-(--text-2) hover:bg-(--surface-2) hover:text-(--text) transition-colors"
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
