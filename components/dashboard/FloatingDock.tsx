'use client';

// ═══════════════════════════════════════════════════════════════════
// FloatingDock — primary navigation capsule (matches design prototype)
//
// Glass capsule, fixed to the bottom. All 9 pages live here as icon
// buttons (tooltip on hover, dot under the active page), then a
// hairline separator, then AI (blue gradient) and Quick Add (gold).
// Every dock item answers touch with spring physics (400/28) for a
// tactile, slightly bouncy press. On mobile the nav strip scrolls
// horizontally.
//
// Mounted in layout.tsx OUTSIDE of PageTransition / DoF containers
// so `fixed` positioning is never broken by ancestor transforms.
// ═══════════════════════════════════════════════════════════════════

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, History, Wallet, TrendingUp, Target,
  CreditCard, Receipt, Calculator, Settings, Sparkles, Plus,
} from 'lucide-react';
import { useDockActions } from '@/hooks/useDockActions';

const MotionLink = motion.create(Link);

const SPRING = { type: 'spring', stiffness: 400, damping: 28 } as const;

const NAV = [
  { href: '/', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/history', label: 'ประวัติ', icon: History },
  { href: '/wallets', label: 'กระเป๋าเงิน', icon: Wallet },
  { href: '/net-worth', label: 'ความมั่งคั่งสุทธิ', icon: TrendingUp },
  { href: '/goals', label: 'เป้าหมายออม', icon: Target },
  { href: '/debt-timeline', label: 'หนี้สิน', icon: CreditCard },
  { href: '/monthly-bills', label: 'บิลรายเดือน', icon: Receipt },
  { href: '/tax-planning', label: 'ภาษี', icon: Calculator },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
];

export default function FloatingDock() {
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { openAiChat, openQuickAdd } = useDockActions();

  // AI: bottom sheet on the dashboard, dedicated page elsewhere.
  const handleAi = () => {
    if (pathname === '/') openAiChat();
    else router.push('/ai-chat');
  };

  // Quick Add modal lives on the dashboard page; opening the flag
  // first means it is already open when the dashboard mounts.
  const handleAdd = () => {
    openQuickAdd();
    if (pathname !== '/') router.push('/');
  };

  const itemMotion = reduced
    ? {}
    : {
        whileHover: { y: -3 },
        whileTap: { scale: 0.9 },
        transition: SPRING,
      };

  return (
    <div className="dockwrap">
      <motion.div
        className="dock"
        initial={reduced ? false : { y: 40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, ...SPRING }}
      >
        <div className="dock-scroll">
          {NAV.map(({ href, label, icon: IconCmp }) => (
            <MotionLink
              key={href}
              href={href}
              aria-label={label}
              className={`di tap ${pathname === href ? 'on' : ''}`}
              {...itemMotion}
            >
              <IconCmp />
              <span className="tip">{label}</span>
            </MotionLink>
          ))}
        </div>

        <div className="sepr" />

        <motion.button
          onClick={handleAi}
          aria-label="AI ผู้ช่วย"
          className={`di ai ${pathname === '/ai-chat' ? 'on' : ''}`}
          {...itemMotion}
        >
          <Sparkles />
          <span className="tip">AI ผู้ช่วย</span>
        </motion.button>

        <motion.button
          onClick={handleAdd}
          aria-label="เพิ่มรายการ"
          className="di add"
          {...itemMotion}
        >
          <Plus />
          <span className="tip">เพิ่มรายการ</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
