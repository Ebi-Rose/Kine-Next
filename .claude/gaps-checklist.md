# Kine-Next Gap Checklist
## Status: ~70-75% functional, ~50-60% visual parity with old app
## Created: 2026-03-22

---

## BLOCKERS (5)

- [ ] **Muscle diagram SVG** — No component. Old app had interactive SVG with muscle highlighting per session. Need to port `muscle-diagram.js` + `muscle-map-data.js`
- [ ] **Session rearrange integration** — `SessionRearrange.tsx` exists but verify it's fully wired and working end-to-end
- [ ] **Periodisation model** — Current is simplified 5-week (build/peak/deload). Old app had 4-week blocks (Accumulation/Intensification/Peak/Deload) with adherence-based phase holding. Need to match old model
- [ ] **Education visibility in session** — Data exists in `education.ts` but barely surfaces. Need: breathing cues always visible, muscle tags clickable to open glossary, form cues for compounds, set notation on first encounter
- [ ] **Pre-session hooks error** — Fixed in source (guard at line 218) but needs fresh dev server to confirm. Production should be clean

## FUNCTIONAL GAPS (12)

- [ ] **Session replay/amendment** — Bottom sheet shows read-only data. Need edit capability to amend past session logs
- [ ] **Injury-based warmup mods** — `getWarmupForSession()` doesn't incorporate user's injuries. Need to add injury-specific drills from `WARMUP_INJURY_MODS`
- [ ] **Ramp sets for compounds** — No warm-up set suggestions before heavy compounds (e.g. "empty bar → 40kg → 50kg → working weight")
- [ ] **Rest day messages on week view** — `REST_DAY_MESSAGES` and `REST_DAY_RECOVERY` data exists but not shown on rest day cards
- [ ] **Cooldown page depth** — `/app/cooldown` is minimal. Need to integrate full `COOLDOWN_BREATH` + `COOLDOWN_RESET` + `COOLDOWN_EXERCISE_RELEASE` data
- [ ] **Week check-in → AI prompt** — Week check-in saves feedback but doesn't feed into next week's generation prompt
- [ ] **Time budget applied to session** — `trimSessionToTime` exists but not applied when user enters live session from pre-session
- [ ] **Quick period log from week view** — Period logging only in profile. Old app had quick-log from week view header
- [ ] **Video sheet in session** — `VideoSheet.tsx` exists but not triggered from exercise cards. Video thumbnails show but tap doesn't open sheet
- [ ] **Skill path sheet in session** — `SkillPathSheet.tsx` exists but no button in session exercise cards to trigger it
- [ ] **Custom builder AI option** — Only manual exercise selection. Old app had AI-powered custom programme generation
- [ ] **Stall detection surfaced** — `programme-age.ts` has `getExerciseStallWeeks()` but result not shown anywhere

## VISUAL/UX GAPS (10)

- [ ] **Cycle phase arc** — No arc bar showing cycle progress (menstrual/follicular/ovulatory/luteal segments)
- [ ] **Block completion celebration** — No card when completing a 4-week block
- [ ] **Next week preview** — No preview of what's coming next week
- [ ] **PR share card** — No shareable card generation for PRs
- [ ] **Swipe dismiss** — Bottom sheets only close via button, not swipe
- [ ] **Exercise illustrations** — No inline SVG graphics for exercises
- [ ] **Onboarding polish** — Needs more refined transitions, spacing, and animation
- [ ] **Week view card refinement** — Cards need more visual depth (shadows, borders, spacing)
- [ ] **Session screen depth** — Feels flat vs old app's layered education + coaching
- [ ] **Typography/spacing** — Overall less refined than old CSS (letter-spacing, font weights, padding patterns)

---

## REFERENCE
- Old app: `/Users/ebi-rose/Desktop/Kine/kine/src/`
- New app: `/Users/ebi-rose/Desktop/Kine/kine-next/src/`
- Old app key files for each gap noted above
