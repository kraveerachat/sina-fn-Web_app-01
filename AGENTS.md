<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Sina_FN Codebase Guidelines for AI Agents

> **This document is the single source of truth for all AI agents working on this codebase.**
> Every statement reflects the CURRENT implementation as of 2026-05-15.
> Do NOT deviate from the patterns described here without explicit human approval.

---

## 1. Project Overview & Design System

### Product & Hybrid Architecture

**Sina_FN** is an Enterprise Hybrid Ingestion System for personal finance, splitting into two distinct modules:
1. **`sina-fn-web`** (Next.js 16): The central command hub, API gateway, admin dashboard, and WebGL financial health score monitor.
2. **`sina-fn-mobile`** (React Native CLI): The edge node, capturing background notifications from banking applications on Android and performing receipt slip camera scans.

It features auto-ingestion of bank alerts, targeted AI OCR reconciliation, budgeting, savings goals, debt tracking, and bills.

### Design System — "Utopia Tokyo"

The visual identity is **Elegant Dark Mode with Muted Neon Accents** — deep charcoal surfaces, lavender-blue primary, soft glassmorphism, and cinematic 3D page transitions.

| Principle                    | Implementation                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dark mode only**           | `--cyber-bg: #09090B`, `--cyber-surface: #131316`, `--cyber-surface-alt: #1A1A1F`                                                              |
| **Glassmorphism**            | `.glass` (blur 40px), `.glass-surface` (blur 32px), `.glass-card` (blur 24px) — defined in `globals.css`                                       |
| **Neon accents**             | Primary: `--cyber-green: #8B8CF8` (lavender-blue), Success: `#34D399`, Danger: `#FB7185`, Warning: `#FBBF24`, Info: `#60A5FA`                  |
| **3D cinematic transitions** | `PageTransition.tsx` uses Framer Motion with `perspective: 1200px`, `translateZ`, `rotateX`, `scale`, and `filter: blur()`                     |
| **Holographic tilt**         | `useHolographicTilt()` hook — mouse-driven 3D perspective tilt + radial gradient sheen + glow border                                           |
| **HUD aesthetics**           | 90-degree brutalist corners on buttons/inputs (`CyberButton`, `CyberInput`), uppercase mono labels, scan-line overlays, corner accent brackets |

### Core CSS Variables (`:root` in `globals.css`)

```
--cyber-bg:           #09090B      (page background)
--cyber-surface:      #131316      (card background)
--cyber-surface-alt:  #1A1A1F      (elevated card / alt surface)
--cyber-border:       #23232A      (subtle borders)
--cyber-green:        #8B8CF8      (primary accent — lavender-blue)
--cyber-green-dim:    #6E6FD8      (dimmed primary)
--cyber-red:          #FB7185      (danger / expense)
--cyber-amber:        #FBBF24      (warning)
--cyber-cyan:         #60A5FA      (info / sky blue)
--cyber-text:         #EDEDEF      (primary text)
--cyber-text-secondary: #71717A    (secondary text)
--cyber-text-muted:   #3F3F46      (muted / disabled text)
--cyber-radius:       12px         (default border radius)
```

### CSS Utility Classes (globals.css)

| Class                                       | Purpose                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| `.cyber-surface`                            | Standard card: `bg: --cyber-surface`, 1px border, 12px radius, subtle shadow |
| `.cyber-surface-alt`                        | Elevated card variant                                                        |
| `.cyber-label` / `.cyber-label-green`       | 11px uppercase tracking labels                                               |
| `.cyber-skeleton`                           | Shimmer loading skeleton                                                     |
| `.glass`, `.glass-surface`, `.glass-card`   | Glassmorphism with varying blur (40/32/24px)                                 |
| `.holo-sheen`                               | Hover-activated holographic sheen overlay                                    |
| `.holo-card-perspective` / `.holo-card`     | 3D card with `perspective: 600px` + `preserve-3d`                            |
| `.ai-sparkle`                               | Animated gradient border for AI-generated content                            |
| `.liquid-neon-cyan` / `.liquid-neon-gold`   | Animated gradient progress bars                                              |
| `.milestone-glow`                           | Pulsing gold glow for completed goals                                        |
| `.dashboard-dof` / `.dashboard-dof--active` | Depth-of-field blur when AI chat is open                                     |

