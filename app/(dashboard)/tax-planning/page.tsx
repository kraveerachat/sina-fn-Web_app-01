import ComingSoon from '@/components/ui/ComingSoon';

export default function TaxPlanningPage() {
  return (
    <ComingSoon
      module="TAX PLANNING"
      moduleTH="วางแผนภาษี"
      eta="Phase 3"
      features={[
        'คำนวณภาษีเงินได้บุคคลธรรมดา (พรบ.ภาษีไทย)',
        'Deduction optimizer — SSF, RMF, LTF, donations',
        'Year-end tax projection & withholding tracker',
        'e-Filing document checklist & deadline alerts',
      ]}
    />
  );
}
