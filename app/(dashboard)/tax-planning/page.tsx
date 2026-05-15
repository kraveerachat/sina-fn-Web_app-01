'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Loader2, Calculator, ChevronDown, ChevronUp, Info, Save } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import CyberCard from '@/components/ui/CyberCard';
import SectionHeader from '@/components/ui/SectionHeader';
import ScrambleText from '@/components/ui/ScrambleText';
import { useAuth } from '@/hooks/useAuth';
import { useAnnualIncome } from '@/hooks/useAnnualIncome';
import { getTaxDeductions, saveTaxDeductions, formatSupabaseError } from '@/lib/supabase/queries';
import { formatCurrency } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

// ── Thai PIT brackets (2024-2025 rates) ──
interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  label: string;
}

const TAX_BRACKETS: TaxBracket[] = [
  { min: 0,         max: 150_000,   rate: 0,  label: 'ยกเว้นภาษี' },
  { min: 150_001,   max: 300_000,   rate: 5,  label: '5%' },
  { min: 300_001,   max: 500_000,   rate: 10, label: '10%' },
  { min: 500_001,   max: 750_000,   rate: 15, label: '15%' },
  { min: 750_001,   max: 1_000_000, rate: 20, label: '20%' },
  { min: 1_000_001, max: 2_000_000, rate: 25, label: '25%' },
  { min: 2_000_001, max: 5_000_000, rate: 30, label: '30%' },
  { min: 5_000_001, max: null,      rate: 35, label: '35%' },
];

// ── Common Thai deductions ──
interface Deduction {
  id: string;
  name: string;
  nameTH: string;
  maxAmount: number;
  description: string;
}

const COMMON_DEDUCTIONS: Deduction[] = [
  { id: 'personal',   name: 'Personal Allowance',      nameTH: 'ค่าลดหย่อนส่วนตัว',       maxAmount: 60_000,  description: 'ได้ทุกคนที่มีเงินได้' },
  { id: 'ssf',        name: 'SSF (Super Savings Fund)', nameTH: 'กองทุน SSF',              maxAmount: 200_000, description: 'สูงสุด 30% ของเงินได้ ไม่เกิน ฿200,000' },
  { id: 'rmf',        name: 'RMF (Retirement Fund)',    nameTH: 'กองทุน RMF',              maxAmount: 500_000, description: 'สูงสุด 30% ของเงินได้ ไม่เกิน ฿500,000' },
  { id: 'insurance',  name: 'Life Insurance',           nameTH: 'เบี้ยประกันชีวิต',         maxAmount: 100_000, description: 'ค่าเบี้ยประกันชีวิตทั่วไป' },
  { id: 'health_ins', name: 'Health Insurance',         nameTH: 'เบี้ยประกันสุขภาพ',        maxAmount: 25_000,  description: 'ประกันสุขภาพตนเอง' },
  { id: 'social',     name: 'Social Security',          nameTH: 'ประกันสังคม',              maxAmount: 9_000,   description: 'หักตามจริงสูงสุด ฿9,000/ปี' },
  { id: 'home_loan',  name: 'Home Loan Interest',       nameTH: 'ดอกเบี้ยบ้าน',            maxAmount: 100_000, description: 'ดอกเบี้ยเงินกู้ยืมซื้อบ้าน' },
  { id: 'donation',   name: 'Donations',                nameTH: 'เงินบริจาค',              maxAmount: 100_000, description: 'บริจาคทั่วไป (ไม่เกิน 10% ของเงินได้หลังหัก)' },
  { id: 'parent',     name: 'Parent Care',              nameTH: 'เลี้ยงดูบิดามารดา',        maxAmount: 60_000,  description: 'บิดา/มารดาอายุ 60+ (คนละ ฿30,000)' },
  { id: 'shop',       name: 'Easy E-Receipt',           nameTH: 'ช้อปดีมีคืน',             maxAmount: 50_000,  description: 'ตามมาตรการภาครัฐ (ถ้ามี)' },
];

// ── Calculate Thai PIT ──
function calculateTax(annualIncome: number, totalDeductions: number) {
  const taxableIncome = Math.max(0, annualIncome - totalDeductions);
  let totalTax = 0;
  const bracketBreakdown: { bracket: TaxBracket; taxableInBracket: number; taxAmount: number }[] = [];

  for (const bracket of TAX_BRACKETS) {
    const upper = bracket.max ?? Infinity;
    if (taxableIncome <= bracket.min) {
      bracketBreakdown.push({ bracket, taxableInBracket: 0, taxAmount: 0 });
      continue;
    }
    const incomeInBracket = Math.min(taxableIncome, upper) - bracket.min + (bracket.min === 0 ? 0 : 1);
    const clampedIncome = Math.max(0, bracket.min === 0 ? Math.min(taxableIncome, upper) : incomeInBracket);
    const tax = clampedIncome * (bracket.rate / 100);
    totalTax += tax;
    bracketBreakdown.push({ bracket, taxableInBracket: clampedIncome, taxAmount: tax });
  }

  return { taxableIncome, totalTax, effectiveRate: annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0, bracketBreakdown };
}

