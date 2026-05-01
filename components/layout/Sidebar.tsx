'use client';

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
} from 'lucide-react';

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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-[#2A2F38] bg-[#1A1D21] lg:flex">
      {/* ── Logo ── */}
      <div className="flex h-16 items-center gap-3 border-b border-[#2A2F38] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#39FF14]">
          <span className="text-sm font-black text-[#1A1D21]">S</span>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-[3px] text-[#E8EAF0]">
            SINA_FN
          </h1>
          <p className="text-[9px] tracking-[2px] text-[#6B7280] font-mono">
            FINANCE HUD
          </p>
        </div>
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-xs font-medium tracking-[2px] transition-all duration-200',
                  isActive
                    ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20'
                    : 'text-[#6B7280] hover:bg-[#252A30] hover:text-[#E8EAF0] border border-transparent'
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-[#39FF14]' : 'text-[#374151] group-hover:text-[#6B7280]'
                  )}
                />
                {item.label}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#39FF14] hud-dot" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-[#2A2F38] px-6 py-4">
        <p className="text-[9px] font-mono tracking-[2px] text-[#374151]">
          [ SYS // V0.1.0 ]
        </p>
      </div>
    </aside>
  );
}
