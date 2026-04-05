# Changelog

All notable changes to the Kine app, from initial Next.js migration onwards.

---

## 2026-04-05

### Access & Auth
- Simplify access system to single code — remove demo/new modes, personas moved to dev tools
- Route signup directly to pricing, skip unnecessary /app bounce
- Restore access code gate in proxy for beta
- Remove proxy subscription gate — AuthGuard handles subscriptions client-side
- Fix login flow: redirect to app if active subscription
- Fix pricing/app redirect loop (proxy was doing server-side 307 before client code ran)
- Gate pricing page behind authentication
- Use `window.location.href` for all auth redirects (soft nav unreliable in PWA)
- Use hard navigation for all access code redirects
- Fix login page flicker with auth gate and stable useEffect
- Redesign login page with pill toggle for login/signup tabs

### PWA & Service Worker
- Scope PWA to login/app routes only (landing page is not a PWA)
- Strip service worker to static assets only — stop caching HTML pages
- Fix stale SW cache serving dead JS chunks on landing page
- Unregister stale service workers on non-app pages

### Dev Tools
- Show dev tools in all access modes including production
- Persist dev date override to localStorage and reload on change
- Fix reload race condition with async encrypted store persistence
- Add persona loaders (Mia, Priya, Aisha, Emma, Diane, Demo) to dev tools Sim tab

### UI
- Redesign next week view with full day cards, dates, and expandable exercises
- Add dashboard link when pricing shows active subscription error
- Show branded loading state on pricing page during subscription check

---

## 2026-04-04

### Features
- Add trends page with progress tools grid
- Collapse past uncompleted day cards to minimal view
- Pre-start UX improvements: pill toggle, smart apply, equipment display
- Update pricing page and compact Week 1 preview
- Batch 1+2: Onboarding, UX, and visual improvements
- Improve sandbox mode communication tone

### Fixes
- Fix infinite spinner on post-checkout onboarding
- Await verify-subscription to set kine_sub cookie before allowing navigation
- Fix CSP blocking JS hydration on app routes
- Fix start-next-Monday override and unicode rendering on how-we-build page
- Prevent double payment by checking for active/trialing subscriptions before checkout
- Fix Kine logo rendering on pricing page

---

## 2026-04-02

### UI Redesign
- Implement Direction E (Warm Feminine) UI redesign across the app
- Update landing page mockup to Direction E UI
- Show footer links on mobile landing page

### Internal
- Add internal page with filming day checklist
- Update filming checklist: portrait orientation for mobile app

---

## 2026-04-01

### Features
- Split home screen into Today/Week tabs
- Add test personas (Mia, Priya, Aisha, Emma, Diane) for QA testing
- Hide nav during onboarding flow

### Fixes
- Fix week number display
- Fix future days showing as done
- Fix CSRF check for Vercel deployments and localhost dev
- Fix CSRF: accept all *.vercel.app deployment domains
- Fix waitlist 500: handle duplicate inserts as success

---

## 2026-03-31

