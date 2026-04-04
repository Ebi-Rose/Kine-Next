# Changelog — What's New in Kine

A running log of updates, improvements, and fixes shipped to Kine users. Newest first.

---

## How to use this document

Each release gets a dated entry with a short summary of what changed and why it matters. Categories:

- **New** — Features that didn't exist before
- **Improved** — Existing features made better
- **Fixed** — Bugs squashed
- **Changed** — Behaviour that shifted (may affect your workflow)

---

## v0.2.1 — Payment Guard (4 April 2026)

### Fixed
- **Double payment prevention** — The checkout flow now checks Stripe for existing active or trialing subscriptions before creating a new session. Users who already have a subscription see a clear error instead of being charged again.

---

## v0.2.0 — Transparent Progression (29 March 2026)

### New
- **Transparent weight progression** — Kine now shows you exactly what it's thinking about your next weight. Instead of silently suggesting a number, you see your last session's performance, a volume trend, and a clear recommendation with the reasoning behind it. You can accept the suggestion, stay at your current weight, or adjust manually. You always have the final say.
- **Phase-aware progression** — Weight suggestions now adapt to your current training phase. In a Volume week (10-12 reps), you need to hit 12 reps twice before Kine suggests moving up. In a Strength week (6-8 reps), hitting 8 twice is the trigger. The threshold moves with your programme, not against it.
- **Volume tracking** — Each exercise now shows total volume (weight x reps) trending up or down compared to your previous session, so you can see your trajectory at a glance.
- **Detraining detection** — If you've been away for 14+ days, Kine suggests restarting at ~85% of your previous weight instead of throwing you back in at full load. You can override this if you feel ready.

### Improved
- **Equipment detection** — Weight increments now use the exercise library (barbell: 2.5kg, dumbbell: 2kg, kettlebell: 4kg, machine: 2.5kg) instead of guessing from exercise names. No more wrong increments for exercises like "Goblet Squat".
- **Programme maturity** — Fixed a bug where high-volume users (40+ sessions in 2 weeks) were classified as "established" despite being brand new. Maturity now requires both session count and calendar time to justify the level.

### Changed
- **Security headers** — Middleware now sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and `Referrer-Policy` on all responses. Blocks clickjacking, MIME sniffing, and protocol downgrade attacks.
- **AI prompt hardening** — User-supplied text (injury notes, week feedback notes) is now sanitised before insertion into AI prompts. Prevents tag-escape injection where `</user_notes>` in user input could break out of the data boundary.
- **Request body size limits** — All API routes now reject oversized payloads before reading the body (webhook: 64KB, checkout/waitlist/access: 4KB). Prevents memory exhaustion from malicious large requests.

### Fixed
- **Programme maturity logic** — `getProgrammeMaturity()` used `||` instead of taking the more conservative of two signals, causing misclassification in edge cases.

---

## v0.1.0 — Private Beta Launch (March 2026)

### New
- **AI-powered weekly programming** — Kine builds your training week based on your goal, experience, equipment, schedule, and cycle phase. Every exercise choice is explained in plain language.
- **Post-session coaching** — After each session, Kine analyses your performance and adjusts future programming. No scores or grades — just observation-based feedback.
- **Body-intelligent programming** — Programs adapt to your cycle phase, health conditions (PCOS, endometriosis, fibroids, pelvic floor), and life stage (perimenopause, postpartum). Supports regular cycles, irregular cycles, and hormonal contraception. Adaptations are silent — no labels, no special modes.
- **Exercise library** — 173 exercises with form cues and muscle education. Three education modes: full detail, feel-based cues, or silent. Video demos in progress.
- **Per-day session duration** — Set different time budgets for each training day. Kine trims or expands your session accordingly.
- **Intelligent warmups** — Context-aware warmup sequences based on session content, injuries, health conditions, and experience level. Ramp sets for barbell work, alternatives for every item.
- **Injury management** — Select limitations (knees, lower back, shoulder, postpartum, etc.) and Kine programs around them with appropriate swaps.
- **Progress tracking** — Lift history, session logs, and visual progress charts.
- **Offline support** — Works as a PWA. Log sessions without internet; data syncs when you're back online.
- **In-app guide** — Contextual help drawer explaining how Kine works, how to interpret feedback, and how to get the most from your program.

### New (Post-Launch Updates)
- **Health conditions system** — PCOS, fibroids, endometriosis, and pelvic floor dysfunction treated as silent programming context. Exercise swaps, warmup mods, breathing cue overrides, and condition-specific AI context — all woven into existing systems without labelling the user.
- **AI week validation layer** — Post-generation validation catches malformed exercises, equipment conflicts, injury violations, and duplicates. Auto-repairs before user sees the program.
- **Exercise pool constraints** — AI receives filtered exercise pool based on user's equipment and experience, with explicit injury avoidance lists.
- **Autoregulated deloads** — Deload triggers based on performance signals (high soreness, low energy, 6+ week safety net), not fixed schedule. Research-backed (Schoenfeld 2024).
- **Cycle-performance correlations** — Phase-based performance stats (effort, PRs per phase) feed back into AI prompting. The programme gets smarter the longer you track.
- **Week check-in** — End-of-week feedback flow (energy, motivation, schedule fit) generates AI insights for next week's adjustments.

### Improved
- **Cloud sync completeness** — Upload now includes conditions, comfortFlags, sessionMode, and restConfig. Download restores all state fields (injuryNotes, conditions, cyclePhase, dayDurations, cycle, sessionMode, restConfig, eduFlags, skillPreferences, progressDB, currentDayIdx).
- **Week check-in feedback** — Schedule feeling ("too easy" / "about right" / "too much") saved as structured data and fed into AI prompt for next week's programming adjustments.
- **AI prompt accuracy** — Fixed mislabelled motivation/soreness fields in week-builder prompts. Soreness threshold corrected. Volume guidance now responds to schedule feeling.
- **Subscription polling** — Replaced fixed polling delays with exponential backoff in AuthGuard for faster and more reliable subscription detection after checkout.
- **Weight suggestions** — Fixed equipment detection bug where "Dumbbell Romanian Deadlift" was incorrectly classified as barbell, leading to wrong starting weight suggestions.

### Fixed
- **Cloud sync data loss** — Several user fields (conditions, comfort flags, session mode, rest config) were not uploaded to Supabase, causing data loss on device switch.
- **Week history unbounded growth** — weekHistory now capped at 26 entries to prevent localStorage bloat.

### Changed
- **Rate limiting** — Replaced in-memory rate limiter with Upstash Redis (10 requests/60s sliding window). Survives serverless cold starts and works across all instances.
- **Error tracking** — Added Sentry v10 for client, server, and edge error capture with source maps.
- **API input validation** — Chat route now validates JSON parsing, per-message content length (30k char max), and body size.
- **Removed protection.ts** — Removed right-click/text-selection/DevTools blocking that broke accessibility with no security benefit.

### Technical
- React 19 + Next.js 16 + Tailwind 4
- Supabase auth and data sync
- Stripe subscription management
- Zustand state management with localStorage persistence + Supabase cloud backup
- Sentry v10 error monitoring (client + server + edge)
- Upstash Redis distributed rate limiting

---

## Template for future entries

```
## vX.X.X — Title (Date)

### New
- **Feature name** — What it does and why it matters.

### Improved
- **Feature name** — What changed and the user benefit.

### Fixed
- **Bug description** — What was broken and how it's resolved.

### Changed
- **Behaviour change** — What shifted and what users should know.
```

---

*This changelog is maintained by the Kine team. For questions or feedback, reach out via Instagram [@_kinefitness](https://instagram.com/_kinefitness).*
