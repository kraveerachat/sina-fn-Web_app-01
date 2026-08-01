'use client';

// ═══════════════════════════════════════════════════════════════════
// WalletCarousel — wallet rows on a clean surface
//
// Each wallet is a soft inset row: brand-tinted icon tile, name and
// type, right-aligned tabular balance. Rows lift gently on hover
// and squish on press.
// ═══════════════════════════════════════════════════════════════════

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { getWalletVisuals } from '@/lib/banks';
import WalletIconDisplay from '@/components/ui/WalletIconDisplay';
import SectionHeader from '@/components/ui/SectionHeader';
import type { Wallet } from '@/types';

interface WalletCarouselProps {
  wallets: Wallet[];
}

function WalletRow({ wallet }: { wallet: Wallet }) {
  const visuals = getWalletVisuals(wallet.name, wallet.type);
  const isCredit = wallet.type === 'credit';
  const isNegative = wallet.balance < 0 || isCredit;

  return (
    <Link
      href="/wallets"
      className="
        press tap flex items-center gap-3 rounded-2xl border border-(--border-2)
        bg-(--surface-2) p-3
        transition-all duration-200
        hover:bg-(--surface) hover:shadow-(--shadow) hover:-translate-y-0.5
      "
    >
      <WalletIconDisplay visuals={visuals} size={40} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-(--text)">
          {wallet.name}
        </p>
        <p className="truncate text-xs text-(--text-3) capitalize">
          {visuals.bankLabel ?? wallet.type}
        </p>
      </div>

      <p
        className="tnum shrink-0 text-[15px] font-semibold tracking-[-0.01em]"
        style={{ color: isNegative ? 'var(--expense)' : 'var(--text)' }}
      >
        {formatCurrency(wallet.balance)}
      </p>
    </Link>
  );
}

export default function WalletCarousel({ wallets }: WalletCarouselProps) {
  if (wallets.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
        <SectionHeader title="Wallets" />
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--surface-2) text-(--text-3)">
            💳
          </div>
          <p className="text-sm font-medium text-(--text-2)">ยังไม่มีกระเป๋าเงิน</p>
          <p className="mt-0.5 text-xs text-(--text-3)">
            เพิ่มกระเป๋าเงินแรกเพื่อเริ่มต้นติดตามยอดเงิน
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
      <SectionHeader
        title="Wallets"
        action={
          <Link
            href="/wallets"
            className="text-[13px] font-medium text-(--blue) hover:opacity-70 transition-opacity"
          >
            ดูทั้งหมด
          </Link>
        }
      />
      <div className="flex flex-col gap-2.5">
        {wallets.map((wallet) => (
          <WalletRow key={wallet.id} wallet={wallet} />
        ))}
      </div>
    </div>
  );
}
