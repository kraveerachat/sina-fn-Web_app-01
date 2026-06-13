'use client';

// ═══════════════════════════════════════════════════════════════════
// Settings — matches the design prototype (page_settings.jsx):
// four bento cards — profile, appearance (theme switch), security
// (password / PIN / app-lock + timer chips / sign out), and data
// (CSV export / sync status / wipe). All flows unchanged: modals,
// Supabase auth, app-lock hook, CSV export with UTF-8 BOM.
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useSyncExternalStore } from 'react';
import {
  KeyRound, Lock, ShieldCheck, Download, LogOut, Trash2,
  Pencil, Moon, Sun, Cloud, ChevronRight,
} from 'lucide-react';
import EditProfileModal       from '@/components/settings/EditProfileModal';
import ChangePasswordModal    from '@/components/settings/ChangePasswordModal';
import ChangePinModal         from '@/components/settings/ChangePinModal';
import WipeDataModal          from '@/components/settings/WipeDataModal';
import { useAuth }            from '@/hooks/useAuth';
import { useTransactions }    from '@/hooks/useTransactions';
import { useToast }           from '@/hooks/useToast';
import { useAppLock }         from '@/hooks/useAppLock';
import { wipeAllUserData }    from '@/lib/supabase/queries';

const LOCK_TIMER_OPTIONS = [1, 5, 10];

