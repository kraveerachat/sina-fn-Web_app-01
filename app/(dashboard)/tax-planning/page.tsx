'use client';

// ═══════════════════════════════════════════════════════════════════
// Tax Planning — matches the design prototype (page_tax.jsx):
// result hero (44px blue tax figure + ≈/month + effective rate /
// net taxable), income & deductions card, and the horizontal tax
// bracket strip with the current bracket highlighted. All data
// flows (real annual income, persisted deductions) unchanged.
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Loader2, ChevronDown, ChevronUp, Save, Info } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
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
  { min: 0,         max: 150_000,   rate: 0,  label: '0%' },
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

  for (const bracket of TAX_BRACKETS) {
    const upper = bracket.max ?? Infinity;
    if (taxableIncome <= bracket.min) continue;
    const clamped = bracket.min === 0
      ? Math.min(taxableIncome, upper)
      : Math.max(0, Math.min(taxableIncome, upper) - bracket.min + 1);
    totalTax += clamped * (bracket.rate / 100);
  }

  return {
    taxableIncome,
    totalTax,
    effectiveRate: annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0,
  };
}

const inputCls =
  'w-full rounded-[14px] border border-(--border) bg-(--surface-2) px-3.5 py-2.5 text-sm text-(--text) outline-none transition-[border-color,box-shadow] focus:border-(--blue) focus:shadow-[0_0_0_3px_var(--blue-soft)] placeholder:text-(--text-3)';

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

  const curBracket = useMemo(
    () => TAX_BRACKETS.findIndex(
      (b) => taxResult.taxableIncome >= b.min && taxResult.taxableIncome <= (b.max ?? Infinity)
    ),
    [taxResult.taxableIncome]
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

  // ── Stagger reveal ──
  useGSAP(
    () => {
      if (!pageRef.current || loading) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const sections = gsap.utils.toArray<HTMLElement>('.tax-section', pageRef.current);
      if (sections.length === 0) return;
      gsap.fromTo(sections,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.1, delay: 0.05 }
      );
    },
    { scope: pageRef, dependencies: [loading] }
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="cyber-skeleton h-16 w-1/3 rounded-2xl" />
        <div className="bento">
          <div className="cyber-skeleton cell-5 h-52 rounded-3xl" />
          <div className="cyber-skeleton cell-7 h-52 rounded-3xl" />
          <div className="cyber-skeleton cell-12 h-32 rounded-3xl" />
        </div>
      </div>
    );
  }

  const visibleDeductions = showAllDeductions ? COMMON_DEDUCTIONS : COMMON_DEDUCTIONS.slice(0, 6);

  return (
    <div ref={pageRef} className="flex flex-col gap-4">
      {/* ── Page head ── */}
      <div className="mb-1 mt-1.5">
        <h1 className="text-[25px] font-semibold leading-[1.1] tracking-[-0.025em] text-(--text) lg:text-[30px]">
          วางแผนภาษี
        </h1>
        <p className="mt-1 text-[14.5px] text-(--text-2)">
          ประมาณภาษีเงินได้บุคคลธรรมดา · ไม่ใช่คำแนะนำทางภาษี
        </p>
      </div>

      <div className="bento">
        {/* ── Result hero ── */}
        <div className="tax-section cell-5">
          <div className="flex h-full flex-col justify-center rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
            <p className="eyebrow">ภาษีที่ต้องจ่าย</p>
            <p className="tnum mb-1 mt-2 text-[38px] font-bold leading-[1.05] tracking-[-0.03em] text-(--blue) lg:text-[44px]">
              {formatCurrency(taxResult.totalTax)}
            </p>
            <p className="tnum text-[13.5px] text-(--text-3)">
              ≈ {formatCurrency(taxResult.totalTax / 12)} ต่อเดือน
            </p>
            <div className="my-3.5 h-px bg-(--border-2)" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-(--text-3)">อัตราเฉลี่ย</p>
                <p className="tnum mt-0.5 text-xl font-bold text-(--text)">
                  {taxResult.effectiveRate.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-(--text-3)">เงินได้สุทธิ</p>
                <p className="tnum mt-0.5 text-xl font-bold text-(--text)">
                  {formatCurrency(taxResult.taxableIncome)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Income card ── */}
        <div className="tax-section cell-7">
          <div className="h-full rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
            <p className="mb-3.5 text-sm font-semibold tracking-[-0.01em] text-(--text)">
              รายได้ &amp; ค่าลดหย่อน
            </p>

            <label className="mb-1.5 block text-[12.5px] font-medium text-(--text-2)">
              เงินได้พึงประเมิน (รายปี)
            </label>
            <div className="relative">
              <span className="tnum absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-(--text-3)">฿</span>
              <input
                type="number"
                value={incomeOverride ?? fetchedIncome}
                onChange={(e) => setIncomeOverride(Math.max(0, Number(e.target.value)))}
                className={`${inputCls} tnum pl-8 text-base font-semibold`}
              />
            </div>
            <p className="mt-1.5 text-xs text-(--text-3)">
              {fetchedIncome > 0 && incomeOverride === null
                ? `จากรายรับจริงปี ${currentYear}`
                : `≈ ${formatCurrency(annualIncome / 12)} ต่อเดือน`}
              {incomeOverride !== null && fetchedIncome > 0 && (
                <button
                  onClick={() => setIncomeOverride(null)}
                  className="ml-2 font-medium text-(--blue) hover:opacity-70"
                >
                  ใช้ยอดจริง ({formatCurrency(fetchedIncome)})
                </button>
              )}
            </p>

            <div className="inset mt-4 flex items-center justify-between px-[15px] py-3 text-[13px]">
              <span className="text-(--text-3)">ลดหย่อนรวม</span>
              <span className="tnum font-semibold text-(--gold)">−{formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* ── Bracket strip ── */}
        <div className="tax-section cell-12">
          <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
            <p className="mb-4 text-sm font-semibold tracking-[-0.01em] text-(--text)">ขั้นบันไดภาษี</p>
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-8">
              {TAX_BRACKETS.map((b, i) => {
                const active = i <= curBracket;
                const isCur = i === curBracket;
                return (
                  <div key={i} className="text-center">
                    <div
                      className="flex h-16 items-end justify-center rounded-xl p-1.5 transition-all duration-300"
                      style={{
                        background: active
                          ? `color-mix(in srgb, var(--blue) ${isCur ? '100%' : '22%'}, transparent)`
                          : 'var(--surface-2)',
                        border: isCur ? '1px solid var(--blue)' : '1px solid var(--border-2)',
                      }}
                    >
                      <span
                        className="tnum text-[13px] font-bold"
                        style={{ color: isCur ? '#fff' : active ? 'var(--blue)' : 'var(--text-3)' }}
                      >
                        {b.label}
                      </span>
                    </div>
                    <p className="tnum mt-1.5 text-[10px] text-(--text-3)">
                      {b.max ? `${b.max / 1000}k` : '∞'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Deductions ── */}
        <div className="tax-section cell-12">
          <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold tracking-[-0.01em] text-(--text)">
                ค่าลดหย่อน <span className="font-medium text-(--text-3)">(SSF/RMF/ประกัน ฯลฯ)</span>
              </p>
              <button
                onClick={handleSaveDeductions}
                disabled={saving}
                className="pill pill-soft pill-sm press tap"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save />} บันทึก
              </button>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              {visibleDeductions.map((ded) => {
                const currentAmount = deductionAmounts[ded.id] ?? 0;
                const pct = ded.maxAmount > 0 ? (currentAmount / ded.maxAmount) * 100 : 0;
                return (
                  <div key={ded.id} title={ded.description}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="truncate text-[13px] font-medium text-(--text)">{ded.nameTH}</span>
                      <span className="tnum shrink-0 text-[11px] text-(--text-3)">
                        สูงสุด {formatCurrency(ded.maxAmount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={currentAmount || ''}
                        onChange={(e) => updateDeduction(ded.id, Number(e.target.value))}
                        placeholder="0"
                        className={`${inputCls} tnum flex-1`}
                      />
                      <div className="track w-24 shrink-0">
                        <i style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowAllDeductions(!showAllDeductions)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 border-t border-(--border-2) pt-3.5 text-[12.5px] font-medium text-(--text-2) transition-colors hover:text-(--text)"
            >
              {showAllDeductions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showAllDeductions ? 'แสดงน้อยลง' : `แสดงทั้งหมด (${COMMON_DEDUCTIONS.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="tax-section flex items-start gap-2.5 px-1 text-(--text-3)">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed">
          การคำนวณนี้เป็นการประมาณการเบื้องต้นตามอัตราภาษีเงินได้บุคคลธรรมดาของไทย
          ไม่ถือเป็นคำแนะนำทางภาษี กรุณาปรึกษาผู้เชี่ยวชาญสำหรับการวางแผนภาษีที่ถูกต้อง
        </p>
      </div>
    </div>
  );
}
