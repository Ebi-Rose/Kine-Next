# Changelog

All notable changes to the Kine app — from the first line of code through today.

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

## 2026-03-23

### Features
- Add session timing modes, clickable exercise suggestions, pre-session energy check-in
- Add landing page, access gate, and auth restructure for kinefit.app
- Three access codes: full (login), new (onboarding), demo (seeded data)
- Port full warmup engine — alternatives, stabiliser preps, injury mods
- Add guide button and drawer components
- Periodisation 4-week blocks + education in session
- Close 9 functional gaps: session edit, rest messages, time budget, period log, video/skill sheets, AI builder, stall detection
- Week check-in overhaul + goal-aware feedback
- Add exercise education sheet with ? button in session

### Session UX
- Remove duplicate skip/swap buttons from exercise card bottom
- Pre-populate reps with lower end of planned range (e.g. 8-10 → 8)
- Fix stopwatch/timed mode not persisting to session page
- Show rest period time impact in changes from plan summary

### Fixes
- Fix subscription flow: checkout auth, cancel tracking, resubscribe
- Fix coaching mode toggle — eduMode now controls session education
- Fix swap segmentation + warmup education context
- Replace custom CSS label utilities with inline Tailwind classes
- Move custom animations to separate CSS file for Tailwind v4 compatibility

---

## 2026-03-22 — Next.js Migration

Migrated from vanilla JS monolith to Next.js 16 app router with:
- Zustand store with encrypted localStorage persistence
- Supabase auth + Stripe billing
- PWA with service worker
- AI-powered programme generation via Claude API
- Full feature parity with the original app (see pre-migration below)

---

---

# Pre-Migration: Vanilla JS App (Ebi-Rose/Kine)

The original Kine app was a single-page vanilla JS application deployed on Vercel with a Vite build step. All the core training logic, education system, and UX patterns were designed here before being ported to Next.js.

---

## 2026-03-21

### Programme Logic
- Double progression + real-world weight increments
- Phase offset: skipped weeks no longer advance periodisation phase
- Adherence-aware phase progression — hold phase when sessions are skipped
- Mid-week start awareness, missed session accuracy, and consistency audit system

### Week View
- Show past missed sessions as muted with MISSED label
- Week summary note reflects missed and skipped sessions
- Fix UP NEXT pointing to past sessions and false "to go" counts
- Fix future weeks falsely showing MISSED badges

### Onboarding
- Start date gets its own onboarding page (one purpose per screen)
- Start date options: Today / Next Monday tile buttons

### UX
- Separate cycle from limitations — independent screens with smart back nav
- Minimal thinking card — cycle + progression only, hidden when empty
- Fuzzy exercise lookup in swap sheet scoring
- Fix Mac touchpad scroll blocked by overscroll-behavior

---

## 2026-03-20

### Features
- Skip session flow, cardio builder, next week peek, pull-up progression
- Hybrid week trigger for mixed training styles
- Auto-show week summary after skipping all sessions, repeat week programming
- Adherence-aware phase progression — hold phase when sessions are skipped

### Session UX
- Exercise card Option D — progressive reveal layout
- Weight auto-fill from set 1, nudge arrows, restore coaching cues
- Realistic session timing + trim week education copy

### Week View
- Compact week view with minimal rest day lines (Option D)
- Contextual recovery note — adapts message to training:rest ratio
- Condense week education card — single paragraph

### UI
- Redesign PWA icon — full KINE wordmark with accent K
- Clean up time trim explanation — single "Cut:" label with inline rationale
- Group cut exercises by reason, shorten suggestion labels

### Fixes
- Fix getDateForDow to use currentWeek instead of calendar week
- Fix period log sheet not opening

---

## 2026-03-19

### Exercise Swap System
- Rename swap tabs, exclude duplicates from Quick Swap
- Suggested adjustments now swap directly instead of reopening swap sheet
- Quick Swap: exclude overlap exercises, flag similar ones
- Session check: anterior/posterior balance instead of overlap counting
- Raise upper body overlap tolerance — women recover faster

### Coaching Tone
- Rewrite session check fallback messages to sound human
- Soften session check language — observe, don't lecture
- Use anterior/posterior terminology with plain English in brackets

### Design Principles
- Add two new principles: Guide Don't Gate + Women's Physiology

### Landing Page
- Rewrite landing page — conversion-focused copy and app mockup

---

## 2026-03-18

### Exercise Videos
- Video thumbnail on exercise cards — 52px still frame from Cloudinary, tap to play
- Show video placeholder for all exercises
- Fix video playback — use H.264 MP4 URL directly
- Add poster frame to video sheet