### Tailwind v4 Theme Tokens (`@theme inline` in `globals.css`)

All CSS custom properties are exposed as Tailwind utilities via `@theme inline`. Use `bg-cyber-surface`, `text-cyber-green`, `border-cyber-border`, etc. in JSX.

### Design Token Files

| File                   | Purpose                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `globals.css`          | CSS variables (source of truth), utility classes, animations                                                                      |
| `lib/design-tokens.ts` | TypeScript token system: `colors`, `categoryColors`, `categoryEmojiMap`, `radius`, `shadows`, `spacing`, `typography`, `duration` |
| `constants/theme.ts`   | **Legacy** — older token file with neon-green `#39FF14` palette. Do NOT use for new code. Use `lib/design-tokens.ts` instead.     |

---

## 2. Tech Stack & Libraries

### Core Framework

| Technology       | Version | Usage                                                              |
| ---------------- | ------- | ------------------------------------------------------------------ |
| **Next.js**      | 16.2.2  | App Router (`app/` directory), API routes (`app/api/`), SSR layout |
| **React**        | 19.2.4  | UI components, hooks, portals                                      |
| **TypeScript**   | ^5      | Strict typing, all files are `.ts`/`.tsx`                          |
| **Tailwind CSS** | v4      | `@import "tailwindcss"` + `@theme inline` for custom tokens        |

### Animation

| Library                                     | Usage                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **GSAP** `^3.15.0` + `@gsap/react` `^2.1.2` | ScrollTrigger stagger reveals, smooth reset animations, tilt effects                       |
| **Framer Motion** `^12.38.0`                | Page transitions (`AnimatePresence`), modal enter/exit, micro-interactions, spring physics |

### Backend & Auth

| Library                                                  | Usage                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) | Auth (email/password), PostgreSQL database, Storage (goal images, avatars), Row-level queries |
| **AI SDK** (`ai`, `@ai-sdk/google`, `@ai-sdk/groq`)      | AI intent routing and parsing (currently using Gemini `gemini-2.5-flash`)                     |
| **Zod** `^4.3.6`                                         | Runtime validation of AI responses                                                            |

### 3D / Visual

| Library                                                   | Usage                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Three.js** + `@react-three/fiber` + `@react-three/drei` | WebGL pulse background (`PulseCanvas.tsx`), MoneySwarm particle effects on PIN verify |

### State Management

| Library                         | Usage                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Zustand** `^5.0.12`           | Minimal client-side store (`store/appStore.ts`) — user profile + `clearState`. Persisted to `localStorage` as `sina-fn-storage` |
| **Custom hooks** (`hooks/*.ts`) | All server data is fetched/cached in dedicated hooks, NOT in Zustand                                                            |

### Utilities

| Library                   | Usage                          |
| ------------------------- | ------------------------------ |
| `lucide-react`            | Icon system                    |
| `clsx` + `tailwind-merge` | Conditional class merging      |
| `react-easy-crop`         | Image cropping for goal images |

---

## 3. Directory Structure & Routing

### Top-Level Structure (Multi-Module)

The codebase consists of two primary modules:

#### 1. Web Module (`sina-fn-web`)
The Next.js web application (located in the root/web workspace):
```
sina-fn-web/
├── app/
│   ├── (auth)/              # Auth routes (no sidebar/topbar)
│   ├── (dashboard)/         # Main app (sidebar + topbar + page transitions)
│   ├── onboarding/          # Post-registration onboarding flow
│   ├── api/ai/parse/        # AI intent classification API
│   ├── api/ai/scan-receipt/ # NEW: AI OCR receipt processing API
│   ├── layout.tsx           # Root layout (fonts, metadata)
│   └── globals.css          # Design system CSS
├── components/
│   ├── ai/                  # AI chat components
│   ├── dashboard/           # Dashboard-specific components
│   ├── debts/               # Debt animation components
│   ├── goals/               # Goal grid and modal
│   ├── layout/              # AppLockGuard, PageTransition, Sidebar, TopBar
│   ├── settings/            # Settings modals
│   ├── ui/                  # Reusable UI primitives (CyberButton, CyberCard, etc.)
│   └── pulse/               # WebGL pulse canvas
├── hooks/                   # Custom React hooks (data fetching, UI state)
├── lib/
│   ├── supabase/            # Supabase client + queries (data access layer)
│   ├── design-tokens.ts     # TypeScript design tokens
│   ├── events.ts            # Global event bus (app_mutate)
│   ├── banks.ts             # Thai bank metadata
│   ├── cropUtils.ts         # Image crop helpers
│   └── utils.ts             # General utilities
├── store/                   # Zustand store
├── types/                   # TypeScript interfaces
└── constants/               # Legacy theme constants
```

