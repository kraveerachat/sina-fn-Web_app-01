'use client';

// ═══════════════════════════════════════════════════════════════════
// Settings Page — User Profile, Security, Data
// No direct Supabase calls. Uses hooks exclusively.
// ═══════════════════════════════════════════════════════════════════

import { motion }             from 'framer-motion';
import { useState }           from 'react';
import { User, LogOut, Shield, Download, Cloud, Database, ChevronRight } from 'lucide-react';
import CyberCard              from '@/components/ui/CyberCard';
import CyberButton            from '@/components/ui/CyberButton';
import CyberToggle            from '@/components/ui/CyberToggle';
import SectionHeader          from '@/components/ui/SectionHeader';
import { useAuth }            from '@/hooks/useAuth';
import { useTransactions }    from '@/hooks/useTransactions';
import { useToast }           from '@/hooks/useToast';

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const { user, signOut }                       = useAuth();
  const { transactions }                        = useTransactions(user?.id);
  const { toast }                               = useToast();
  const [appLock, setAppLock]                   = useState(true);
  const [logoutLoading, setLogoutLoading]       = useState(false);

  const getInitials = (email?: string | null) =>
    email ? email.substring(0, 2).toUpperCase() : 'SN';

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
      // signOut() in useAuth handles redirect to /login
    } catch {
      toast('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่', 'error');
      setLogoutLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!transactions.length) {
      toast('ไม่มีข้อมูลรายการที่จะ Export', 'warning');
      return;
    }
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Wallet', 'Note'];
    const rows    = transactions.map((t) =>
      `${t.id},${t.transaction_date},${t.type},${t.categoryName},${t.amount},${t.walletName},"${t.note}"`
    );
    const csv     = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link    = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `sina_fn_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast(`Export สำเร็จ — ${transactions.length} รายการ`, 'success');
  };

  const handleWipeData = () => {
    // Replaced window.confirm() with a two-step toast pattern
    toast(
      'ฟีเจอร์นี้ต้องยืนยันเพิ่มเติม — กรุณาติดต่อทีมพัฒนา',
      'warning'
    );
  };

  return (
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

      {/* ── SECTION 1: Profile ── */}
      <motion.div variants={itemVariants}>
        <SectionHeader title="โปรไฟล์" mb="mb-3" />
        <CyberCard className="!p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar — rounded-full is the ONLY exception to 90° rule */}
            <div className="w-16 h-16 rounded-full bg-[var(--cyber-green)]/20 border border-[var(--cyber-green)] flex items-center justify-center text-xl font-bold text-[var(--cyber-green)] tracking-wider">
              {getInitials(user?.email)}
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--cyber-text)]">
                {user?.user_metadata?.name || 'Sina User'}
              </h2>
              <p className="text-sm text-[var(--cyber-text-secondary)] font-mono">
                {user?.email || '—'}
              </p>
            </div>
          </div>
          <CyberButton variant="ghost" size="sm" icon={<User size={14} />}>
            แก้ไขโปรไฟล์
          </CyberButton>
        </CyberCard>
      </motion.div>

      {/* ── SECTION 2: Security ── */}
      <motion.div variants={itemVariants}>
        <SectionHeader title="ความปลอดภัย" mb="mb-3" />
        <div className="border border-[var(--cyber-border)] bg-[var(--cyber-surface)] overflow-hidden divide-y divide-[var(--cyber-border)]">
          {/* Change PIN */}
          <button className="w-full flex items-center justify-between p-5 hover:bg-[var(--cyber-surface-alt)] transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-[var(--cyber-text)]" />
              <span className="text-sm font-medium text-[var(--cyber-text)]">เปลี่ยน PIN</span>
            </div>
            <ChevronRight size={18} className="text-[var(--cyber-text-secondary)]" />
          </button>

          {/* App Lock Toggle — uses new CyberToggle component */}
          <div className="w-full flex items-center justify-between p-5">
            <CyberToggle
              checked={appLock}
              onChange={setAppLock}
              label="App Lock"
              description="ล็อคแอปเมื่อพับจอ"
            />
          </div>

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

      {/* ── SECTION 3: Data Management ── */}
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

          {/* Cloud Sync status */}
          <div className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <Database size={18} className="text-[var(--cyber-text)]" />
              <span className="text-sm font-medium text-[var(--cyber-text)]">สำรองข้อมูล (Cloud Sync)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--cyber-green)]">
              <Cloud size={14} />
              <span className="cyber-label-green">SYNCED</span>
            </div>
          </div>

          {/* Wipe data */}
          <div className="p-5">
            <CyberButton
              variant="warn"
              fullWidth
              onClick={handleWipeData}
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
        <p className="cyber-label tracking-[2px] mb-1">PERSONAL FINANCE HUD // V1.0.0</p>
        <p className="cyber-label text-[var(--cyber-text-muted)]/50 mt-3">
          CYBERPUNK / BRUTALIST DESIGN SYSTEM
        </p>
      </motion.div>
    </motion.div>
  );
}