### Features
- Skill path feature — make easier / make harder for exercises
- Two-tab swap sheet + comparison notes + legs/hinge gap fix
- Track exercise swaps and surface in session + week summaries
- Replace integrity score with programme map + coach nudge

### Service Worker
- Nuclear clearStorage — also clears SW caches and unregisters service worker
- Self-destruct SW to fix stale assets (later reverted and stabilised)
- Restore normal SW (v16)

### Design Principles
- Principles 25–29 + tweaks to P5/P6/P17

### Auth
- Strip auth and payment layer for clean rebuild

---

## 2026-03-17

### Coaching Intelligence
- Feedback attribution in weekCoachNote — coach note explains why the week changed
- Update tagline — "so you don't have to figure it out alone"

---

## 2026-03-16

### Education System
- Education refinements — debounce edu tracking, add week-level progression summary
- Variable session insight — rotating post-session observation replaces static stats

---

## 2026-03-15

### Auth & Payments
- Add Stripe payments, Supabase auth integration
- Split paywall into sign-in then plan selection phases
- Post-payment personal info screen, name personalisation, age-aware AI coaching
- Fix post-payment redirect flow (multiple iterations)
- Add VITE_DEV_BYPASS env var for testing
- Add BYPASS_SUBSCRIPTION env var for API testing

### AI Programme Generation
- Switch to Haiku 4.5 to avoid Vercel 10s timeout
- Add streaming API for programme generation
- Add maxDuration=60 to API function

### Education & Engagement
- Education system overhaul — progressive disclosure, eduMode gates, lazy loading, contextual coaching
- Hook Model implementation — session bridge, mastery milestones, stored value at re-entry
- Handle retroactive session logging — suppress misleading short durations

### Fixes
- Fix webhook: handle missing user_id and null subscription
- Fix post-checkout subscription state
- Multiple service worker cache bumps to force refresh

---

## 2026-03-14

### Infrastructure
- Add PWA service worker with proper PNG icons
- Enable Vite build on Vercel for minified production output
- Add app protection: security headers, build obfuscation, runtime deterrents
- Fix XSS vulnerabilities, add API rate limiting, strengthen CSP
- Add state schema validation
- Extract shared utilities into importable modules

### Session Features
- Add session time tracking and gentler exercise swap logic
- Per-exercise breakdown on celebration screen with type-aware formatting
- Fix amend screen with type-aware inputs
- Add photo journal

### Payments
- Route onboarding to paywall before week view
- Stripe checkout with £50/£500 pricing

### Progression
- Add inverted progression for assisted exercises and band progression direction
- Add bodyweight/timed progression hints

### Onboarding
- Fix onboarding steps 1–3: fill viewport, pin button to bottom on mobile

### Fixes
- Fix 6 behaviour edge cases: persist mid-session data, undo mutations, error toasts
- Fix restart state bugs, add day edit options on summary screen
- Fix summary not refreshing when duration or days change
- Add timer cleanup, API fetch wrapper with timeouts

---

## 2026-03-13

### Exercise System
- Add per-exercise save/amend during active session
- Add anatomy & mobility cues to exercise edu layer
- Add pre-checkin exercise management: add, reorder, extra time suggestions
- Validate inputs before saving exercise
- Add exercise video sheet with Cloudinary support

### Content
- Add advanced bodyweight exercises: pistol/shrimp/cossack squats, archer/planche/HSPU push-ups, ring dips
- Add front/back lever, human flag + muscle maps and education

### UX
- Compact training shorthand panel and time-adjust explanation
- Move inline edu cues to full-width container below exercise header
- Replace edu-tip-block dismiss with collapsible toggle
- Compress skipped exercises to bottom, dismissable session recorder

### Fixes
- Fix pre-checkin re-render churn, skip timing, ramp-up sets

---

## 2026-03-12

### Education
- Add education layer, goal-aware copy, and UX improvements (Phases 0–8)
- Fix onboarding vertical scroll: all steps now fit in one viewport
- Fix adjust time: live explanation, meta update, isCompound safety

---

## 2026-03-11 — Day One

### Initial Build
- Restructure monolithic HTML app into modular ES modules
- Add Vercel deployment with server-side API proxy
- Require reps/secs input before marking a set as complete
- Carry pre-checkin exercise skips into session view
- Add period log sheet with date picker

### UX
- Redesign welcome screen with clearer value proposition and stronger CTA
- Add trust line: "Built by women who lift. For women who lift."

### Technical
- Refactor: deduplicate functions, live window bindings, persist current step

### Fixes
- Fix adjust time button, period log sheet, duration updates, profile goal labels
- Style week education session pills with inline styles for reliable rendering