#### 2. Mobile Module (`sina-fn-mobile`)
The React Native CLI application (located in the mobile workspace):
```
sina-fn-mobile/
├── android/                 # Native Android project files
├── ios/                     # Native iOS project files
├── src/
│   ├── components/          # Camera HUD, WebView wrapper, UI Primitives
│   ├── screens/             # Onboarding, Pending Inbox, Scanner, Settings
│   ├── services/            # Notification Listener service, Supabase client
│   └── store/               # Zustand local state
├── index.js                 # App entry point
└── package.json             # Mobile dependencies
```

### Route Map

#### Auth Routes — `app/(auth)/`

No sidebar, no topbar. Centered layout on dark background.

| Route         | File                  | Purpose                                                                                                                |
| ------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/login`      | `login/page.tsx`      | Email + password login. On success → redirects to `/` (proxy gates to `/pin-verify` or `/onboarding/pin-setup`)        |
| `/register`   | `register/page.tsx`   | Sign up (name, nickname, email, password). Creates profile + default cash wallet. On success → `/onboarding/pin-setup` |
| `/pin-verify` | `pin-verify/page.tsx` | Full-screen PIN entry with boot sequence, MoneySwarm particles, 6-digit numpad. Sets `pin_verified` cookie → dashboard |

#### Onboarding Routes — `app/onboarding/`

| Route                   | File                 | Purpose                                                                                                        |
| ----------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/onboarding/welcome`   | `welcome/page.tsx`   | **Public** — welcome slides for new users. CTA → `/register`                                                   |
| `/onboarding/setup`     | `setup/page.tsx`     | Optional post-setup wizard: categories → persona → wallets + income                                            |
| `/onboarding/pin-setup` | `pin-setup/page.tsx` | Create 6-digit PIN (enter + confirm). Stores `btoa('sina_pin:' + pin)` hash. On success → signs out → `/login` |

#### Dashboard Routes — `app/(dashboard)/`

Full layout: Sidebar (desktop) + TopBar + PageTransition + FloatingDock + AppLockGuard + PulseBackground.

