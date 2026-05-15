'use client';

// ═══════════════════════════════════════════════════════════════════
// Settings Page — Fully Operational System Core
//
// Phase 10 Final:
//  ✓ Profile editing: display name + avatar upload (Supabase Storage)
//  ✓ Password change via supabase.auth.updateUser()
//  ✓ Change PIN with old-PIN verification
//  ✓ App Lock with timer selection (1, 5, 10 min) + auto-lock
//  ✓ CSV export with proper headers & UTF-8 BOM
//  ✓ Cloud Sync status with real user email
//  ✓ Multi-step wipe: Password → PIN → Type DELETE
//  ✓ Logout via supabase.auth.signOut() → /login
// ═══════════════════════════════════════════════════════════════════

import { motion }             from 'framer-motion';
import { useState }           from 'react';
import {
  User, LogOut, Shield, Download, Database, ChevronRight,
  Lock, Key, Timer, CloudCog,
} from 'lucide-react';
import CyberCard              from '@/components/ui/CyberCard';
import CyberButton            from '@/components/ui/CyberButton';
import CyberToggle            from '@/components/ui/CyberToggle';
import SectionHeader          from '@/components/ui/SectionHeader';
import EditProfileModal       from '@/components/settings/EditProfileModal';
import ChangePasswordModal    from '@/components/settings/ChangePasswordModal';
import ChangePinModal         from '@/components/settings/ChangePinModal';
import WipeDataModal          from '@/components/settings/WipeDataModal';
import { useAuth }            from '@/hooks/useAuth';
import { useTransactions }    from '@/hooks/useTransactions';
import { useToast }           from '@/hooks/useToast';
import { useAppLock }         from '@/hooks/useAppLock';
import { wipeAllUserData }    from '@/lib/supabase/queries';

