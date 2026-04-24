// ═══════════════════════════════════════════════════
// SINA_FN — Utility Functions
// ═══════════════════════════════════════════════════

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number as Thai Baht currency string */
export function formatCurrency(amount: number, showSign = false): string {
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = showSign ? (amount >= 0 ? '+' : '-') : (amount < 0 ? '-' : '');
  return `${sign}฿${formatted}`;
}

/** Format date in Thai style — "2 เม.ย. 2569" */
export function formatDateThai(dateStr: string): string {
  const date = new Date(dateStr);
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // Buddhist Era
  return `${day} ${month} ${year}`;
}

/** Format time — "12:30" */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Get current month name in English for HUD display */
export function getCurrentMonthLabel(): string {
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

/** Get greeting based on time of day (Thai) */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'สวัสดีตอนดึก';
  if (hour < 12) return 'สวัสดีตอนเช้า';
  if (hour < 17) return 'สวัสดีตอนบ่าย';
  return 'สวัสดีตอนเย็น';
}

/** Generate a short unique ID */
export function shortId(): string {
  return Math.random().toString(36).substring(2, 10);
}
