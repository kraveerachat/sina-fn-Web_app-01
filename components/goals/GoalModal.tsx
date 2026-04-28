'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, CalendarDays, Image as ImageIcon, Loader2, Upload, Crop } from 'lucide-react';
import type { Goal } from '@/types';
import Cropper, { Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropUtils';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'wallet' | 'linked_wallet_id'>, blob: Blob | null) => Promise<void>;
}

export default function GoalModal({ isOpen, onClose, onSubmit }: GoalModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  
  // Image and Cropping State
  const [imageFile, setImageFile] = useState<string | null>(null); // Object URL of selected file
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close helper
  const handleClose = () => {
    setName('');
    setAmount('');
    setTargetDate('');
    setImageFile(null);
    setCroppedBlob(null);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setCroppedPreviewUrl(null);
    setShowCropper(false);
    onClose();
  };

  const handleSave = async () => {
    if (!name || !amount) return;
    const parsedAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        user_id: '', // Filled in by hook
        name,
        target_amount: parsedAmount,
        target_date: targetDate || null,
        image_url: null
      }, croppedBlob);
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div key="form-view" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[var(--cyber-bg)] border border-[var(--cyber-border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden group"
        >
          {/* Top Edge Glow */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--cyber-cyan)]/30 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--cyber-border)]">
            <h2 className="text-xl font-bold tracking-wide text-[var(--cyber-text)] flex items-center gap-2">
              <Target size={20} className="text-[var(--cyber-cyan)]" /> 
              เป้าหมายใหม่ <span className="text-[10px] font-mono font-normal text-[var(--cyber-text-muted)] tracking-widest uppercase ml-1">/ New Goal</span>
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-[var(--cyber-text-muted)] hover:text-[var(--cyber-cyan)] hover:bg-[var(--cyber-cyan)]/10 transition-colors outline-none"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto hide-scrollbar space-y-6">
            
            {/* Goal Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--cyber-text)] mb-2">
                ชื่อเป้าหมาย <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase ml-1 font-normal">/ Goal Name</span>
                <span className="text-[var(--cyber-cyan)] ml-1">*</span>
              </label>
              <input
                type="text"
                autoFocus
                placeholder="เช่น ทริปญี่ปุ่น, iPhone 16"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--cyber-surface)] border border-[var(--cyber-border)] rounded-xl px-4 py-3 text-sm text-[var(--cyber-text)] placeholder-[var(--cyber-text-muted)] focus:outline-none focus:border-[var(--cyber-cyan)]/50 transition-colors"
              />
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-sm font-medium text-[var(--cyber-text)] mb-2">
                จำนวนเงินเป้าหมาย <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase ml-1 font-normal">/ Target Amount</span>
                <span className="text-[var(--cyber-cyan)] ml-1">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cyber-cyan)] font-bold">฿</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[var(--cyber-surface)] border border-[var(--cyber-border)] rounded-xl pl-9 pr-4 py-3 text-sm text-[var(--cyber-text)] placeholder-[var(--cyber-text-muted)] font-mono focus:outline-none focus:border-[var(--cyber-cyan)]/50 transition-colors"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--cyber-text)] mb-2">
                วันที่เป้าหมาย <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase ml-1 font-normal">/ Target Date</span>
              </label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cyber-cyan)]"/>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-[var(--cyber-surface)] border border-[var(--cyber-border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--cyber-text)] focus:outline-none focus:border-[var(--cyber-cyan)]/50 transition-colors font-mono"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* Image File Upload */}
            <div>
              <label className="block text-sm font-medium text-[var(--cyber-text)] mb-2">
                รูปภาพ <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase ml-1 font-normal">/ Image</span>
              </label>
              
              <div className="flex items-center gap-4">
                {/* Live Preview Circle */}
                <div className="shrink-0 w-16 h-16 rounded-full bg-[var(--cyber-surface)] border border-[var(--cyber-border)] flex items-center justify-center overflow-hidden relative shadow-inner">
                  {croppedPreviewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={croppedPreviewUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-[var(--cyber-text-muted)]" />
                  )}
                </div>
                
                {/* File Upload Button */}
                <div className="flex-1">
                  <label className="flex items-center justify-center w-full bg-[var(--cyber-surface)] border border-dashed border-[var(--cyber-border)] rounded-xl px-4 py-3 text-sm text-[var(--cyber-text-muted)] hover:text-[var(--cyber-text)] hover:border-[var(--cyber-cyan)]/50 transition-all cursor-pointer group/upload">
                    <Upload size={16} className="mr-2 group-hover/upload:text-[var(--cyber-cyan)] transition-colors" />
                    <span>อัปโหลดรูปภาพ / Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setImageFile(url);
                          setShowCropper(true);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 border-t border-[var(--cyber-border)] bg-[var(--cyber-surface)]/30 backdrop-blur-sm">
            <button
              onClick={handleSave}
              disabled={!name || !amount || isSubmitting}
              className="w-full group/btn relative flex items-center justify-center gap-2 rounded-xl bg-[var(--cyber-cyan)]/10 text-[var(--cyber-cyan)] py-3.5 text-sm font-bold border border-[var(--cyber-cyan)]/40 hover:bg-[var(--cyber-cyan)] hover:text-black hover:border-[var(--cyber-cyan)] transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--cyber-cyan)] shadow-[0_0_15px_rgba(34,211,238,0.1)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>กำลังสร้าง / CREATING...</span>
                </>
              ) : (
                <>
                  <Target size={18} />
                  <span>สร้างเป้าหมาย / CREATE GOAL</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Cropper Sub-Modal */}
      {showCropper && imageFile && (
        <div key="crop-view" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[var(--cyber-bg)] border border-[var(--cyber-border)] rounded-2xl overflow-hidden flex flex-col h-[70vh]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--cyber-border)]">
              <h3 className="font-bold flex items-center gap-2">
                <Crop size={16} className="text-[var(--cyber-cyan)]"/> ครอปรูปภาพ / Crop Image
              </h3>
              <button onClick={() => setShowCropper(false)} className="p-1 text-[var(--cyber-text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="relative flex-1 bg-black">
              <Cropper
                image={imageFile}
                crop={crop}
                zoom={zoom}
                aspect={1} // 1:1 aspect ratio for circular preview
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-4 border-t border-[var(--cyber-border)] space-y-4">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[var(--cyber-cyan)]"
              />
              <button
                onClick={async () => {
                  try {
                    const blob = await getCroppedImg(imageFile, croppedAreaPixels!);
                    if (blob) {
                      setCroppedBlob(blob);
                      const previewUrl = URL.createObjectURL(blob);
                      setCroppedPreviewUrl(previewUrl);
                    }
                    setShowCropper(false);
                  } catch (e) {
                    console.error('Cropping failed', e);
                  }
                }}
                className="w-full bg-[var(--cyber-cyan)] text-black font-bold py-3 rounded-xl hover:bg-[var(--cyber-cyan)]/80 transition-colors"
              >
                ยืนยัน / CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
