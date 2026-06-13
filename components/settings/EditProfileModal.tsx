'use client';

// ═══════════════════════════════════════════════════════════════════
// EditProfileModal — Profile Identity Management
//
// - Edit display name via supabase.auth.updateUser()
// - Upload/change profile avatar via Supabase Storage
// - Glassmorphism modal with Utopia Tokyo aesthetic
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { User, Camera, Loader2, Save } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { uploadAvatar, updateUserProfile } from '@/lib/supabase/queries';
import { useToast } from '@/hooks/useToast';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatarUrl: string | null;
  currentEmail: string;
  userId: string;
  onSaved: () => void;
}

export default function EditProfileModal({
  open,
  onClose,
  currentName,
  currentAvatarUrl,
  currentEmail,
  userId,
  onSaved,
}: EditProfileModalProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentName);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset state when modal opens
  const handleClose = () => {
    if (saving) return;
    setName(currentName);
    setAvatarPreview(currentAvatarUrl);
    setAvatarFile(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size (max 2MB)
    if (!file.type.startsWith('image/')) {
      toast('กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('ขนาดไฟล์ต้องไม่เกิน 2MB', 'error');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const updates: { name?: string; avatar_url?: string } = {};

      // Upload avatar if changed
      if (avatarFile) {
        const url = await uploadAvatar(avatarFile, userId);
        updates.avatar_url = url;
      }

      // Update name if changed
      if (name.trim() && name.trim() !== currentName) {
        updates.name = name.trim();
      }

      if (Object.keys(updates).length === 0) {
        toast('ไม่มีการเปลี่ยนแปลง', 'info');
        setSaving(false);
        return;
      }

      await updateUserProfile(updates);
      toast('อัปเดตโปรไฟล์สำเร็จ', 'success');
      onSaved();
      onClose();
    } catch (err) {
      toast(
        `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'Unknown'}`,
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  return (
    <SettingsModal
      open={open}
      onClose={handleClose}
      title="EDIT PROFILE"
      subtitle="IDENTITY MANAGEMENT"
      icon={<User size={20} className="text-[var(--cyber-green)]" />}
    >
      <div className="space-y-5">
        {/* Avatar upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--cyber-green)]/30 bg-[var(--cyber-green)]/10 flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-[var(--cyber-green)] font-mono">
                  {getInitials(currentEmail)}
                </span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera size={20} className="text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-[10px] font-mono text-[var(--cyber-green)]/60 uppercase tracking-[0.04em] hover:text-[var(--cyber-green)] transition-colors"
          >
            เปลี่ยนรูปโปรไฟล์
          </button>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-[0.04em]">
            DISPLAY NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อที่แสดง"
            className="w-full rounded-xl border border-[var(--cyber-border)] bg-[var(--cyber-surface)] px-4 py-3 text-sm font-mono text-[var(--cyber-text)] placeholder-[var(--cyber-text-muted)] outline-none transition-all focus:border-[var(--cyber-green)]/40 shadow-none"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-[0.04em]">
            EMAIL (READ-ONLY)
          </label>
          <input
            type="email"
            value={currentEmail}
            readOnly
            className="w-full rounded-xl border border-[var(--cyber-border)] bg-[var(--cyber-surface-alt)] px-4 py-3 text-sm font-mono text-[var(--cyber-text-muted)] outline-none cursor-not-allowed"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border border-(--border) bg-(--surface-2) text-sm font-medium text-(--text-2) hover:bg-(--surface-3) transition-all disabled:opacity-30"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border border-[var(--cyber-green)]/30 bg-[var(--cyber-green)]/10 text-sm font-mono text-[var(--cyber-green)] uppercase tracking-[0.04em] flex items-center justify-center gap-2 hover:bg-[var(--cyber-green)]/20 transition-all disabled:opacity-30"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
