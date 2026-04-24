import ComingSoon from '@/components/ui/ComingSoon';

export default function DebtTimelinePage() {
  return (
    <ComingSoon
      module="DEBT TIMELINE"
      moduleTH="แผนชำระหนี้"
      eta="Phase 3"
      features={[
        'Debt snowball & avalanche payoff strategies',
        'แสดงเส้นทางชำระหนี้แบบ timeline',
        'Interest savings calculator per strategy',
        'Integration with monthly bills & recurring payments',
      ]}
    />
  );
}
