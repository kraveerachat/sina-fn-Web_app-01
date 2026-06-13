'use client';

// ═══════════════════════════════════════════════════════════════════
// TopBar — translucent sticky header (matches design prototype)
//
// Brand logo + Sina_FN on the left, time-of-day greeting with
// the user's name, then theme toggle / notifications / avatar on
// the right. Navigation lives in the FloatingDock, not here.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getGreeting } from '@/lib/utils';
import { Bell, Settings, Wallet, History, LogOut, CheckCheck } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/hooks/useAuth';

export default function TopBar() {
  const greeting = getGreeting();
  const userProfile = useAppStore((s) => s.userProfile);
  const name = userProfile?.nickname || userProfile?.name || '';
  
  const { user, signOut } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url || null;
  const userName = user?.user_metadata?.nickname || user?.user_metadata?.name || name || 'Sina User';
  const userEmail = user?.email || '';

  // Dropdown States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  // Refs for click outside detection
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  const mockNotifications = [
    {
      id: 1,
      icon: '💰',
      text: 'ยินดีต้อนรับสู่ Sina_FN! เริ่มต้นบันทึกรายรับรายจ่ายได้เลย',
      time: 'เมื่อสักครู่',
      unread: unreadCount > 0,
    },
    {
      id: 2,
      icon: '☁️',
      text: 'ซิงค์ข้อมูลกับระบบ Supabase สำเร็จแล้ว',
      time: '5 นาทีที่แล้ว',
      unread: unreadCount > 0,
    },
    {
      id: 3,
      icon: '🤖',
      text: 'คลิกปุ่มแชทด้านล่างเพื่อพิมพ์คุยกับ AI บันทึกรายการ',
      time: '10 นาทีที่แล้ว',
      unread: unreadCount > 0,
    },
  ];

  return (
    <header className="glass sticky top-0 z-30 border-b border-(--hair)">
      <div className="mx-auto flex max-w-[1180px] items-center gap-3.5 px-4 py-3 lg:px-6">
        {/* ── Brand ── */}
        <div className="flex items-center gap-2">
          <Link href="/" className="press tap flex items-center justify-center">
            <img 
              src="/logo-sn.png" 
              alt="Sina_FN Logo" 
              className="h-[36px] w-[36px] object-contain transition-transform duration-200 hover:scale-105" 
            />
          </Link>
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-(--text)">
            Sina_FN
          </span>
        </div>

        {/* ── Greeting ── */}
        <p className="hidden whitespace-nowrap text-[13.5px] text-(--text-2) sm:block">
          {greeting}
          {userName && (
            <>
              {', '}
              <b className="font-semibold text-(--text)">{userName}</b>
            </>
          )}
        </p>

        <div className="flex-1" />

        {/* ── Controls ── */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* ── Notifications Bell ── */}
          <div className="relative flex" ref={bellRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              aria-label="Notifications"
              className={`press tap relative flex h-10 w-10 items-center justify-center rounded-full border border-(--border) bg-(--surface) text-(--text-2) transition-colors hover:bg-(--surface-2) hover:text-(--text) ${
                showNotifications ? 'bg-(--surface-2) text-(--text)' : ''
              }`}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-[7px] h-2 w-2 rounded-full border-2 border-(--surface) bg-(--gold)" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-12 w-80 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-(--shadow-lg) z-50 text-left"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-(--text)">การแจ้งเตือน</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs font-medium text-(--blue) hover:opacity-80 transition-opacity"
                      >
                        <CheckCheck size={13} />
                        อ่านทั้งหมด
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto subtle-scrollbar">
                    {mockNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 rounded-xl p-2 transition-colors ${
                          notif.unread ? 'bg-(--surface-2)' : ''
                        }`}
                      >
                        <span className="text-lg mt-0.5">{notif.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-medium leading-snug text-(--text) break-words">
                            {notif.text}
                          </p>
                          <p className="mt-1 text-[11px] text-(--text-3)">{notif.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── User Profile Avatar ── */}
          <div className="relative flex" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              aria-label="Profile menu"
              className="press tap flex h-[38px] w-[38px] items-center justify-center rounded-full border border-(--border) bg-(--surface-3) overflow-hidden shadow-sm hover:border-(--blue) transition-colors"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-(--text)">
                  {(userName || 'S').trim().charAt(0).toUpperCase()}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-12 w-64 rounded-2xl border border-(--border) bg-(--surface) p-3 shadow-(--shadow-lg) z-50 text-left"
                >
                  {/* User Profile Header */}
                  <div className="flex items-center gap-3 border-b border-(--border-2) pb-3 mb-2 px-1">
                    <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-(--blue) to-(--blue-ink) text-base font-semibold text-white">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        (userName || 'S').trim().charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-(--text)">
                        {userName}
                      </p>
                      <p className="truncate text-[11.5px] text-(--text-3)">
                        {userEmail || 'ไม่มีอีเมล'}
                      </p>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-(--text-2) hover:bg-(--surface-2) hover:text-(--text) transition-colors"
                    >
                      <Settings size={14} />
                      ตั้งค่าโปรไฟล์
                    </Link>
                    <Link
                      href="/wallets"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-(--text-2) hover:bg-(--surface-2) hover:text-(--text) transition-colors"
                    >
                      <Wallet size={14} />
                      กระเป๋าเงินของฉัน
                    </Link>
                    <Link
                      href="/history"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-(--text-2) hover:bg-(--surface-2) hover:text-(--text) transition-colors"
                    >
                      <History size={14} />
                      ประวัติธุรกรรม
                    </Link>
                    
                    <div className="h-px bg-(--border-2) my-1.5" />
                    
                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-(--expense) hover:bg-(--red-soft) hover:text-(--red) transition-colors"
                    >
                      <LogOut size={14} />
                      ออกจากระบบ
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
