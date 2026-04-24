// ═══════════════════════════════════════════════════
// SINA_FN — Design System Tokens
// ═══════════════════════════════════════════════════

export const colors = {
  // Backgrounds
  background: '#1A1D21',
  cardSurface: '#1F2328',
  cardAlt: '#252A30',
  border: '#2A2F38',

  // Primary — Neon Green (income / positive / CTA)
  neonGreen: '#39FF14',
  neonGreenDim: '#1A7A08',
  neonGreenGlow: '#39FF1430',
  neonGreenSubtle: '#39FF1408',
  neonGreenBorder: '#39FF1420',

  // Danger — Vibrant Red (expense / alert / negative)
  vibrantRed: '#FF3B3B',
  redDim: '#7A1A1A',

  // Text
  textPrimary: '#E8EAF0',
  textSecondary: '#6B7280',
  textMuted: '#374151',

  // Special
  glowBorder: '#39FF1430',
} as const;

export const fonts = {
  mono: 'var(--font-geist-mono)',
  sans: 'var(--font-geist-sans)',
} as const;

export const spacing = {
  sidebarWidth: '260px',
  topBarHeight: '64px',
  contentMaxWidth: '1200px',
  cardRadius: '12px',
  buttonRadius: '6px',
} as const;

// Category colors for charts
export const categoryColors: Record<string, string> = {
  'อาหาร': '#39FF14',
  'เครื่องดื่ม': '#00E5FF',
  'เดินทาง': '#FF9100',
  'ช้อปปิ้ง': '#E040FB',
  'บันเทิง': '#FFEA00',
  'สุขภาพ': '#00E676',
  'การศึกษา': '#448AFF',
  'บิล': '#FF5252',
  'รายได้': '#39FF14',
  'อื่นๆ': '#6B7280',
} as const;

// Wallet type icons
export const walletIcons: Record<string, string> = {
  bank: '🏦',
  ewallet: '📱',
  cash: '💵',
  credit: '💳',
} as const;
