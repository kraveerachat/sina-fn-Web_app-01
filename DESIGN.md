# Sina_FN Design System

Apple-clean, bento, light/dark. Source of truth: `app/globals.css` tokens. Derived from the approved Claude Design handoff bundle (Sina_FN-Automation).

## Theme

Dual theme via `data-theme` on `<html>`. Light is default; dark is pure-black premium. Both fully tuned — never ship a value that only works in one.

### Color tokens (light / dark)

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#ececed` | `#000000` | Body, with radial `--bg-grad` wash |
| `--surface` | `#ffffff` | `#141417` | Cards |
| `--surface-2` | `#f5f5f7` | `#1c1c20` | Insets, chips, inputs |
| `--surface-3` | `#ececef` | `#26262b` | Tracks, deepest inset |
| `--text` | `#1d1d1f` | `#f5f5f7` | Primary ink |
| `--text-2` | `#6e6e73` | `#a1a1a8` | Secondary |
| `--text-3` | `#a1a1a6` | `#6c6c74` | Tertiary/faint |
| `--border` | `#e6e6ea` | `#28282e` | Card hairline |
| `--blue` | `#1f4287` | `#4f86d6` | Primary actions, active states |
| `--green` | `#1f8a5b` | `#34b277` | Income, success, positive trend |
| `--gold` | `#b7892f` | `#d2a951` | Premium, AI, highlights |
| `--red` | `#cf5b54` | `#e2766d` | Destructive, alerts |
| `--expense` | `#8a6d57` | `#c39d82` | Outflow amounts (restrained, not red) |

Soft tints exist per accent (`--blue-soft`, `--green-soft`, `--gold-soft`, `--red-soft`) for badge/icon backgrounds. Legacy `--cyber-*` aliases map onto these tokens; do not use them in new code.

## Typography

- Stack: system SF-style (`-apple-system, "SF Pro Display", "Segoe UI", system-ui, "Noto Sans Thai", "Sarabun"`); Geist Sans as loaded webfont layer on top.
- Numbers/balances: `.tnum` (`font-variant-numeric: tabular-nums`) + Geist Mono for hero figures.
- Headings: tight letter-spacing (−0.02 to −0.035em), weights 600–740. Page h1 ≈30px.
- No uppercase-tracked labels except small eyebrows used sparingly.

## Shape

- Cards: `--r-card: 24px` (`rounded-3xl`-ish), tiles 20px, hairline 1px border + two-layer soft shadow.
- Buttons: full pill (`999px`).
- Inputs: 14px radius.
- Never sharp corners, never thick accent borders.

## Motion

- Press/squish: `.press` scales to 0.96–0.967, 140ms `cubic-bezier(.2,.7,.2,1)` — on every interactive card, pill, dock item.
- Reveal: staggered fade-up on page entry (GSAP), base state visible (never gate visibility on animation).
- Hero: slow 7s sheen sweep; `.floaty` 4s gentle bob for the dock only.
- Charts draw on; balance counts up.
- All wrapped in `@media (prefers-reduced-motion: reduce)`.

## Components

- **Card** (`CyberCard`): white/charcoal surface, hairline border, `--shadow`, 20px padding.
- **Pill button** (`CyberButton`): primary = blue fill, gold = premium, ghost/outline = hairline.
- **Floating dock**: bottom-center glass capsule (blur 24px), AI button blue gradient, Quick Add gold.
- **Top bar**: sticky, translucent bg blur 20px, hairline bottom border, theme toggle.
- **Bento grid**: `.bento` with `.cell-N` span classes — never `col-N`, which collides with Tailwind v4's own `col-*` (grid-column line number) utility and loses the cascade. Mobile-first: 1 column <768px (gap 14px) → 2 columns on tablet (cell-8/9/12 span both, gap 16px) → full 12-col ≥1024px.
- **Rows** (transactions/wallets/goals): icon tile + title/sub + right-aligned tnum amount, hairline dividers.

## Mobile App UI/UX Guidelines (sina-fn-mobile)

The mobile client is designed as a focused, utility-first application that aligns with the Apple-clean visual style of the web application.

### 1. Permission Onboarding Screen
*   **Visual Guide**: Rendered as a multi-step setup flow. Uses high-contrast illustrations and interactive walkthroughs showing the Android Settings screen.
*   **CTA Focus**: Features a single, prominent primary pill button (`CyberButton` style) that deep-links directly to Android's Notification Access settings.
*   **Feedback**: Provides clear status indicators (Green for active, Red/Grey for missing) to ensure the user knows whether permission is active.

### 2. Pending Inbox View
*   **Inbox Layout**: Renders a dedicated list (Inbox) of cards with `status: 'pending_scan'`.
*   **Typography**: Uses high-contrast tabular numbers (`.tnum`) for transaction amounts.
*   **UX Actions**: Swipe-to-scan gesture or clicking on the card opens the Camera HUD directly to begin targeted verification.

### 3. Camera Scanning HUD Interface
*   **HUD Overlay**: Full-screen dark viewfinder overlay with a clear, rounded-corner guide boundary box in the center.
*   **Targeting Indicators**: Glow-effects on the guide border indicating focus status.
*   **Action buttons**: Transparent glassmorphism action bar at the bottom containing controls for Camera Flash (toggle), Capture, and Close.

### 4. Bento Dashboard WebView Integration
*   **Layout**: Displays the web module's dashboard (`sina-fn-web` responsive view) embedded inside a native React Native WebView component.
*   **Feel**: Uses custom CSS overrides injected into the webview to hide standard web navigation headers/sidebars, making the web dashboard look and feel like a native mobile panel.
