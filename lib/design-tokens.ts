// ═══════════════════════════════════════════════════════════════════
// SINA_FN — Centralized Design Token System
// Single source of truth for all colors, spacing, and design values.
// Use in JS/TSX contexts (charts, dynamic styles, inline styles).
// For Tailwind classes, use the --cyber-* CSS vars or token classes.
// ═══════════════════════════════════════════════════════════════════

// ── Color Palette ──────────────────────────────────────────────────
export const colors = {
  // Backgrounds
  bg:           '#1A1D21',
  surface:      '#1F2328',
  surfaceAlt:   '#252A30',

  // Borders
  border:       '#2A2F38',

  // Primary Accent — Neon Green
  green:        '#39FF14',
  greenDim:     '#1A7A08',
  greenGlow:    'rgba(57, 255, 20, 0.15)',
  greenGlowSm:  'rgba(57, 255, 20, 0.25)',

  // Danger — Vibrant Red
  red:          '#FF3B3B',
  redDim:       '#7A1A1A',
  redGlow:      'rgba(255, 59, 59, 0.15)',

  // Warning — Amber
  amber:        '#FF9100',
  amberGlow:    'rgba(255, 145, 0, 0.15)',

  // Info — Cyan
  cyan:         '#00E5FF',
  cyanGlow:     'rgba(0, 229, 255, 0.15)',

  // Text
  text:         '#E8EAF0',
  textSecondary:'#6B7280',
  textMuted:    '#374151',
} as const;

// ── Category Color Map ─────────────────────────────────────────────
// Used in charts, spending breakdowns, budget envelopes
export const categoryColors: Record<string, string> = {
  'อาหาร':      colors.green,
  'เครื่องดื่ม': colors.cyan,
  'เดินทาง':    colors.amber,
  'ช้อปปิ้ง':   '#E040FB',
  'บันเทิง':    '#FFEA00',
  'สุขภาพ':     '#00E676',
  'การศึกษา':   '#448AFF',
  'บิล':        colors.red,
  'รายได้':     colors.green,
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
// Brutalist / Cyberpunk standard: strict 90-degree corners
export const radius = {
  none:   '0px',   // Standard — 90° corners everywhere
  avatar: '9999px', // EXCEPTION: profile avatars only
} as const;

// ── Box Shadows (Glow Effects) ─────────────────────────────────────
export const shadows = {
  glowGreen:    `0 0 20px ${colors.greenGlow}`,
  glowGreenLg:  `0 0 40px ${colors.greenGlow}, 0 0 60px rgba(57,255,20,0.08)`,
  glowRed:      `0 0 20px ${colors.redGlow}`,
  glowAmber:    `0 0 20px ${colors.amberGlow}`,
  glowCyan:     `0 0 20px ${colors.cyanGlow}`,
} as const;

// ── Typography ─────────────────────────────────────────────────────
export const typography = {
  labelTracking: '3px',
  labelSize:     '10px',
  monoFont:      'var(--font-geist-mono)',
} as const;

// ── Animation Durations ────────────────────────────────────────────
export const duration = {
  fast:   150,
  normal: 250,
  slow:   500,
} as const;

// ── Consolidated token export ──────────────────────────────────────
export const tokens = {
  colors,
  categoryColors,
  categoryEmojiMap,
  radius,
  shadows,
  typography,
  duration,
} as const;

export type TokenColors = typeof colors;
export type CategoryName = keyof typeof categoryColors;
