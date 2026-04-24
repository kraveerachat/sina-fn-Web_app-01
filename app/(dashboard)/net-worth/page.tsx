import ComingSoon from '@/components/ui/ComingSoon';

export default function NetWorthPage() {
  return (
    <ComingSoon
      module="NET WORTH"
      moduleTH="มูลค่าสุทธิ"
      eta="Phase 3"
      features={[
        'คำนวณมูลค่าสุทธิ = สินทรัพย์ − หนี้สิน',
        'Asset & liability tracking across all categories',
        'Historical net worth timeline chart',
        'Financial independence / FIRE number calculator',
      ]}
    />
  );
}
