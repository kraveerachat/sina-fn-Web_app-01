// ═══════════════════════════════════════════════════════════════════
// Thai Bank Constants & Wallet Visuals Utility
// No DB schema changes needed — matching by wallet name keywords.
// ═══════════════════════════════════════════════════════════════════

import {
  Landmark, Banknote, CreditCard, Smartphone, Wallet,
  type LucideIcon,
} from 'lucide-react';

// ── Thai bank definitions ──────────────────────────────────────────
export interface BankDef {
  /** Short display name shown in dropdown */
  label: string;
  /** Canonical name set as wallet name when selected */
  name: string;
  /** Brand HEX color (used for accent strip, tint, dot) */
  color: string;
  /** Path to logo image in /public/banks/ — served via Next.js Image */
  logoPath: string;
  /** Keywords to match against wallet.name (lower-cased) */
  keywords: string[];
}

export const THAI_BANKS: BankDef[] = [
  { label: 'KBank (กสิกรไทย)',     name: 'KBank',    color: '#00A950', logoPath: '/banks/kbank.png',    keywords: ['kbank', 'กสิกร', 'kasikorn'] },
  { label: 'SCB (ไทยพาณิชย์)',     name: 'SCB',      color: '#4E2A81', logoPath: '/banks/scb.png',      keywords: ['scb', 'ไทยพาณิชย์', 'siam commercial'] },
  { label: 'BBL (กรุงเทพ)',        name: 'BBL',      color: '#1E4598', logoPath: '/banks/bbl.png',      keywords: ['bbl', 'กรุงเทพ', 'bangkok bank'] },
  { label: 'KTB (กรุงไทย)',        name: 'KTB',      color: '#00AEEF', logoPath: '/banks/ktb.png',      keywords: ['ktb', 'krungthai', 'กรุงไทย'] },
  { label: 'Krungsri (กรุงศรี)',   name: 'Krungsri', color: '#FEC400', logoPath: '/banks/krungsri.png', keywords: ['krungsri', 'กรุงศรี', 'bay', 'ayudhya'] },
  { label: 'TMBThanachart (TTB)', name: 'TTB',      color: '#0050F0', logoPath: '/banks/ttb.png',      keywords: ['ttb', 'tmb', 'thanachart', 'ทีทีบี', 'ธนชาต'] },
  { label: 'BAAC (ธกส.)',         name: 'BAAC',     color: '#006F3C', logoPath: '/banks/baac.png',     keywords: ['baac', 'ธกส', 'ธ.ก.ส'] },
  { label: 'GSB (ออมสิน)',        name: 'GSB',      color: '#EA0029', logoPath: '/banks/gsb.png',      keywords: ['gsb', 'ออมสิน'] },
  { label: 'UOB',                 name: 'UOB',      color: '#002B7F', logoPath: '/banks/uob.png',      keywords: ['uob'] },
  { label: 'CIMB',                name: 'CIMB',     color: '#BB2027', logoPath: '/banks/cimb.png',     keywords: ['cimb'] },
];

// ── E-Wallet definitions ──────────────────────────────────────────
export interface EWalletDef {
  id: string;
  label: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  keywords: string[];
  type: 'ewallet';
}

export const E_WALLETS: EWalletDef[] = [
  {
    id: 'truemoney',
    label: 'TrueMoney Wallet',
    name: 'TrueMoney Wallet',
    shortName: 'TrueMoney',
    color: '#FF7A00', // TrueMoney Orange
    icon: 'Wallet',
    keywords: ['truemoney', 'true money', 'ทรูมูฟ', 'ทรูมันนี่', 'true wallet', 'truemoney wallet'],
    type: 'ewallet'
  },
  {
    id: 'shopeepay',
    label: 'ShopeePay',
    name: 'ShopeePay',
    shortName: 'ShopeePay',
    color: '#EE4D2D', // ShopeePay Orange/Red
    icon: 'SmartphoneNfc',
    keywords: ['shopeepay', 'shopee pay', 'ช้อปปี้เพย์', 'airpay'],
    type: 'ewallet'
  },
  {
    id: 'rabbitlinepay',
    label: 'Rabbit LINE Pay',
    name: 'Rabbit LINE Pay',
    shortName: 'LINE Pay',
    color: '#00C300', // LINE Green
    icon: 'Smartphone',
    keywords: ['rabbit line pay', 'line pay', 'แรบบิท ไลน์ เพย์', 'linepay'],
    type: 'ewallet'
  }
];

// ── Wallet visual result ───────────────────────────────────────────
export interface WalletVisuals {
  /** Lucide icon — used as fallback for non-bank wallets */
  icon:      LucideIcon;
  /** Brand or type HEX color */
  color:     string;
  /** Path to bank logo image, undefined for non-bank wallets */
  logoPath?: string;
  /** Human-readable bank label, e.g. "KBank (กสิกรไทย)" */
  bankLabel?: string;
}

// ── Generic type fallbacks (non-bank wallets) ──────────────────────
const TYPE_DEFAULTS: Record<string, WalletVisuals> = {
  bank:    { icon: Landmark,   color: '#60A5FA' },
  cash:    { icon: Banknote,   color: '#34D399' },
  credit:  { icon: CreditCard, color: '#FBBF24' },
  ewallet: { icon: Smartphone, color: '#FF7A00' },
  savings: { icon: Landmark,   color: '#2DD4BF' },
};

/**
 * Returns visual metadata for any wallet.
 *
 * - Bank wallets: keyword-matches wallet.name → returns brand color + logoPath.
 * - E-Wallets: keyword-matches wallet.name → returns brand color (e.g. TrueMoney #FF7A00, ShopeePay #EE4D2D).
 * - Other types: returns a generic colored Lucide icon (no logoPath).
 */
export function getWalletVisuals(
  walletName: string,
  walletType: string
): WalletVisuals {
  const lower = walletName.toLowerCase();

  if (walletType === 'bank') {
    const match = THAI_BANKS.find((b) =>
      b.keywords.some((kw) => lower.includes(kw))
    );
    if (match) {
      return {
        icon:      Landmark,
        color:     match.color,
        logoPath:  match.logoPath,
        bankLabel: match.label,
      };
    }
  }

  // Check E-Wallets by keywords or name match
  const eMatch = E_WALLETS.find((w) =>
    w.keywords.some((kw) => lower.includes(kw))
  );
  if (eMatch) {
    return {
      icon:      Smartphone,
      color:     eMatch.color,
      bankLabel: eMatch.label,
    };
  }

  return TYPE_DEFAULTS[walletType] ?? { icon: Wallet, color: '#9CA3AF' };
}