| Route            | File                     | Purpose                                                                                                                                                                      |
| ---------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` (Dashboard)  | `page.tsx`               | BalanceHero, WalletCarousel, GoalGrid (2 goals), SpendingBreakdown donut, recent TransactionList, QuickAddModal, AIChatBottomSheet                                           |
| `/history`       | `history/page.tsx`       | Full transaction history with search, date/type/wallet/category filters, grouped by date                                                                                     |
| `/ai-chat`       | `ai-chat/page.tsx`       | Full-page AI chat. 7 intents: `record_transaction`, `add_wallet`, `set_budget`, `add_debt`, `add_to_goal`, `query_data`, `general_chat`. Saves confirmed actions to Supabase |
| `/goals`         | `goals/page.tsx`         | Savings goals grid with GoalModal (image crop support)                                                                                                                       |
| `/wallets`       | `wallets/page.tsx`       | Summary cards (assets/liabilities/net), add wallet form (Thai bank sub-selection), wallet cards with holographic tilt, inline edit/split/delete                              |
| `/net-worth`     | `net-worth/page.tsx`     | Net worth hero (ScrambleText), dual-ring SVG donut (assets vs liabilities), breakdown by wallet type, debt progress                                                          |
| `/debts`         | `debts/page.tsx`         | "Debt Destroyer" — cinematic GSAP ScrollTrigger demo with hardcoded data. Laser line, card shatter effect, aura shift. **Uses dummy data, not DB**                           |
| `/debt-timeline` | `debt-timeline/page.tsx` | Real debt management: hero stats, add debt form, debt list with magnetic rows, CRUD operations                                                                               |
| `/monthly-bills` | `monthly-bills/page.tsx` | Summary cards, add bill form, bill cards with holographic tilt, paid/overdue/upcoming status, toggle paid                                                                    |
| `/tax-planning`  | `tax-planning/page.tsx`  | Thai PIT calculator: income input, 8 tax brackets visualization, 10 deduction types with max caps, save to profile                                                           |
| `/settings`      | `settings/page.tsx`      | Profile (avatar, name), Security (password, PIN, app lock toggle + timer, logout), Data (CSV export, cloud sync status, DB stats, wipe all data)                             |

#### API Routes

| Route                  | Method | Purpose                                                                                                       |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `/api/ai/parse`        | POST   | 2-step agentic AI: Gemini intent classification → intent-specific structured parsing. Zod-validated responses |
| `/api/ai/scan-receipt` | POST   | Targeted OCR parsing using Gemini to extract items, update transactions, and mark as completed.               |

---

## 4. Core Architecture & Logic Rules

### 4.1 Modals & Overlays — Portal Requirement (CRITICAL)

**Problem:** `PageTransition.tsx` wraps all page content in a `<motion.div>` with:

- `perspective: 1200px` on the parent
- `transform-style: preserve-3d`, `scale`, `translateZ`, `rotateX` on the animated element
- `filter: blur()` during transitions

These CSS properties create a **new stacking context** that traps `position: fixed` elements. Any modal or overlay rendered inside PageTransition will NOT behave as fixed-position relative to the viewport.

**Solution:** ALL modals, overlays, bottom sheets, and drawers MUST be wrapped in the `<Portal>` component (`components/ui/Portal.tsx`), which uses `ReactDOM.createPortal(children, document.body)` to render outside the stacking context.

```tsx
import Portal from "@/components/ui/Portal";

// CORRECT
<Portal lockScroll={isOpen}>
  <AnimatePresence>{isOpen && <MyModal />}</AnimatePresence>
</Portal>;

// WRONG — modal will be trapped inside PageTransition's 3D transform
{
  isOpen && <MyModal />;
}
```

**Portal props:**

- `lockScroll?: boolean` — when `true`, sets `document.body.style.overflow = 'hidden'`
- SSR-safe: only renders after client mount

**Modal positioning pattern:**

```tsx
<div className="fixed inset-0 z-[100] flex items-center justify-center h-[100dvh]">
  <div className="absolute inset-0 bg-black/60" onClick={onClose} />  {/* backdrop */}
  <div className="relative z-10 ...">  {/* modal content */}
```

**Components that correctly use Portal:**

- `QuickAddModal`, `AIChatBottomSheet`, `GoalModal`, `WipeDataModal`, `ChangePasswordModal`, `ChangePinModal`, `EditProfileModal`, `SettingsModal`
- `TopBar` mobile drawer

**FloatingDock is placed OUTSIDE PageTransition** in the dashboard layout to avoid stacking context issues.

### 4.2 Security & App Lock

#### User Flow — Three Scenarios

**Scenario 1 — New User (Unregistered):**

```
/login → "สมัครสมาชิก" link → /onboarding/welcome → "สมัครสมาชิก" CTA
  → /register → fill form → success → /onboarding/pin-setup
  → create 6-digit PIN → confirm → auto sign-out → /login (final)
```

After the final login, the user enters Scenario 2.

**Scenario 2 — Existing User (New Session):**

```
/login → email + password → success → proxy redirects to /pin-verify
  → enter 6-digit PIN → pin_verified cookie set → Dashboard (/)
```

**Scenario 3 — Returning User (Active Session, Locked/Idle):**

```
User is idle or tab hidden → AppLockGuard clears pin_verified cookie
  → proxy redirects to /pin-verify → enter PIN → Dashboard (/)
