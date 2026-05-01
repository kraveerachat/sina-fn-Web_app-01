// ═══════════════════════════════════════════════════════════════════
// SINA_FN — Centralized Design Token System
// Elegant Dark Mode — Minimal, Modern, Clean
// Single source of truth for all colors, spacing, and design values.
// ═══════════════════════════════════════════════════════════════════

// ── Color Palette ──────────────────────────────────────────────────
export const colors = {
  // Backgrounds — deep, soft charcoal with subtle blue undertone
  bg:           '#09090B',
  surface:      '#131316',
  surfaceAlt:   '#1A1A1F',

  // Borders — barely visible, elegant separation
  border:       '#23232A',
  borderLight:  '#2C2C35',

  // Primary — Muted Lavender Blue
  primary:      '#8B8CF8',
  primaryDim:   '#6E6FD8',
  primaryLight: 'rgba(139, 140, 248, 0.10)',
  primaryMed:   'rgba(139, 140, 248, 0.18)',

  // Success — Soft Sage (Income / Positive)
  green:        '#34D399',
  greenDim:     '#10B981',
  greenLight:   'rgba(52, 211, 153, 0.10)',
  greenMed:     'rgba(52, 211, 153, 0.18)',

  // Danger — Muted Rose (Expense / Negative)
  red:          '#FB7185',
  redDim:       '#E11D48',
  redLight:     'rgba(251, 113, 133, 0.10)',

  // Warning — Warm Sand
  amber:        '#FBBF24',
  amberLight:   'rgba(251, 191, 36, 0.10)',

  // Info — Soft Sky
  blue:         '#60A5FA',
  blueLight:    'rgba(96, 165, 250, 0.10)',

  // Text — warm off-whites for comfortable reading
  text:         '#EDEDEF',
  textSecondary:'#71717A',
  textMuted:    '#3F3F46',
} as const;

// ── Category Color Map ─────────────────────────────────────────────
// Desaturated, harmonious palette for charts & breakdowns
export const categoryColors: Record<string, string> = {
  'อาหาร':      '#34D399',
  'เครื่องดื่ม': '#60A5FA',
  'เดินทาง':    '#FBBF24',
  'ช้อปปิ้ง':   '#C084FC',
  'บันเทิง':    '#F472B6',
  'สุขภาพ':     '#2DD4BF',
  'การศึกษา':   '#8B8CF8',
  'บิล':        '#FB7185',
  'รายได้':     '#34D399',
  'อื่นๆ':      colors.textSecondary,
};

// ── Category Emoji Map ─────────────────────────────────────────────
export const categoryEmojiMap: Record<string, string> = {
  'อาหาร':      '🍚',
  'เครื่องดื่ม': '☕',
  'เดินทาง':    '🚗',
  'ช้อปปิ้ง':   '🛍️',
  'บันเทิง':    '🎬',
  'สุขภาพ':     '💊',
  'การศึกษา':   '📚',
  'บิล':        '📄',
  'รายได้':     '💰',
  'อื่นๆ':      '📦',
};

// ── Border Radius ──────────────────────────────────────────────────
export const radius = {
  sm:     '8px',
  md:     '12px',
  lg:     '16px',
  xl:     '20px',
  '2xl':  '24px',
  full:   '9999px',
} as const;

// ── Box Shadows — subtle depth on dark backgrounds ─────────────────
export const shadows = {
  sm:     '0 1px 2px rgba(0, 0, 0, 0.20)',
  md:     '0 4px 16px rgba(0, 0, 0, 0.24)',
  lg:     '0 8px 32px rgba(0, 0, 0, 0.28)',
  card:   '0 2px 8px rgba(0, 0, 0, 0.16)',
  float:  '0 16px 48px rgba(0, 0, 0, 0.32)',
  glow:   '0 0 24px rgba(139, 140, 248, 0.08)',
} as const;

// ── Spacing Scale — breathable layout ──────────────────────────────
export const spacing = {
  xs:     '4px',
  sm:     '8px',
  md:     '16px',
  lg:     '24px',
  xl:     '32px',
  '2xl':  '48px',
  '3xl':  '64px',
} as const;

// ── Typography ─────────────────────────────────────────────────────
export const typography = {
  labelTracking: '0.4px',
  labelSize:     '11px',
  bodySize:      '14px',
  headingSize:   '20px',
  displaySize:   '32px',
  monoFont:      'var(--font-geist-mono)',
  sansFont:      'var(--font-geist-sans)',
  lineHeight:    '1.6',
  headingWeight: '600',
} as const;

// ── Animation Durations ────────────────────────────────────────────
export const duration = {
  fast:   120,
  normal: 200,
  slow:   400,
  spring: 600,
} as const;

// ── Consolidated token export ──────────────────────────────────────
export const tokens = {
  colors,
  categoryColors,
  categoryEmojiMap,
  radius,
  shadows,
  spacing,
  typography,
  duration,
} as const;

export type TokenColors = typeof colors;
export type CategoryName = keyof typeof categoryColors;
