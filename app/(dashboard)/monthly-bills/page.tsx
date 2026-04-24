import ComingSoon from '@/components/ui/ComingSoon';

export default function MonthlyBillsPage() {
  return (
    <ComingSoon
      module="MONTHLY BILLS"
      moduleTH="บิลรายเดือน"
      eta="Phase 3"
      features={[
        'ติดตามบิลที่ต้องจ่ายรายเดือนโดยอัตโนมัติ',
        'Recurring payment tracking (subscriptions, utilities)',
        'Due-date reminders via push notification',
        'Auto-categorize & record when bills are paid',
      ]}
    />
  );
}