```

#### Route Protection — `proxy.ts` (Next.js 16)

All route gating is enforced by `proxy.ts` (NOT middleware.ts — deprecated in Next.js 16).

| User State               | Public Routes\*           | `/onboarding/pin-setup` | `/pin-verify`             | Dashboard/\*              |
| ------------------------ | ------------------------- | ----------------------- | ------------------------- | ------------------------- |
| No session               | Allow                     | → `/login`              | → `/login`                | → `/login`                |
| Session, no PIN          | → `/onboarding/pin-setup` | Allow                   | → `/onboarding/pin-setup` | → `/onboarding/pin-setup` |
| Session + PIN, no cookie | → `/pin-verify`           | → `/pin-verify`         | Allow                     | → `/pin-verify`           |
| Fully verified           | → `/`                     | → `/`                   | → `/`                     | Allow                     |

\* Public routes: `/login`, `/register`, `/onboarding/welcome`

**Key design decisions:**

- Login page does NOT query the profile — it redirects to `/` and lets proxy.ts handle gating
- PIN setup page signs out the user on completion, forcing a fresh login
- `safeRedirect()` prevents infinite loops by checking if `pathname === target`

#### Authentication Flow (Detailed)

1. **Register** → creates Supabase user + profile row (persona: 'employee') + default cash wallet → redirects to `/onboarding/pin-setup`
2. **PIN Setup** → 6-digit PIN, stored as `btoa('sina_pin:' + pin)` hash in `profiles.pin_hash` → signs out → redirects to `/login`
3. **Login** → Supabase `signInWithPassword` → clears stale `pin_verified` cookie → redirects to `/` → proxy gates to `/pin-verify`
4. **PIN Verify** → boot sequence animation → 6-digit numpad → hash comparison → sets `pin_verified` cookie → redirects to dashboard

#### AppLockGuard (`components/layout/AppLockGuard.tsx`)

- Renders nothing (pure side-effect component)
- Mounted in dashboard layout — runs on ALL dashboard pages
- Uses `useAppLock()` hook internally

#### useAppLock (`hooks/useAppLock.ts`)

- **Settings in localStorage:** `sina_fn_app_lock` (enabled: "true"/"false"), `sina_fn_lock_timer` (minutes: "1"/"5"/"10")
- **Default:** disabled, 5-minute timer
- **Activity events:** `mousemove`, `keydown`, `touchstart`, `scroll`, `click`
- **Idle check:** every 15 seconds, compares elapsed time against timer
- **Visibility change:** on tab return, checks if idle time exceeded while away
- **Lock action:** clears `pin_verified` cookie → redirects to `/pin-verify`

#### Wipe Data Sequence (`components/settings/WipeDataModal.tsx`)

3-step destructive confirmation:

1. **Password verification** — Supabase `verifyUserPassword()`
2. **PIN verification** — 6-digit numpad with shake animation on error
3. **Type "DELETE"** — exact string match

On confirm: calls `wipeAllUserData()` which hard-deletes transactions, soft-deletes debts/goals/bills, resets wallet balances to 0.

### 4.3 Animations

#### GSAP + ScrollTrigger

**Always call `useGSAP()` at the top level of the component** — never inside conditionals, loops, or callbacks. This is both a Rules of Hooks requirement and a GSAP best practice.

```tsx
// CORRECT
import { useGSAP } from '@gsap/react';

export default function MyPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.card', {
      scrollTrigger: { trigger: '.card', start: 'top 85%' },
      y: 40, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out',
    });
  }, { scope: containerRef });

  return <div ref={containerRef}>...</div>;
}

// WRONG — conditional hook
if (data.length > 0) {
  useGSAP(() => { ... });
}
```

**Common GSAP patterns in the codebase:**

- Stagger reveal on scroll: `gsap.from(targets, { scrollTrigger, y: 30-60, opacity: 0, stagger: 0.08-0.15 })`
- Section headers: slide-up title + scale-in divider line (`SectionHeader.tsx`)
- Dashboard page: stagger sections as they enter viewport

#### useHolographicTilt (`hooks/useHolographicTilt.ts`)

Mouse-driven 3D card tilt with radial gradient sheen. Returns:

- `ref` — attach to the card element
- `cardStyle` — inline transform (`perspective(600px) rotateX() rotateY()`)
- `sheenStyle` — radial gradient positioned at cursor
- `glowStyle` — border glow on hover
- `onMouseMove`, `onMouseLeave` — event handlers

GSAP handles the smooth reset animation on mouse leave (`gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power3.out' })`).

**Used in:** wallet cards, bill cards, goal cards.