const LOCK_TIMER_OPTIONS = [
  { label: '1 นาที', value: 1 },
  { label: '5 นาที', value: 5 },
  { label: '10 นาที', value: 10 },
];

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const { user, signOut, refresh }                = useAuth();
  const { transactions }                          = useTransactions(user?.id);
  const { toast }                                 = useToast();
  const appLock                                   = useAppLock();

  // ── Modal states ──
  const [editProfileOpen, setEditProfileOpen]     = useState(false);
  const [changePwOpen, setChangePwOpen]           = useState(false);
  const [changePinOpen, setChangePinOpen]         = useState(false);
  const [wipeModalOpen, setWipeModalOpen]         = useState(false);
  const [logoutLoading, setLogoutLoading]         = useState(false);

  const userId    = user?.id ?? '';
  const userEmail = user?.email ?? '';
  const userName  = user?.user_metadata?.name || 'Sina User';
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  const getInitials = (email?: string | null) =>
    email ? email.substring(0, 2).toUpperCase() : 'SN';

  // ── Logout ──
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
    } catch {
      toast('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่', 'error');
      setLogoutLoading(false);
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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 pb-24 max-w-2xl mx-auto"
      >
        {/* Page heading */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-0.5 bg-[var(--cyber-text)]" />
          <h1 className="text-2xl font-bold tracking-[4px] text-[var(--cyber-text)] uppercase font-mono">
            SETTINGS
          </h1>
        </div>

        {/* ══════════════════════════════════════════════════════════════
         *  SECTION 1: Profile & Identity
         * ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants}>
          <SectionHeader title="โปรไฟล์" mb="mb-3" />
          <CyberCard className="!p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--cyber-green)]/20 border border-[var(--cyber-green)] flex items-center justify-center text-xl font-bold text-[var(--cyber-green)] tracking-wider shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(userEmail)
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--cyber-text)]">
                  {userName}
                </h2>
                <p className="text-sm text-[var(--cyber-text-secondary)] font-mono">
                  {userEmail || '—'}
                </p>
              </div>
            </div>
            <CyberButton
              variant="ghost"
              size="sm"
              icon={<User size={14} />}
              onClick={() => setEditProfileOpen(true)}
            >
              แก้ไขโปรไฟล์
            </CyberButton>
          </CyberCard>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
         *  SECTION 2: Security
         * ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants}>
          <SectionHeader title="ความปลอดภัย" mb="mb-3" />
          <div className="border border-[var(--cyber-border)] bg-[var(--cyber-surface)] overflow-hidden divide-y divide-[var(--cyber-border)]">
            {/* Change Password */}
            <button
              onClick={() => setChangePwOpen(true)}
              className="w-full flex items-center justify-between p-5 hover:bg-[var(--cyber-surface-alt)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Key size={18} className="text-[var(--cyber-amber)]" />
                <span className="text-sm font-medium text-[var(--cyber-text)]">เปลี่ยนรหัสผ่าน</span>
              </div>
              <ChevronRight size={18} className="text-[var(--cyber-text-secondary)]" />
            </button>

            {/* Change PIN */}
            <button
              onClick={() => setChangePinOpen(true)}
              className="w-full flex items-center justify-between p-5 hover:bg-[var(--cyber-surface-alt)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-[var(--cyber-green)]" />
                <span className="text-sm font-medium text-[var(--cyber-text)]">เปลี่ยน PIN</span>
              </div>
              <ChevronRight size={18} className="text-[var(--cyber-text-secondary)]" />
            </button>

            {/* App Lock Toggle */}
            <div className="w-full flex items-center justify-between p-5">
              <CyberToggle
                checked={appLock.enabled}
                onChange={(v) => {
                  appLock.setEnabled(v);
                  toast(
                    v ? 'App Lock เปิดใช้งาน' : 'App Lock ปิดใช้งาน',
                    'info',
                    2000
                  );
                }}
                label="App Lock"
                description="ล็อคแอปเมื่อไม่มีกิจกรรม"
              />
            </div>

            {/* Lock Timer — only visible when App Lock is ON */}
            {appLock.enabled && (
              <div className="w-full flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <Timer size={18} className="text-[var(--cyber-text-secondary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--cyber-text)]">Lock Timer</p>
                    <p className="text-[10px] font-mono text-[var(--cyber-text-muted)] uppercase tracking-wider">
                      ล็อคอัตโนมัติเมื่อไม่ใช้งาน
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {LOCK_TIMER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        appLock.setTimerMinutes(opt.value);
                        toast(`ตั้งเวลาล็อค ${opt.label}`, 'info', 1500);
                      }}
                      className={`px-3 py-1.5 rounded-none text-[10px] font-mono uppercase tracking-wider border transition-all ${
                        appLock.timerMinutes === opt.value
                          ? 'border-[var(--cyber-green)]/50 bg-[var(--cyber-green)]/10 text-[var(--cyber-green)]'
                          : 'border-[var(--cyber-border)] text-[var(--cyber-text-muted)] hover:bg-[var(--cyber-surface-alt)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Logout */}
            <div className="p-5">
              <CyberButton
                variant="danger"
                fullWidth
                icon={<LogOut size={16} />}
                onClick={handleLogout}
                loading={logoutLoading}
              >
                ออกจากระบบ
              </CyberButton>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
         *  SECTION 3: Data Management
         * ══════════════════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants}>
          <SectionHeader title="ข้อมูล" mb="mb-3" />
          <div className="border border-[var(--cyber-border)] bg-[var(--cyber-surface)] overflow-hidden divide-y divide-[var(--cyber-border)]">
            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between p-5 hover:bg-[var(--cyber-surface-alt)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download size={18} className="text-[var(--cyber-text)]" />
                <div className="text-left">
                  <span className="text-sm font-medium text-[var(--cyber-text)] block">Export CSV</span>
                  <span className="cyber-label">{transactions.length} รายการ</span>
                </div>
              </div>
              <span className="cyber-label">DOWNLOAD</span>
            </button>

            {/* Cloud Sync — real Supabase connection info */}
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <CloudCog size={18} className="text-[var(--cyber-green)]" />
                <div>
                  <span className="text-sm font-medium text-[var(--cyber-text)] block">
                    Connected to Supabase Cloud
                  </span>
                  <span className="text-[10px] font-mono text-[var(--cyber-text-muted)] uppercase tracking-wider">
                    {userEmail || 'NOT AUTHENTICATED'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--cyber-green)]">
                <div className="w-2 h-2 rounded-full bg-[var(--cyber-green)] animate-pulse" />
                <span className="cyber-label-green">REALTIME</span>
              </div>
            </div>

            {/* Database info */}
            <div className="w-full flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <Database size={18} className="text-[var(--cyber-text-secondary)]" />
                <span className="text-sm font-medium text-[var(--cyber-text)]">ข้อมูลในระบบ</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--cyber-text-muted)] uppercase tracking-wider">
                {transactions.length} TRANSACTIONS
              </span>
            </div>

            {/* Wipe data */}
            <div className="p-5">
              <CyberButton
                variant="warn"
                fullWidth
                onClick={() => setWipeModalOpen(true)}
              >
                ล้างข้อมูลทั้งหมด
              </CyberButton>
            </div>
          </div>
        </motion.div>

        {/* ── About ── */}
        <motion.div variants={itemVariants} className="text-center pt-8 pb-4">
          <h3 className="text-xl font-bold tracking-[4px] text-[var(--cyber-text)] uppercase font-mono mb-2">
            SINA_FN
          </h3>
          <p className="cyber-label tracking-[2px] mb-1">PERSONAL FINANCE HUD // V2.0.0</p>
          <p className="cyber-label text-[var(--cyber-text-muted)]/50 mt-3">
            CYBERPUNK / BRUTALIST DESIGN SYSTEM
          </p>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════
       *  MODALS (portal-level, outside main layout flow)
       * ══════════════════════════════════════════════════════════════ */}

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