### Features
- Add floating dev overlay on all /app/* pages
- Add toggle-off warnings, pre-fill, streaks, strength trend, profile redesign
- Refactor profile page into panel components
- Declutter rest day screen — show only hero + tomorrow preview

### Infrastructure
- Security hardening, docs reorg, format lib, tests, error handling
- Fix CSP blocking inline scripts: set nonce on request headers
- Fix access codes, CSP, AI validation, sync, error boundaries & tests
- Add sandbox features and dev time override

### Accessibility
- Fix 8 accessibility findings from fifth audit

---

## 2026-03-29

### Monitoring
- Add Sentry v10 client-side init
- Add Sentry and Upstash dependencies
- Hardcode Sentry DSN and remove conditional enable

### Content
- Add calisthenics muscle group and new exercises to library

### Accessibility
- WCAG 2.1 AA accessibility audit — initial pass
- WCAG 2.2 AA accessibility audit — rounds 2, 3, and 4

---

## 2026-03-27

### Fixes
- Fix onboarding completion bug, add name step, show email in profile
- Fix post-checkout onboarding skip
- Fix infinite loading on post-checkout onboarding page
- Fix split structure: enforce lower body >= upper body sessions
- Fix waitlist: replace broken Google Sheets with Supabase

---

## 2026-03-26

### Features
- Add AI week validation layer, exercise pool constraints, and improved fallback
- Add condition-aware features and auth improvements

### Infrastructure
- Production audit fixes: legal pages, auth middleware, security, UX

---

## 2026-03-25

### Features
- Redesign landing page with new copy, hero background, and app header logo
- Tighten landing page layout to fit single viewport, stack form on mobile
- Show phone mockup on mobile with compact sizing
- Add per-session feedback insights to landing page

### Access
- Support multiple access codes via comma-separated env var
- Move access codes to env var only — nothing hardcoded

---

## 2026-03-24

### Features
- Add week history and navigation
- Add session completion validation, summary, and warmup warning
- Add inline dev tools to main app page
- Add unskip and fix set auto-fill on keystroke
- Require weight for weighted exercises in completion check

### Auth & Billing
- Require real auth + subscription for app access
- Fix webhook period dates — read from item level as fallback
- Fix billing portal — use raw fetch instead of Stripe SDK
- Detect cancellation from cancellation_details.reason

### Fixes
- Fix session page crash and improve lift history UI
- Fix AuthGuard re-checking on every navigation
- Fix AuthGuard infinite spinner
- Fix session page spinner — use goal check instead of _hasHydrated

---

## 2026-03-23 (Part 2)

### Features
- Add session timing modes, clickable exercise suggestions, pre-session energy check-in
- Add landing page, access gate, and auth restructure for kinefit.app
- Three access codes: full (login), new (onboarding), demo (seeded data)
- Port full warmup engine — alternatives, stabiliser preps, injury mods
- Add guide button and drawer components

### Session UX
- Remove duplicate skip/swap buttons from exercise card bottom
- Pre-populate reps with lower end of planned range (e.g. 8-10 → 8)
- Fix stopwatch/timed mode not persisting to session page
- Show rest period time impact in changes from plan summary

### Fixes
- Fix subscription flow: checkout auth, cancel tracking, resubscribe
- Fix kinenew/kinedemo infinite loading in AuthGuard
- Persist demo mode in localStorage to survive navigation
- Fix demo flows, warmup toggle, edu lookup

---

## 2026-03-23 (Part 1)

### Features
- Periodisation 4-week blocks + education in session
- Close 9 functional gaps: session edit, rest messages, time budget, period log, video/skill sheets, AI builder, stall detection
- Week check-in overhaul + goal-aware feedback
- Add exercise education sheet with ? button in session

### Warmup & Education
- Warmup "how to" popup
- Fix education sheet: load from EXERCISE_EDU_LIBRARY (112KB)
- Fix coaching mode toggle — eduMode now controls session education
- Fix swap segmentation + warmup education context

### Infrastructure
- Replace custom CSS label utilities with inline Tailwind classes
- Move custom animations to separate CSS file for Tailwind v4 compatibility
- Address all remaining audit items

---

## 2026-03-22

### Initial Build
- Initial commit: Kine Next.js migration from previous codebase
- Add marketing landing page with auth screens

### Core Features
- Onboarding flow with AI-powered programme generation
- Session page: swap sheet, education, warmup, video, muscle tags
- Week view with day cards and session tracking
- Calendar with session dots, expandable day details, bar charts
- Profile: editable injuries, subscription panel, per-day durations
- Skill paths, periodisation, session rearrange
- Progress photos and service worker for PWA
- Haptics, exercise videos
- Education layer, state reconciliation, cloud sync, pricing, time budget
- Custom builder, week check-in, exercise swap sheet

### Session Intelligence
- Smart session trimming instead of full regeneration
- Suggest exercises when extending session significantly
- Comprehensive gap checklist for next session
- Regenerate button when session duration changes
- Pre-session gradient hero card styling
- Colour-coded exercises, duration context notes

### Technical
- Muscle diagram with full SVG body outline
- Warmup engine: injury mods, ramp sets, session-specific cooldown
- Store hydration, sanitization, programme-age tracking
- Fix hooks order violations, pre-session hydration
- Editable training settings, collapsed week view
- Reverse equipment logic, week view education, progress icons