#### Framer Motion

- **Page transitions:** `PageTransition.tsx` — `AnimatePresence mode="wait"` keyed by `pathname`, 3D warp variants
- **Modal enter/exit:** `AnimatePresence` + `motion.div` with spring/ease transitions
- **Micro-interactions:** button tap scales, toast slide-in, tab switches
- **Dashboard DoF:** `.dashboard-dof--active` class toggles `scale(0.95) + blur(8px)` when AI chat opens

### 4.4 Data Fetching

#### Architecture

All data flows through this pipeline:

```
Supabase (PostgreSQL) → lib/supabase/queries.ts → hooks/*.ts → Components
```

- **`lib/supabase/queries.ts`** — the data access layer. ALL Supabase queries go here. Every function checks `isSupabaseConfigured()` before executing.
- **`hooks/*.ts`** — each domain has a dedicated hook (`useWallets`, `useTransactions`, `useBudgets`, `useGoals`, `useDebts`, `useBills`, `useAnnualIncome`, `useHealthScore`). Hooks manage `loading`, `error`, and `data` state.
- **No mock data** — all hooks fetch real Supabase data (except `/debts` page which uses hardcoded demo data for the cinematic animation).

#### Global Data Invalidation — Event Bus

```
dispatchAppMutate() → window event "app_mutate" → all hooks refetch
```

Defined in `lib/events.ts`. After any mutation (add transaction, create wallet, toggle bill paid, etc.), call `dispatchAppMutate()` to trigger all active hooks to refetch their data.

**Every hook** listens for this event via `window.addEventListener('app_mutate', refetch)`.

#### Supabase Client

`lib/supabase/client.ts` creates a browser client via `createBrowserClient` from `@supabase/ssr`. Auth tokens are stored in cookies (not localStorage) for SSR compatibility.

#### Key Query Functions (`lib/supabase/queries.ts`)

| Function                               | Description                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| `getTransactions(userId, opts?)`       | Fetch transactions with joined wallet + category. Supports limit, month/year filter |
| `addTransaction(data)`                 | Insert transaction + update wallet balance (± amount)                               |
| `getWallets(userId)`                   | Fetch non-deleted wallets                                                           |
| `createWalletWithOpeningBalance(data)` | Create wallet + insert opening balance transaction                                  |
| `getBudgets(userId, month, year)`      | Fetch budget envelopes with joined category                                         |
| `upsertBudget(data)`                   | Create or update budget for category/month/year                                     |
| `getGoals(userId)`                     | Fetch goals with joined linked wallet                                               |
| `getDebts(userId)`                     | Fetch non-deleted debts                                                             |
| `getMonthlyBills(userId)`              | Fetch non-deleted monthly bills                                                     |
| `toggleBillPaid(billId, isPaid)`       | Toggle bill paid status                                                             |
| `wipeAllUserData(userId)`              | Hard-delete transactions, soft-delete others, reset balances                        |
| `recalculateWalletBalances(userId)`    | Recompute wallet balances from transaction sum                                      |

#### Composite Hook: `useDashboard`

Combines `useAuth` + `useWallets` + `useTransactions` + `useBudgets`. Computes:

- `totalBalance` (sum of all wallet balances)
- `totalIncome` / `totalExpense` / `netCashFlow` (current month)
- `spendingByCategory` with percentages
- SVG donut segments (circumference based on r=38)
- `recentTransactions` (latest 5)
- Runs `recalculateWalletBalances` once per session

### 4.5 State Management

| Layer                         | Tool                                  | Scope                                                  |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------ |
| Server data                   | Custom hooks (`hooks/*.ts`)           | Wallets, transactions, budgets, goals, debts, bills    |
| Client UI state               | Zustand (`store/appStore.ts`)         | User profile display, `clearState` on logout           |
| Cross-component communication | React Context (`DockActionsProvider`) | Bridge FloatingDock ↔ page modals (AI chat, quick add) |
| Global invalidation           | Event bus (`lib/events.ts`)           | `app_mutate` event triggers all hooks to refetch       |
| Security settings             | localStorage                          | `sina_fn_app_lock`, `sina_fn_lock_timer`               |

### 4.6 AI System

