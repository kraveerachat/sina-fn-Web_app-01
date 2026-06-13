# Product

## Register

product

## Users

Thai personal-finance users (bilingual TH·EN) tracking wallets, spending, savings goals, debts, bills, and tax planning. They check balances daily on mobile and desktop, log transactions quickly (often via AI chat), and review trends weekly. Context: short, frequent sessions; numbers must be legible at a glance.

## Product Purpose & Requirements

Sina_FN is a **Financial Data Aggregator & Reconciliation Center** with automated background data ingestion and targeted AI verification (Next.js web command center combined with a React Native Android edge client). Success: the user's accounts stay in sync automatically via mobile notification capture, and transaction details are accurately itemized in seconds via targeted receipt scanning.

## Core Features & Hybrid Modules

1. **Android Background Notification Listener**: Edge node automatically captures push notification alerts from Thai banking apps (e.g. KBank, SCB) and logs them directly to Supabase as pending transactions.
2. **Permission Onboarding Flow**: An intuitive mobile onboarding screen guiding the user to grant necessary Android Notification Access permissions so background capture runs seamlessly.
3. **Targeted AI Receipt Scanning**: The user takes a picture of the receipt to lock onto a pending notification record. Gemini AI OCR processes the slip, extracts individual line items (names and prices), and reconciles them into the database, transitioning the transaction status to completed.
4. **Bento Grid Command Dashboard**: A premium, Apple-like Web UI panel that aggregates totals, tracks assets vs liabilities, displays net worth progress, and organizes monthly budgets.

## Brand Personality

Calm, precise, premium. Apple-like restraint: the interface disappears into the task. Three words: quiet, trustworthy, tactile. Physical feedback (squish on press) gives the app a hardware-like feel without noise.

## Anti-references

- The app's own former "Utopia Tokyo HUD" cyberpunk theme: neon glows, scramble-text effects, brutalist 90° corners, uppercase tracked mono labels, particle backgrounds. Do not reintroduce any of it.
- Crypto-dashboard aesthetics: dark-only, glow-on-everything, animated gradient borders.
- Generic SaaS gradient-hero templates.

## Design Principles

1. **Numbers first** — balances and amounts are the content; tabular-nums, high contrast, generous size. Everything else recedes.
2. **One vocabulary everywhere** — same card, same pill button, same row pattern on every screen. Consistency is the affordance.
3. **Motion conveys state** — reveal on entry, squish on press, draw-on for charts. Nothing loops decoratively except the single hero sheen. All gated on `prefers-reduced-motion`.
4. **Color is meaning** — deep blue = primary/action, green = positive/income, gold = premium/highlight, restrained warm neutral = outflow. Neutrals carry everything else.
5. **Light and dark are equals** — every surface, border, and shadow has a tuned value in both themes; no theme is an afterthought.

## Accessibility & Inclusion

- Body text ≥4.5:1 contrast in both themes; large numerals ≥3:1.
- Touch targets ≥44px (dock, pills, rows).
- `prefers-reduced-motion: reduce` disables floaty/sheen/reveal animations.
- Bilingual TH·EN strings; Thai font fallback (Noto Sans Thai / Sarabun) in the stack.