/* ── Switch (uses .switch from globals.css) ── */
function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`switch ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
      role="switch"
      aria-checked={on}
    >
      <i />
    </button>
  );
}

/* ── Theme state — <html data-theme> is the single source of truth ── */
function subscribeTheme(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}
const getTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

/* ── Setting row (prototype SettingRow) ── */
function SettingRow({
  icon: IconCmp, label, sub, right, danger, onClick, last,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
  last?: boolean;
}) {
  const body = (
    <>
      <div className="flex min-w-0 items-center gap-[13px]">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px]"
          style={{
            background: danger ? 'color-mix(in srgb, var(--expense) 14%, transparent)' : 'var(--surface-2)',
            color: danger ? 'var(--expense)' : 'var(--text-2)',
          }}
        >
          <IconCmp size={17} />
        </div>
        <div className="min-w-0 text-left">
          <p className={`text-[14.5px] font-medium ${danger ? 'text-(--expense)' : 'text-(--text)'}`}>
            {label}
          </p>
          {sub && <p className="text-[12.5px] text-(--text-3)">{sub}</p>}
        </div>
      </div>
      {right ?? (onClick && <ChevronRight size={17} className="shrink-0 text-(--text-3)" />)}
    </>
  );

  const cls = `flex w-full items-center justify-between gap-3 py-[13px] ${
    last ? '' : 'border-b border-(--border-2)'
  }`;

  return onClick ? (
    <button onClick={onClick} className={`${cls} press tap`}>{body}</button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function SettingsPage() {
  const { user, signOut, refresh } = useAuth();
  const { transactions }           = useTransactions(user?.id);
  const { toast }                  = useToast();
  const appLock                    = useAppLock();

  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'light');
  const toggleTheme = useCallback((dark: boolean) => {
    const next = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('sina-theme', next); } catch {}
  }, []);

  // ── Modal states ──
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePwOpen, setChangePwOpen]       = useState(false);
  const [changePinOpen, setChangePinOpen]     = useState(false);
  const [wipeModalOpen, setWipeModalOpen]     = useState(false);

  const userId    = user?.id ?? '';
  const userEmail = user?.email ?? '';
  const userName  = user?.user_metadata?.name || 'Sina User';
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  // ── Logout ──
  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      toast('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่', 'error');
    }
  };

  // ── Export CSV ──
  const handleExportCSV = () => {
    if (!transactions.length) {
      toast('ไม่มีข้อมูลรายการที่จะ Export', 'warning');
      return;
    }

    const escapeCsv = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Type', 'Wallet', 'Notes'];
    const rows = transactions.map((t) =>
      [
        t.transaction_date,
        escapeCsv(t.note || ''),
        escapeCsv(t.categoryName),
        t.amount,
        t.currency ?? 'THB',
        t.type,
        escapeCsv(t.walletName),
        escapeCsv(t.note || ''),
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sina_fn_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast(`Export สำเร็จ — ${transactions.length} รายการ`, 'success');
  };

  // ── Wipe All Data ──
  const handleWipeConfirm = async () => {
    if (!userId) return;
    try {
      const result = await wipeAllUserData(userId);
      const total = result.transactions + result.debts + result.goals + result.bills;
      toast(`ลบข้อมูลสำเร็จ — ${total} รายการถูกลบ`, 'success', 5000);
      window.dispatchEvent(new Event('app_mutate'));
    } catch (err) {
      toast(
        `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'error',
        6000
      );
      throw err;
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* ── Page head ── */}
        <div className="mb-1 mt-1.5">
          <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.025em] text-(--text) lg:text-[30px]">
            ตั้งค่า
          </h1>
          <p className="mt-1 text-[14.5px] text-(--text-2)">ปรับแต่งบัญชีและความปลอดภัย</p>
        </div>

        <div className="bento">
          {/* ── Profile ── */}
          <div className="cell-6">
            <div className="h-full rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-(--blue) to-(--blue-ink) text-[26px] font-semibold text-white">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    (userName || 'S').trim().charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[19px] font-semibold tracking-[-0.01em] text-(--text)">
                    {userName}
                  </p>
                  <p className="truncate text-[13.5px] text-(--text-3)">{userEmail || '—'}</p>
                </div>
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="pill pill-soft pill-sm press tap shrink-0"
                >
                  <Pencil /> แก้ไข
                </button>
              </div>
            </div>
          </div>

          {/* ── Appearance ── */}
          <div className="cell-6">
            <div className="h-full rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
              <p className="mb-2 text-sm font-semibold tracking-[-0.01em] text-(--text)">การแสดงผล</p>
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-[13px]">
                  <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-(--surface-2) text-(--text-2)">
                    {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
                  </div>
                  <span className="text-[14.5px] font-medium text-(--text)">ธีมมืด</span>
                </div>
                <Switch on={theme === 'dark'} onChange={toggleTheme} />
              </div>
            </div>
          </div>

          {/* ── Security ── */}
          <div className="cell-6">
            <div className="h-full rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
              <p className="mb-1 text-sm font-semibold tracking-[-0.01em] text-(--text)">ความปลอดภัย</p>
              <SettingRow icon={KeyRound} label="เปลี่ยนรหัสผ่าน" onClick={() => setChangePwOpen(true)} />
              <SettingRow icon={Lock} label="เปลี่ยน PIN" sub="PIN 6 หลัก" onClick={() => setChangePinOpen(true)} />
              <SettingRow
                icon={ShieldCheck}
                label="App Lock"
                sub={appLock.enabled ? 'ล็อกอัตโนมัติเมื่อไม่ใช้งาน' : 'ปิดอยู่'}
                right={
                  <Switch
                    on={appLock.enabled}
                    onChange={(v) => {
                      appLock.setEnabled(v);
                      toast(v ? 'App Lock เปิดใช้งาน' : 'App Lock ปิดใช้งาน', 'info', 2000);
                    }}
                  />
                }
              />
              {appLock.enabled && (
                <div className="flex gap-2 pb-1 pt-[13px]">
                  {LOCK_TIMER_OPTIONS.map((m) => {
                    const active = appLock.timerMinutes === m;
                    return (
                      <button
                        key={m}
                        onClick={() => {
                          appLock.setTimerMinutes(m);
                          toast(`ตั้งเวลาล็อก ${m} นาที`, 'info', 1500);
                        }}
                        className={`press tap rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                          active
                            ? 'border-transparent bg-(--text) text-(--surface)'
                            : 'border-(--border-2) bg-(--surface-2) text-(--text-2) hover:text-(--text)'
                        }`}
                      >
                        {m} นาที
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Data ── */}
          <div className="cell-6">
            <div className="h-full rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
              <p className="mb-1 text-sm font-semibold tracking-[-0.01em] text-(--text)">ข้อมูล</p>
              <SettingRow
                icon={Download}
                label="Export CSV"
                sub={`${transactions.length} รายการ`}
                onClick={handleExportCSV}
              />
              <SettingRow
                icon={Cloud}
                label="สถานะการเชื่อมต่อ"
                sub={userEmail || 'ยังไม่ได้เข้าสู่ระบบ'}
                right={
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-(--green-soft) px-2.5 py-1 text-[11px] font-semibold text-(--green)">
                    <i className="h-2 w-2 rounded-full bg-(--green)" />
                    Online
                  </span>
                }
              />
              <SettingRow icon={LogOut} label="ออกจากระบบ" onClick={handleLogout} />
              <SettingRow
                icon={Trash2}
                label="ล้างข้อมูลทั้งหมด"
                danger
                last
                onClick={() => setWipeModalOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* ── About ── */}
        <p className="mt-2 pb-2 text-center text-[12.5px] text-(--text-3)">
          Sina_FN · Personal Finance · v2.0.0
        </p>
      </div>

      {/* ── Modals ── */}
      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        currentName={userName}
        currentAvatarUrl={avatarUrl}
        currentEmail={userEmail}
        userId={userId}
        onSaved={refresh}
      />

      <ChangePasswordModal
        open={changePwOpen}
        onClose={() => setChangePwOpen(false)}
        userEmail={userEmail}
      />

      <ChangePinModal
        open={changePinOpen}
        onClose={() => setChangePinOpen(false)}
        userId={userId}
      />

      <WipeDataModal
        open={wipeModalOpen}
        onClose={() => setWipeModalOpen(false)}
        onConfirm={handleWipeConfirm}
        userEmail={userEmail}
        userId={userId}
      />
    </>
  );
}