#### Intent Router (`app/api/ai/parse/route.ts`)

2-step agentic pipeline using Gemini `gemini-2.5-flash`:

1. **Intent Classification** — classifies Thai financial messages into 7 intents: `record_transaction`, `query_data`, `add_wallet`, `set_budget`, `add_debt`, `add_to_goal`, `general_chat`
2. **Intent-Specific Parsing** — routes to specialized Gemini prompts with Thai financial context (category mapping, emoji selection, wallet normalization, multi-transaction splitting)
3. **Zod Validation** — all AI responses are validated against intent-specific Zod schemas

#### Client-Side AI Components

- **`AIChatBottomSheet`** — bottom sheet on dashboard, sends messages to `/api/ai/parse`, renders `ConfirmationPreview` for transactions
- **`ai-chat/page.tsx`** — full-page AI chat with all 7 intent handlers, wallet fuzzy matching (Thai bank aliases), direct Supabase writes on confirm

### 4.7 Type System (`types/index.ts`)

All TypeScript interfaces are defined in `types/index.ts` as the single source of truth:

**Database types:** `Profile`, `Wallet`, `Category`, `Transaction`, `Budget`, `Goal`, `MonthlyBill`, `Debt`

**UI ViewModels:** `AppTransaction` (display-ready transaction), `BudgetItem` (display-ready budget)

**Enums:** `PersonaType`, `WalletType`, `TransactionType`, `CategoryType`, `RolloverPolicy`

The Zustand store re-exports `AppTransaction`, `BudgetItem`, and `categoryEmojiMap` from `types/index.ts` for backward compatibility only. **New code should import directly from `@/types`.**

### 4.8 Targeted OCR Reconciliation Flow & Supabase Schema Updates

#### Supabase Database Schema Updates
To support auto-ingestion and targeted OCR reconciliation, the `transactions` table is upgraded with the following columns:
*   **`status`** (ENUM): Values are `'pending_scan'` or `'completed'`. Auto-ingested entries default to `'pending_scan'`. Manual/chat entries default to `'completed'`.
*   **`items`** (JSONB): Stores structural itemized breakdown extracted from the receipt (e.g. `[{ name: "ข้าวมันไก่", price: 50 }, { name: "น้ำอัดลม", price: 15 }]`).
*   **`receipt_image_url`** (TEXT): Public storage URL of the scanned receipt slip.
*   **`bank_ref`** (VARCHAR): Unique transaction reference ID parsed from the banking app's notification.

#### Targeted OCR Reconciliation Core Workflow
1.  **Notification Edge Ingestion**: The Android edge node (`sina-fn-mobile`) runs a background `react-native-android-notification-listener` service to intercept incoming banking push alerts (e.g., KBank, SCB).
2.  **Pending Log Creation**: The mobile app extracts the amount, bank reference, and payment channel, and inserts a transaction directly into Supabase with `status: 'pending_scan'`.
3.  **Targeted Camera Scan**: The user is notified of a pending transaction. In the mobile app's Inbox, they tap the item, activating `react-native-vision-camera`. The user snaps a picture of the physical receipt.
4.  **Slip Upload**: The mobile app uploads the image to Supabase Storage and retrieves the public URL.
5.  **API Command Dispatch & Security Rules**:
    The mobile app sends a POST request to `/api/ai/scan-receipt` on `sina-fn-web` containing:
    ```json
    {
      "transaction_id": "UUID",
      "image_url": "https://..."
    }
    ```
    **CRITICAL SECURITY RULE:** All requests to `/api/ai/scan-receipt` MUST carry a valid `Authorization: Bearer <Supabase_Auth_Token>` header or supply valid `user_id` verification metadata. The Web server MUST validate the token against Supabase Auth before modifying the database. Unauthorized requests must be blocked immediately with a `401 Unauthorized` status.
6.  **Gemini AI Parsing & Reconciliation**:
    *   The Web endpoint `/api/ai/scan-receipt` retrieves the image and queries Gemini (`gemini-2.5-flash`).
    *   Gemini extracts item details (name, price), maps categories, and computes itemized totals.
    *   The endpoint reconciles the extracted total with the database's pending amount.
    *   Updates the transaction row with `items`, `receipt_image_url`, and changes the `status` to `'completed'`.
    *   Dispatches the `app_mutate` event to trigger real-time updates across all web and mobile sessions.

