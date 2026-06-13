'use client';

// ═══════════════════════════════════════════════════════════════════
// QuickActionsCard — four tactile action tiles
//
// Top up / Pay bill / Transfer / Save. Each tile lifts on hover and
// squishes on press; color-tinted round icons follow the system
// vocabulary (blue action, gold transfer, green save).
// ═══════════════════════════════════════════════════════════════════

import { useRouter } from 'next/navigation';
import { Banknote, Receipt, ArrowLeftRight, PiggyBank } from 'lucide-react';

interface QuickActionsCardProps {
  onQuickAdd: () => void;
}

export default function QuickActionsCard({ onQuickAdd }: QuickActionsCardProps) {
  const router = useRouter();

  const actions = [
    { label: 'Top up', icon: Banknote, color: 'var(--blue)', onClick: onQuickAdd },
    { label: 'Pay bill', icon: Receipt, color: 'var(--red)', onClick: () => router.push('/monthly-bills') },
    { label: 'Transfer', icon: ArrowLeftRight, color: 'var(--gold)', onClick: onQuickAdd },
    { label: 'Save', icon: PiggyBank, color: 'var(--green)', onClick: () => router.push('/goals') },
  ];

  return (
    <div className="lift-card rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
      <p className="mb-4 text-[15px] font-semibold tracking-[-0.01em] text-(--text)">
        Quick Actions
      </p>
      <div className="grid grid-cols-4 gap-3 max-[420px]:grid-cols-2">
        {actions.map(({ label, icon: Icon, color, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="press tap flex flex-col items-center gap-2.5 rounded-2xl border border-(--border-2) bg-(--surface-2) px-2 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-(--surface) hover:shadow-(--shadow)"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
            >
              <Icon size={20} />
            </span>
            <span className="text-[13px] font-medium text-(--text)">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