export default function TaxPlanningPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const currentYear = new Date().getFullYear();
  const { annualIncome: fetchedIncome, loading: incomeLoading } = useAnnualIncome(userId, currentYear);

  const pageRef = useRef<HTMLDivElement>(null);

  // Income: use fetched value as base, allow user override
  const [incomeOverride, setIncomeOverride] = useState<number | null>(null);
  const annualIncome = incomeOverride ?? fetchedIncome;

  // Deductions: loaded from profile, editable locally
  const [deductionAmounts, setDeductionAmounts] = useState<Record<string, number>>({
    personal: 60_000,
    social: 9_000,
  });
  const [deductionsLoading, setDeductionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAllDeductions, setShowAllDeductions] = useState(false);

  const loading = incomeLoading || deductionsLoading;

  // Load saved deductions from profile
  useEffect(() => {
    if (!userId) {
      setDeductionsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const saved = await getTaxDeductions(userId);
        if (!cancelled && saved && Object.keys(saved).length > 0) {
          setDeductionAmounts(saved);
        }
      } catch (err) {
        console.error('[TaxPlanning] load deductions error:', err);
      } finally {
        if (!cancelled) setDeductionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const totalDeductions = useMemo(
    () => Object.values(deductionAmounts).reduce((s, v) => s + v, 0),
    [deductionAmounts]
  );

  const taxResult = useMemo(
    () => calculateTax(annualIncome, totalDeductions),
    [annualIncome, totalDeductions]
  );

  const updateDeduction = (id: string, value: number) => {
    const deduction = COMMON_DEDUCTIONS.find((d) => d.id === id);
    const clamped = deduction ? Math.min(value, deduction.maxAmount) : value;
    setDeductionAmounts((prev) => ({ ...prev, [id]: Math.max(0, clamped) }));
  };

  const handleSaveDeductions = useCallback(async () => {
    if (!userId || saving) return;
    try {
      setSaving(true);
      await saveTaxDeductions(userId, deductionAmounts);
    } catch (err) {
      console.error('[TaxPlanning] save error:', formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  }, [userId, deductionAmounts, saving]);

  // GSAP stagger
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      const sections = gsap.utils.toArray<HTMLElement>('.tax-section', pageRef.current);
      if (sections.length === 0) return;
      gsap.set(sections, { y: 30, opacity: 0 });
      gsap.to(sections, {
        y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: pageRef.current, start: 'top 85%', once: true },
      });
    },
    { scope: pageRef, dependencies: [loading] }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-7 h-7 text-[var(--cyber-green)] animate-spin" />
      </div>
    );
  }

  const visibleDeductions = showAllDeductions ? COMMON_DEDUCTIONS : COMMON_DEDUCTIONS.slice(0, 5);

  return (
    <div ref={pageRef} className="flex flex-col h-full space-y-6 pb-20 lg:pb-6">
      {/* ── Header ── */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-cyan)] hud-dot" />
          <span className="text-[10px] tracking-[3px] text-[var(--cyber-cyan)] font-mono uppercase">TAX ESTIMATION HUD</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--cyber-text)]">วางแผนภาษี</h1>
      </div>

      {/* ── Tax Summary Hero ── */}
      <CyberCard glow className="p-6 tax-section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input: Annual Income */}
          <div>
            <label className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-[2px] block mb-2">
              เงินได้พึงประเมิน (รายปี)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cyber-text-muted)] text-sm font-mono">฿</span>
              <input
                type="number"
                value={incomeOverride ?? fetchedIncome}
                onChange={(e) => setIncomeOverride(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-[var(--cyber-cyan)]/30 bg-white/[0.03] pl-8 pr-3 py-3 text-lg text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-cyan)]/60 font-mono transition-all"
              />
            </div>
            <p className="text-[9px] font-mono text-[var(--cyber-text-muted)] mt-1">
              {fetchedIncome > 0 && incomeOverride === null
                ? `จากรายรับจริงปี ${currentYear}`
                : `≈ ${formatCurrency(annualIncome / 12)}/เดือน`}
              {incomeOverride !== null && fetchedIncome > 0 && (
                <button
                  onClick={() => setIncomeOverride(null)}
                  className="ml-2 text-[var(--cyber-cyan)] hover:underline"
                >
                  ใช้ยอดจริง ({formatCurrency(fetchedIncome)})
                </button>
              )}
            </p>
          </div>

          {/* Tax amount */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <Calculator size={14} className="text-[var(--cyber-cyan)]" />
              <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-[2px]">ภาษีที่ต้องจ่าย</span>
            </div>
            <ScrambleText
              text={formatCurrency(taxResult.totalTax)}
              duration={500}
              className="text-3xl md:text-4xl font-bold font-mono text-[var(--cyber-cyan)]"
            />
            <p className="text-[10px] font-mono text-[var(--cyber-text-secondary)] mt-1">
              อัตราเฉลี่ย: <span className="text-[var(--cyber-cyan)]">{taxResult.effectiveRate.toFixed(1)}%</span>
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex flex-col justify-center gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase">เงินได้สุทธิ</span>
              <span className="text-sm font-mono font-bold text-[var(--color-success)]">
                {formatCurrency(taxResult.taxableIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase">ลดหย่อนรวม</span>
              <span className="text-sm font-mono font-bold text-[var(--cyber-amber)]">
                {formatCurrency(totalDeductions)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase">ภาษี/เดือน</span>
              <span className="text-sm font-mono font-bold text-[var(--cyber-cyan)]">
                {formatCurrency(taxResult.totalTax / 12)}
              </span>
            </div>
          </div>
        </div>
      </CyberCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Tax Brackets ── */}
        <div className="tax-section">
          <SectionHeader title="TAX BRACKETS" subtitle="อัตราภาษีเงินได้บุคคลธรรมดา" accent />
          <CyberCard className="p-5">
            <div className="flex flex-col gap-3">
              {taxResult.bracketBreakdown.map(({ bracket, taxableInBracket, taxAmount }, i) => {
                const maxWidth = bracket.max
                  ? Math.min(((bracket.max - bracket.min) / annualIncome) * 100, 100)
                  : 100;
                const fillWidth = annualIncome > 0
                  ? (taxableInBracket / annualIncome) * 100
                  : 0;
                const isActive = taxableInBracket > 0;

                return (
                  <div key={i} className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-[var(--cyber-cyan)]' : 'text-[var(--cyber-text-muted)]'}`}>
                          {bracket.label}
                        </span>
                        <span className="text-[9px] font-mono text-[var(--cyber-text-muted)]">
                          {formatCurrency(bracket.min)} – {bracket.max ? formatCurrency(bracket.max) : '∞'}
                        </span>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-mono text-[var(--cyber-cyan)]">
                          {formatCurrency(taxAmount)}
                        </span>
                      )}
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden" style={{ width: `${Math.max(maxWidth, 20)}%` }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${fillWidth > 0 ? Math.max((fillWidth / maxWidth) * 100, 4) : 0}%`,
                          background: isActive
                            ? `linear-gradient(90deg, var(--cyber-cyan), ${bracket.rate > 20 ? 'var(--cyber-red)' : 'var(--cyber-green)'})`
                            : 'transparent',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CyberCard>
        </div>

        {/* ── Deductions ── */}
        <div className="tax-section">
          <SectionHeader
            title="TAX DEDUCTIONS"
            subtitle="ค่าลดหย่อน"
            accent
            action={
              <button
                onClick={handleSaveDeductions}
                disabled={saving}
                className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--cyber-cyan)] uppercase tracking-wider hover:text-[var(--cyber-text)] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                บันทึก
              </button>
            }
          />
          <CyberCard className="p-5">
            <div className="flex flex-col gap-3">
              {visibleDeductions.map((ded) => {
                const currentAmount = deductionAmounts[ded.id] ?? 0;
                const pct = ded.maxAmount > 0 ? (currentAmount / ded.maxAmount) * 100 : 0;

                return (
                  <div key={ded.id} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-[var(--cyber-text)] truncate">{ded.nameTH}</span>
                        <div className="relative">
                          <Info size={10} className="text-[var(--cyber-text-muted)] cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 rounded-lg bg-[var(--cyber-surface)] border border-white/[0.08] text-[9px] text-[var(--cyber-text-secondary)] font-mono opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
                            {ded.description}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-[var(--cyber-text-muted)] shrink-0">
                        สูงสุด {formatCurrency(ded.maxAmount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={currentAmount || ''}
                        onChange={(e) => updateDeduction(ded.id, Number(e.target.value))}
                        placeholder="0"
                        className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-[var(--cyber-text)] outline-none focus:border-[var(--cyber-amber)]/40 font-mono transition-all"
                      />
                      <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-[var(--cyber-amber)] transition-all duration-300"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => setShowAllDeductions(!showAllDeductions)}
                className="flex items-center justify-center gap-1 text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-wider hover:text-[var(--cyber-text)] transition-all mt-2 pt-2 border-t border-white/[0.06]"
              >
                {showAllDeductions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showAllDeductions ? 'แสดงน้อยลง' : `แสดงทั้งหมด (${COMMON_DEDUCTIONS.length})`}
              </button>
            </div>
          </CyberCard>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="tax-section">
        <div className="glass-card border border-white/[0.06] rounded-2xl p-4 flex items-start gap-3">
          <Info size={16} className="text-[var(--cyber-text-muted)] shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-mono text-[var(--cyber-text-secondary)] uppercase tracking-wider mb-1">DISCLAIMER</p>
            <p className="text-xs text-[var(--cyber-text-muted)] leading-relaxed">
              การคำนวณนี้เป็นเพียงการประมาณการเบื้องต้น ตามอัตราภาษีเงินได้บุคคลธรรมดาของไทย ไม่ถือเป็นคำแนะนำทางภาษี กรุณาปรึกษาผู้เชี่ยวชาญด้านภาษีสำหรับการวางแผนภาษีที่ถูกต้อง
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
