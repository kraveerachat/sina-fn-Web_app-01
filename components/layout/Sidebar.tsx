'use client';

// ═══════════════════════════════════════════════════════════════════
// Sidebar — Holographic Glassmorphism + Neon Border Draw
//
// Utopia Tokyo §2:
//  ✓ Solid backgrounds removed → glass + backdrop-blur-2xl
//  ✓ Neon border draws on hover via CSS stroke-dasharray animation
//    (pixel-perfect alternative to GSAP DrawSVG)
//  ✓ Active state with persistent glow
// ═══════════════════════════════════════════════════════════════════

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  History,
  Bot,
  Target,
  Wallet,
  TrendingUp,
  CreditCard,
  Receipt,
  Calculator,
  Settings,
  type LucideIcon,
} from 'lucide-react';

// ── Nav definition ──
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
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

// ── Neon-bordered nav link with static glowing border ──
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'group relative overflow-hidden rounded-xl p-[2px] transition-all duration-300',
        isActive
          ? 'drop-shadow-[0_0_8px_rgba(0,255,127,0.5)]'
          : 'hover:drop-shadow-[0_0_6px_rgba(0,255,127,0.3)]'
      )}
    >
      {/* ── Static neon border layer ── */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl bg-(--cyber-green)',
          isActive
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        )}
      />

      {/* ── Idle border (visible when spinner is hidden) ── */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl transition-opacity duration-300',
          isActive
            ? 'opacity-0'
            : 'opacity-100 group-hover:opacity-0 border border-white/[0.06]'
        )}
      />

      {/* ── Inner box — masks center, holds content ── */}
      <div
        className={cn(
          'relative flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5',
          'text-xs font-medium tracking-[2px] transition-colors duration-200',
          // Solid dark background so the conic gradient only peeks through the 2px gap
          isActive ? 'bg-[#0d0d10]' : 'bg-[#0a0a0a] group-hover:bg-[#0d0d10]',
          isActive
            ? 'text-(--cyber-green)'
            : 'text-(--cyber-text-muted) group-hover:text-(--cyber-text)'
        )}
      >
        {/* Active inner glow */}
        {isActive && (
          <span
            className="absolute inset-0 rounded-[10px] pointer-events-none"
            style={{ boxShadow: 'inset 0 0 12px rgba(0,255,127,0.08)' }}
          />
        )}

        <Icon
          size={16}
          className={cn(
            'relative z-10 shrink-0 transition-colors',
            isActive
              ? 'text-(--cyber-green)'
              : 'text-(--cyber-text-muted) group-hover:text-(--cyber-text-secondary)'
          )}
        />
        <span className="relative z-10">{item.label}</span>

        {isActive && (
          <div className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-(--cyber-green) hud-dot" />
        )}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col lg:flex',
        // Glassmorphism — no solid background
        'glass border-r border-white/[0.06]'
      )}
    >
      {/* ── Logo ── */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cyber-green)]">
          <span className="text-sm font-black text-[#09090B]">S</span>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-[3px] text-[var(--cyber-text)]">
            SINA_FN
          </h1>
          <p className="text-[9px] tracking-[2px] text-[var(--cyber-text-muted)] font-mono">
            FINANCE HUD
          </p>
        </div>
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-white/[0.06] px-6 py-4">
        <p className="text-[9px] font-mono tracking-[2px] text-[var(--cyber-text-muted)]">
          [ SYS // V0.1.0 ]
        </p>
      </div>
    </aside>
  );
}
