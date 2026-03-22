# Kine-Next Gap Checklist
## Status: ~85% functional, ~65% visual parity
## Updated: 2026-03-22

---

## BLOCKERS (5)

- [x] **Muscle diagram SVG** — DONE. Full SVG body outline ported with dynamic highlighting
- [x] **Session rearrange integration** — DONE. SessionRearrange wired, plus session replay/amendment sheet added
- [ ] **Periodisation model** — Current is simplified 5-week. Old app had 4-week blocks (Accumulation/Intensification/Peak/Deload) with adherence-based phase holding
- [ ] **Education visibility in session** — Breathing cues + muscle tags show in session cards. Need: clickable muscle glossary, form cues for compounds, set notation on first encounter
- [x] **Pre-session hooks error** — DONE. Guard moved after all hooks. Production clean

## FUNCTIONAL GAPS (12)

- [x] **Session replay/amendment** — DONE. Bottom sheet with edit capability
- [x] **Injury-based warmup mods** — DONE. Added to warmup page
- [x] **Ramp sets for compounds** — DONE. empty bar → 50% → 75% working weight
- [x] **Rest day messages on week view** — DONE. Recovery messages shown on rest day cards
- [x] **Cooldown page depth** — DONE. Session-specific stretches + category labels
- [ ] **Week check-in → AI prompt** — Feedback saves but doesn't feed into next week's generation
- [ ] **Time budget applied to session** — trimSessionToTime exists but not applied when entering live session
- [ ] **Quick period log from week view** — Only in profile, not week view header
- [ ] **Video sheet in session** — Thumbnails show but tap needs to open video player
- [ ] **Skill path sheet in session** — Component exists but no trigger button in session
- [ ] **Custom builder AI option** — Manual only, no AI-powered generation
- [ ] **Stall detection surfaced** — Logic exists but not shown in UI

## VISUAL/UX GAPS (10)

- [ ] **Cycle phase arc** — No arc visualisation
- [ ] **Block completion celebration** — No card on block complete
- [ ] **Next week preview** — No preview
- [ ] **PR share card** — No shareable card
- [ ] **Swipe dismiss** — Bottom sheets button-only close
- [ ] **Exercise illustrations** — No inline SVG graphics
- [ ] **Onboarding polish** — Transitions, spacing, animation
- [ ] **Week view card refinement** — Visual depth
- [ ] **Session screen depth** — Feels flat vs old
- [ ] **Typography/spacing** — Less refined than old CSS

---

## COMPLETED THIS SESSION
- Muscle diagram SVG with full body outline
- Session rearrange + session replay/amendment
- Injury warmup mods + ramp sets
- Cooldown session-specific stretches
- Rest day recovery messages
- Pre-session hooks fix
- Colour-coded exercise cards (Option 2)
- Duration context notes + smart trimming
- Equipment reverse logic
- Week view collapsed sessions with context
- Progress icons
- Hero background texture
- Gradient hero card for pre-session
- Editable training settings in profile
- Subscription management panel
- Per-day duration editing
- Demo mode auto-seed
