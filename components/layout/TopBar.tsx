'use client';

import { getGreeting } from '@/lib/utils';
import { Bell, Menu } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, History, Bot, PiggyBank, Wallet,
  TrendingUp, CreditCard, Receipt, Calculator, Settings, X
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/history', label: 'HISTORY', icon: History },
  { href: '/ai-chat', label: 'AI CHAT', icon: Bot },
  { href: '/budgets', label: 'BUDGETS', icon: PiggyBank },
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
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#2A2F38] bg-[#1A1D21]/80 backdrop-blur-xl px-4 lg:px-8">
        {/* Left — hamburger (mobile) + greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#2A2F38] text-[#6B7280] hover:bg-[#252A30] lg:hidden"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="text-sm text-[#E8EAF0] font-medium">{greeting}</p>
            <p className="text-[10px] font-mono tracking-[2px] text-[#6B7280]">
              PERSONAL FINANCE HUD
            </p>
          </div>
        </div>

        {/* Right — notification + avatar */}
        <div className="flex items-center gap-3">
          <button className="relative flex h-9 w-9 items-center justify-center rounded-[6px] border border-[#2A2F38] text-[#6B7280] hover:bg-[#252A30] transition-colors">
            <Bell size={16} />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#39FF14] hud-dot" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#39FF14]/10 border border-[#39FF14]/20">
            <span className="text-xs font-bold text-[#39FF14]">SN</span>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[280px] bg-[#1A1D21] border-r border-[#2A2F38] flex flex-col animate-in slide-in-from-left-full duration-300">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-[#2A2F38] px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#39FF14]">
                  <span className="text-sm font-black text-[#1A1D21]">S</span>
                </div>
                <span className="text-sm font-bold tracking-[3px] text-[#E8EAF0]">SINA_FN</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[#6B7280] hover:bg-[#252A30]"
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
                      'flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-xs tracking-[2px] transition-all',
                      isActive
                        ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20'
                        : 'text-[#6B7280] hover:bg-[#252A30] hover:text-[#E8EAF0] border border-transparent'
                    )}
                  >
                    <Icon size={16} className={isActive ? 'text-[#39FF14]' : 'text-[#374151]'} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
