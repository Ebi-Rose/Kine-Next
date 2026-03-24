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

## v0.1.0 — Private Beta Launch (March 2026)

### New
- **AI-powered weekly programming** — Kine builds your training week based on your goal, experience, equipment, schedule, and cycle phase. Every exercise choice is explained in plain language.
- **Post-session coaching** — After each session, Kine analyses your performance and adjusts future programming. No scores or grades — just observation-based feedback.
- **Cycle-aware training** — Programs adapt quietly across your menstrual cycle phases. Supports regular cycles, irregular cycles, hormonal contraception, and perimenopause.
- **Exercise library** — 200+ exercises with video demos, form cues, and muscle education. Three education modes: full detail, feel-based cues, or silent.
- **Per-day session duration** — Set different time budgets for each training day. Kine trims or expands your session accordingly.
- **Dynamic warmups** — Auto-generated warmup sequences based on the exercises in your session.
- **Injury management** — Select limitations (knees, lower back, shoulder, postpartum, etc.) and Kine programs around them with appropriate swaps.
- **Progress tracking** — Lift history, session logs, and visual progress charts.
- **Offline support** — Works as a PWA. Log sessions without internet; data syncs when you're back online.
- **In-app guide** — Contextual help drawer explaining how Kine works, how to interpret feedback, and how to get the most from your program.

### Technical
- React 19 + Next.js 16 + Tailwind 4
- Supabase auth and data sync
- Stripe subscription management
- LocalStorage-first with cloud backup

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