---

## 5. Rules for Future AI Agents

### MUST Follow

1. **Rules of Hooks** — Never call hooks conditionally, in loops, or in nested functions. `useGSAP()`, `useHolographicTilt()`, and all React hooks MUST be at the top level of the component.

2. **Portal for fixed elements** — Every modal, overlay, bottom sheet, and drawer MUST use `<Portal>` from `components/ui/Portal.tsx`. Never render fixed-position UI inside `PageTransition` children. Use `fixed inset-0 z-[100] h-[100dvh]` for modal containers.

3. **Zero TypeScript errors** — Every change must compile cleanly. Check types before committing. Import types from `@/types` (not from `store/appStore.ts`).

4. **Use the data access layer** — All Supabase queries go through `lib/supabase/queries.ts`. Never write raw Supabase queries in components or pages.

5. **Dispatch `app_mutate` after mutations** — After any data write (add, update, delete), call `dispatchAppMutate()` from `lib/events.ts` so all hooks refetch.

6. **No mock data in production pages** — All pages must fetch real data from Supabase. The only exception is `debts/page.tsx` which is an intentional cinematic demo.

7. **Preserve the design system** — Use CSS variables from `globals.css` and tokens from `lib/design-tokens.ts`. Do NOT use `constants/theme.ts` for new code (it's legacy).

8. **Respect the animation architecture:**
   - GSAP ScrollTrigger: use `useGSAP()` with `{ scope: containerRef }` pattern
   - Framer Motion: use for enter/exit animations (`AnimatePresence`), micro-interactions, and page transitions
   - Never mix GSAP and Framer Motion on the same element
   - Avoid layout shifts — use `will-change`, `transform` over `top`/`left`, `opacity` over `display`

9. **Glassmorphism layering** — Use the correct glass class for the context: `.glass` for top-level overlays, `.glass-surface` for elevated panels, `.glass-card` for content cards.

10. **Auth cookie contract** — The `pin_verified` cookie is the session gate. AppLockGuard clears it on idle. PIN verify sets it. Never bypass this flow.

### MUST NOT Do

1. **Do NOT render modals/overlays without Portal** — they will be visually broken by PageTransition's 3D transforms.
2. **Do NOT add new Zustand slices for server data** — use custom hooks that fetch from Supabase.
3. **Do NOT use `constants/theme.ts` colors** — they are legacy neon-green values that conflict with the current muted palette.
4. **Do NOT skip `isSupabaseConfigured()` checks** — it prevents crashes when env vars are missing.
5. **Do NOT create new global CSS when Tailwind utility classes exist** — prefer `@theme inline` tokens and utility-first classes.
6. **Do NOT break the `app_mutate` event contract** — if you add a new mutation, it MUST dispatch this event.
7. **Do NOT place floating/fixed UI inside the `<main>` tag in dashboard layout** — it's wrapped in PageTransition. Place it at the same level as FloatingDock and ToastProvider.

### Component Naming Conventions

| Pattern                  | Example                                                 | Where                                              |
| ------------------------ | ------------------------------------------------------- | -------------------------------------------------- |
| `Cyber*`                 | `CyberButton`, `CyberCard`, `CyberInput`, `CyberToggle` | Reusable UI primitives in `components/ui/`         |
| `use*`                   | `useWallets`, `useHolographicTilt`, `useAppLock`        | Custom hooks in `hooks/`                           |
| Page-specific components | `BalanceHero`, `SpendingBreakdown`, `WalletCarousel`    | `components/dashboard/`, `components/goals/`, etc. |

### Font Stack

- **Sans:** Geist Sans (`--font-geist-sans`) — body text, labels
- **Mono:** Geist Mono (`--font-geist-mono`) — numbers, amounts, code-like elements
- Both loaded via `next/font/google` in root `layout.tsx`

### Responsive Breakpoints

- **Mobile-first** — all layouts start at mobile width
- **`lg:` (1024px)** — sidebar appears (`lg:ml-[260px]`), content padding increases
- Sidebar: fixed 260px width on desktop, hidden on mobile (TopBar has hamburger drawer)
