import ComingSoon from '@/components/ui/ComingSoon';

export default function BudgetsPage() {
  return (
    <ComingSoon
      module="BUDGETS"
      moduleTH="งบประมาณ"
      eta="Phase 3"
      features={[
        'ระบบกำหนดงบประมาณรายหมวดหมู่',
        'Budget envelope method with rollover support',
        'Real-time spending alerts when approaching limit',
        'Month-over-month comparison & trend tracking',
      ]}
    />
  );
}
