'use client';

// ═══════════════════════════════════════════════════════════════════
// TopBar — Holographic Glassmorphism Header + Mobile Drawer
//
// Utopia Tokyo §2:
//  ✓ Solid header background removed → glass backdrop-blur-2xl
//  ✓ Mobile drawer uses glassmorphism
//  ✓ Notification button has subtle glow
// ═══════════════════════════════════════════════════════════════════

import { getGreeting } from '@/lib/utils';
import {
  Bell, Menu, LayoutDashboard, History, Bot,
  Target, Wallet, TrendingUp, CreditCard,
  Receipt, Calculator, Settings, X,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Portal from '@/components/ui/Portal';

const navItems = [
  { href: '/', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/history', label: 'HISTORY', icon: History },
  { href: '/ai-chat', label: 'AI CHAT', icon: Bot },
  { href: '/goals', label: 'GOALS', icon: Target },
  { href: '/wallets', label: 'WALLETS', icon: Wallet },
  { href: '/net-worth', label: 'NET WORTH', icon: TrendingUp },
  { href: '/debt-timeline', label: 'DEBTS', icon: CreditCard },
  { href: '/monthly-bills', label: 'BILLS', icon: Receipt },
  { href: '/tax-planning', label: 'TAX', icon: Calculator },
  { href: '/settings', label: 'SETTINGS', icon: Settings },
];

export default function TopBar() {
  const greeting = getGreeting();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop / Mobile Header — glassmorphism ── */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] px-4 lg:px-8 glass">
        {/* Left — hamburger (mobile) + greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-[var(--cyber-text-secondary)] hover:bg-white/[0.04] lg:hidden transition-colors"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="text-sm text-[var(--cyber-text)] font-medium">{greeting}</p>
            <p className="text-[10px] font-mono tracking-[2px] text-[var(--cyber-text-muted)]">
              PERSONAL FINANCE HUD
            </p>
          </div>
        </div>

        {/* Right — notification + avatar */}
        <div className="flex items-center gap-3">
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-[var(--cyber-text-secondary)] hover:bg-white/[0.04] transition-colors">
            <Bell size={16} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--cyber-green)] hud-dot" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--cyber-green)]/10 border border-[var(--cyber-green)]/20">
            <span className="text-xs font-bold text-[var(--cyber-green)]">SN</span>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer — glassmorphism (Portal to escape stacking contexts) ── */}
      <Portal lockScroll={mobileOpen}>
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] h-[100dvh] w-screen lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[280px] glass border-r border-white/[0.06] flex flex-col animate-in slide-in-from-left-full duration-300">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cyber-green)]">
                  <span className="text-sm font-black text-[#09090B]">S</span>
                </div>
                <span className="text-sm font-bold tracking-[3px] text-[var(--cyber-text)]">SINA_FN</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--cyber-text-muted)] hover:bg-white/[0.04]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs tracking-[2px] transition-all',
                      isActive
                        ? 'bg-[var(--cyber-green)]/8 text-[var(--cyber-green)] border border-[var(--cyber-green)]/15'
                        : 'text-[var(--cyber-text-muted)] hover:bg-white/[0.04] hover:text-[var(--cyber-text)] border border-transparent'
                    )}
                  >
                    <Icon size={16} className={isActive ? 'text-[var(--cyber-green)]' : 'text-[var(--cyber-text-muted)]'} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
      </Portal>
    </>
  );
}
