'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Briefcase, Plus, Trash2 } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import CyberCard from '@/components/ui/CyberCard';
import { supabase } from '@/lib/supabase/client';

type Step = 1 | 2 | 3;
type WalletType = 'bank' | 'cash' | 'credit' | 'ewallet';

interface WalletDraft {
  id: string;
  name: string;
  type: WalletType;
  balance: string;
}

// Persona Options
const personas = [
  { id: 'student', label: 'นักเรียน / นักศึกษา', icon: '🎓' },
  { id: 'employee', label: 'พนักงานประจำ', icon: '💼' },
  { id: 'freelance', label: 'ฟรีแลนซ์', icon: '💻' },
  { id: 'owner', label: 'เจ้าของกิจการ', icon: '🏢' },
  { id: 'family', label: 'ครอบครัว', icon: '👨‍👩‍👧' },
];

export default function SetupPage() {
  const [step, setStep] = useState<Step>(1);

  // Step 1 State
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  // Step 2 State
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  // Step 3 State — multi-wallet
  const [wallets, setWallets] = useState<WalletDraft[]>([
    { id: '1', name: 'กระเป๋าหลัก', type: 'bank', balance: '' },
  ]);
  const [monthlyIncome, setMonthlyIncome] = useState('');

  const typeIcon = (t: WalletType) =>
    ({ bank: '🏦', cash: '💵', credit: '💳', ewallet: '📱' })[t];

  const addWalletDraft = () => {
    setWallets((prev) => [...prev, { id: Date.now().toString(), name: '', type: 'cash', balance: '' }]);
  };

  const removeWalletDraft = (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
  };

  const updateWallet = (id: string, field: keyof WalletDraft, value: string) => {
    setWallets((prev) => prev.map((w) => w.id === id ? { ...w, [field]: value } : w));
  };

  const step3Valid =
    wallets.length > 0 &&
    wallets.every((w) => w.name.trim() !== '' && w.balance !== '' && !isNaN(Number(w.balance))) &&
    monthlyIncome !== '';

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (step === 1 && selectedFeatures.length > 0) setStep(2);
    else if (step === 2 && selectedPersona) setStep(3);
    else if (step === 3 && step3Valid) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userId = user.id;

          // Update profile persona
          await supabase.from('profiles').update({
            persona: selectedPersona,
            updated_at: new Date().toISOString(),
          }).eq('id', userId);

          // Soft-delete the placeholder zero-balance wallet from registration
          await supabase.from('wallets')
            .update({ is_deleted: true })
            .eq('user_id', userId)
            .eq('balance', 0);

          // Insert all user-defined wallets
          const inserts = wallets.map((w) => ({
            user_id: userId,
            name: w.name,
            type: w.type,
            balance: parseFloat(w.balance) || 0,
            icon: typeIcon(w.type),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_deleted: false,
          }));

          const { error: walletError } = await supabase.from('wallets').insert(inserts);
          if (walletError) console.error('Wallet creation error:', walletError);
        }
      } catch (err) {
        console.error('Setup error:', err);
      }
      window.location.href = '/onboarding/pin-setup';
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 h-1.5 rounded-full bg-(--surface-2) overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: step >= s ? '100%' : '0%' }}
              transition={{ duration: 0.4 }}
              className="h-full bg-[var(--green)]"
              style={{ boxShadow: step >= s ? '0 0 8px var(--green)40' : 'none' }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Features */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <p className="text-[10px] tracking-[0.04em] text-[var(--green)] font-medium mb-2">STEP 1 OF 3</p>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-(--text)">เลือกประเภทการใช้งาน</h2>
              <p className="text-sm text-[var(--text-2)] mt-1">SINA_FN จะปรับหน้าจอให้เหมาะกับการเงินของคุณ (เลือกได้มากกว่า 1)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card A */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleFeature('budget')}
                className={`text-left rounded-[16px] border p-5 transition-all w-full ${
                  selectedFeatures.includes('budget') 
                    ? 'border-[var(--green)]/50 bg-[var(--green)]/10 shadow-none' 
                    : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--green)]/30'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-[8px] bg-(--surface-2) flex items-center justify-center text-lg">💰</div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedFeatures.includes('budget') ? 'border-[var(--green)] bg-[var(--green)]' : 'border-[var(--text-2)]'}`}>
                    {selectedFeatures.includes('budget') && <Check size={12} className="text-white font-bold" strokeWidth={3} />}
                  </div>
                </div>
                <h3 className="text-base font-bold text-[var(--text)] mb-2">รายรับ-รายจ่าย</h3>
                <p className="text-xs text-[var(--text-2)]">บันทึกและวิเคราะห์การใช้เงินในแต่ละวันอย่างละเอียด</p>
              </motion.button>

              {/* Card B */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleFeature('invest')}
                className={`text-left rounded-[16px] border p-5 transition-all w-full ${
                  selectedFeatures.includes('invest') 
                    ? 'border-[var(--blue)]/50 bg-[var(--blue)]/10 shadow-none' 
                    : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--blue)]/30'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-[8px] bg-(--surface-2) flex items-center justify-center text-lg">📈</div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedFeatures.includes('invest') ? 'border-[var(--blue)] bg-[var(--blue)]' : 'border-[var(--text-2)]'}`}>
                    {selectedFeatures.includes('invest') && <Check size={12} className="text-white font-bold" strokeWidth={3} />}
                  </div>
                </div>
                <h3 className="text-base font-bold text-[var(--text)] mb-2">พอร์ตหุ้น / การลงทุน</h3>
                <p className="text-xs text-[var(--text-2)]">ติดตามราคาหุ้น กองทุนรวม และพอร์ต Crypto (เร็วๆ นี้)</p>
              </motion.button>

              {/* Card C */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleFeature('tax')}
                className={`text-left rounded-[16px] border p-5 transition-all w-full ${
                  selectedFeatures.includes('tax') 
                    ? 'border-[var(--gold)]/50 bg-[var(--gold)]/10 shadow-none' 
                    : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--gold)]/30'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-[8px] bg-(--surface-2) flex items-center justify-center text-lg">🧾</div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedFeatures.includes('tax') ? 'border-[var(--gold)] bg-[var(--gold)]' : 'border-[var(--text-2)]'}`}>
                    {selectedFeatures.includes('tax') && <Check size={12} className="text-white font-bold" strokeWidth={3} />}
                  </div>
                </div>
                <h3 className="text-base font-bold text-[var(--text)] mb-2">วางแผนภาษี</h3>
                <p className="text-xs text-[var(--text-2)]">คำนวณภาษีและเพิ่มลดหย่อนของปีภาษีปัจจุบัน</p>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Persona */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <p className="text-[10px] tracking-[0.04em] text-[var(--green)] font-medium mb-2">STEP 2 OF 3</p>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-(--text)">คุณคือใคร?</h2>
              <p className="text-sm text-[var(--text-2)] mt-1">เพื่อการแนะนำเทคนิคการเงินที่แม่นยำ</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {personas.map((p) => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPersona(p.id)}
                  className={`flex flex-col items-center justify-center p-6 gap-3 rounded-[12px] border transition-all ${
                    selectedPersona === p.id
                      ? 'bg-[var(--green)]/10 border-[var(--green)]/50 shadow-none'
                      : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--green)]/30'
                  }`}
                >
                  <span className="text-4xl">{p.icon}</span>
                  <span className={`text-sm font-medium ${selectedPersona === p.id ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>
                    {p.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3: Multi-wallet setup */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 max-w-lg mx-auto"
          >
            <div className="text-center">
              <p className="text-[10px] tracking-[0.04em] text-[var(--green)] font-medium mb-2">STEP 3 OF 3</p>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-(--text)">ตั้งค่ากระเป๋าเงิน</h2>
              <p className="text-sm text-[var(--text-2)] mt-1">เพิ่มกระเป๋าเงินทุกใบที่คุณมีได้เลย</p>
            </div>

            <CyberCard className="p-5 space-y-4">
              {/* Wallet list */}
              <div className="space-y-3">
                {wallets.map((w, idx) => (
                  <div key={w.id} className="flex gap-2 items-center">
                    {/* Type select */}
                    <select
                      value={w.type}
                      onChange={(e) => updateWallet(w.id, 'type', e.target.value)}
                      className="rounded-[6px] border border-[var(--border)] bg-(--surface-2) px-2 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--green)] shrink-0"
                    >
                      <option value="bank">🏦 ธนาคาร</option>
                      <option value="cash">💵 เงินสด</option>
                      <option value="credit">💳 บัตรเครดิต</option>
                      <option value="ewallet">📱 E-Wallet</option>
                    </select>
                    {/* Name */}
                    <input
                      type="text"
                      value={w.name}
                      onChange={(e) => updateWallet(w.id, 'name', e.target.value)}
                      placeholder={idx === 0 ? 'เช่น KBank' : 'ชื่อกระเป๋า'}
                      className="flex-1 rounded-[6px] border border-[var(--border)] bg-(--surface-2) px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--green)] font-mono"
                    />
                    {/* Balance */}
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-2)] font-mono">฿</span>
                      <input
                        type="number"
                        value={w.balance}
                        onChange={(e) => updateWallet(w.id, 'balance', e.target.value)}
                        placeholder="0"
                        className="w-full rounded-[6px] border border-[var(--border)] bg-(--surface-2) pl-6 pr-2 py-2 text-sm text-[var(--green)] outline-none focus:border-[var(--green)] font-mono"
                      />
                    </div>
                    {/* Remove (hide for last wallet) */}
                    {wallets.length > 1 && (
                      <button onClick={() => removeWalletDraft(w.id)} className="p-2 text-[var(--text-2)] hover:text-[var(--red)] transition-colors shrink-0">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total preview */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <span className="text-[10px] font-mono tracking-[0.04em] text-[var(--text-2)] uppercase">รวมทั้งหมด</span>
                <span className="text-lg font-bold font-mono text-[var(--green)]">
                  ฿{wallets.reduce((s, w) => s + (parseFloat(w.balance) || 0), 0).toLocaleString('th-TH')}
                </span>
              </div>

              {/* Add wallet button */}
              <button
                onClick={addWalletDraft}
                className="w-full flex items-center justify-center gap-2 rounded-[6px] border border-dashed border-[var(--border)] py-2.5 text-sm text-[var(--text-2)] hover:border-[var(--green)]/40 hover:text-[var(--green)] transition-all font-mono"
              >
                <Plus size={14} /> เพิ่มกระเป๋าเงิน
              </button>
            </CyberCard>

            {/* Monthly income */}
            <CyberCard className="p-5">
              <p className="text-[9px] tracking-[0.04em] text-[var(--text-2)] font-medium mb-3">รายได้ต่อเดือนโดยประมาณ (฿)</p>
              <div className="flex items-center gap-3 rounded-[8px] border border-[var(--border)] bg-(--surface-2) px-4 py-3 focus-within:border-[var(--green)]/30 transition-colors">
                <Briefcase size={18} className="text-[var(--text-3)] shrink-0" />
                <input
                  type="number"
                  placeholder="0"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="flex-1 bg-transparent text-xl font-bold text-[var(--text)] placeholder-[var(--text-3)] outline-none font-mono"
                />
                <span className="text-[var(--green)] font-mono text-sm">THB</span>
              </div>
            </CyberCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10">
        <div>
          {step > 1 && (
            <button
              onClick={handleBack}
              className="text-xs font-mono tracking-[0.04em] text-[var(--text-2)] hover:text-[var(--text)] transition-colors px-4 py-2"
            >
              ← BACK
            </button>
          )}
        </div>
        <CyberButton
          variant="primary"
          glow={step === 3 && step3Valid}
          onClick={handleNext}
          icon={step === 3 ? <Check size={16} /> : <ArrowRight size={16} />}
          disabled={
            (step === 1 && selectedFeatures.length === 0) ||
            (step === 2 && !selectedPersona) ||
            (step === 3 && !step3Valid)
          }
        >
          {step === 3 ? 'FINISH SETUP' : 'NEXT STEP'}
        </CyberButton>
      </div>
    </div>
  );
}
