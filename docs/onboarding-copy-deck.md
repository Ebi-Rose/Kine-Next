# Onboarding Copy Deck

All user-facing text in the Kine onboarding flow. Use this document to review, edit, and align on copy before it goes into code.

**Flow:** 8 screens. Steps 1–4 are numbered. Cycle and Injuries are unnumbered. Summary is the final review.

---

## Screen 0: Welcome

**Visual:** Kine logo, fade-in animation

**Headline:**
> KINE

**Subtext:**
> Train with intention.

**CTA:** Continue →

**Notes:** No user input. Sets tone. Logo and tagline only.

---

## Screen 1: Goal (Step 1 of 4)

**Headline:**
> What do you want training to give you?

**Subtext:**
> No wrong answer — all three build strength and change your body. This shapes the emphasis.

### Options

| Option | Label | Description |
|---|---|---|
| Muscle | A body I feel good in | Focus on how your body looks and feels — building visible shape with balanced, aesthetic programming. |
| Strength | Serious strength | Prioritise getting measurably stronger — structured progression on compound lifts with clear benchmarks. |
| General | A habit that actually lasts | Build a consistent, sustainable routine — varied sessions that keep you moving without burnout. |

**Notes:** Single select. No skip. This is the most important decision — it shapes the entire program template.

---

## Screen 2: Experience (Step 2 of 4)

**Headline:**
> Where are you right now?

### Options (descriptions vary by goal)

**If goal = Muscle:**

| Option | Label | Description |
|---|---|---|
| New | New to training | You'll start with foundational movements and build from there. Kine will teach as you go. |
| Developing | Training a while, still learning | You've been at it but want more structure. Kine will add progression and variety. |
| Intermediate | I know what I'm doing | You're experienced. Kine will introduce periodisation, targeted weak points, and smarter volume. |

**If goal = Strength:**

| Option | Label | Description |
|---|---|---|
| New | New to training | Start with foundational compound movements. Kine builds your base with patient progression. |
| Developing | Training a while, still learning | You know the basics. Kine adds structured progression and builds towards clear strength benchmarks. |
| Intermediate | I know what I'm doing | You're experienced. Kine programmes periodised blocks with focused intensity management. |

**If goal = General:**

| Option | Label | Description |
|---|---|---|
| New | New to training | Kine keeps it simple — foundational movements with clear guidance, building your confidence. |
| Developing | Training a while, still learning | You've been training but want something smarter. Kine varies your sessions and tracks what works. |
| Intermediate | I know what I'm doing | You know how to train. Kine keeps things fresh with intelligent variety and progression. |

**Subtext (shown after selection, varies by experience):**

| Experience | Subtext |
|---|---|
| New | Kine will start with foundational patterns and build up gradually. No pressure. |
| Developing | Kine will give you structured progression with clear reasoning. |
| Intermediate | Kine will use periodisation and targeted adjustments to keep you progressing. |

**Notes:** Single select. Descriptions change based on goal — this is intentional to show how Kine adapts.

---

## Screen 3: Equipment (Step 3 of 4)

**Headline:**
> What equipment do you have?

**Subtext:**
> Everything is selected. Tap to remove what you don't have access to.

### Options (all pre-selected)

| Equipment | Icon |
|---|---|
| Barbell | 🏋️ |
| Dumbbells | 💪 |
| Kettlebell | 🔔 |
| Machines | ⚙️ |
| Bands | 🔗 |
| Bodyweight | 🧍 |

**Notes:** Multi-select grid (2 columns). All start selected — user deselects what they lack. At least one must remain selected. Bodyweight cannot be deselected.

---

## Screen 4: Schedule (Step 4 of 4)

**Headline:**
> When can you train?

### Part 1: Training days

**Day toggles:** Mon / Tue / Wed / Thu / Fri / Sat / Sun

**Feedback (shown dynamically based on selection):**

| Condition | Message |
|---|---|
| 0–2 days selected | Select at least 3 days to build an effective program. |
| 3 days, consecutive | Good foundation. Consider spacing your days for better recovery. |
| 3 days, spaced | Solid 3-day split. Enough recovery between sessions. |
| 4 days | Strong schedule. Kine will balance push, pull, and legs across your week. |
| 5 days | Committed schedule. Kine will manage volume carefully to avoid overtraining. |
| 6–7 days | That's ambitious. Kine will auto-manage recovery days and deload when needed. |

### Part 2: Session length

**Subtext:**
> How long is a typical session?

| Option | Label | Time |
|---|---|---|
| Short | Quick & focused | Under 45 min |
| Medium | Standard session | 45–60 min |
| Long | Full session | 60–90 min |
| Extended | Long session | 90+ min |

**Notes:** Both parts required. Day selection affects program structure significantly.

---

## Screen 5: Cycle (Unnumbered)

**Headline:**
> How does your body work across the month?

**Subtext:**
> Hormones affect how you recover, how strong you feel, and when to push hard. Kine uses this quietly — it shapes your program, not your identity.

### Options

| Option | Label |
|---|---|
| Regular | I have a regular cycle |
| Irregular | My cycle is irregular |
| Hormonal | I'm on hormonal contraception |
| Perimenopause | I'm in perimenopause |
| N/A | This doesn't apply to me |

**If "Regular" is selected:**
> When did your last period start?
> (Date picker appears)

**Skip button:** Skip for now

**Notes:** This is deliberately unnumbered — it's presented as optional context, not a required step. The subtext is critical: "shapes your program, not your identity." Cycle data is never displayed prominently in the app.

---

## Screen 6: Health Conditions (Unnumbered, Skippable)

**Headline:**
> Anything we should know about?

**Subtext:**
> Some conditions affect how your body responds to training. Kine adapts silently — your programme just works differently. Nothing changes how you're treated.

### Options

| Condition | Description |
|---|---|
| PCOS | Polycystic ovary syndrome |
| Fibroids | Uterine fibroids |
| Endometriosis | Endometriosis |
| Pelvic floor | Pelvic floor dysfunction |

**Skip button:** Skip — nothing applies

**Notes:** Multi-select. Skippable. The subtext is critical: "adapts silently" and "nothing changes how you're treated." These conditions are treated as programming context, not modes or identities. The programme adapts through existing systems (exercise swaps, warmup mods, breathing cue overrides, AI prompt context) without surfacing condition labels in session UI. See `condition-context.ts` and `injury-swaps.ts` (CONDITION_SWAPS) for implementation.

---

## Screen 7: Injuries (Unnumbered)

**Headline:**
> Anything to work around?

**Subtext:**
> Kine programs around limitations, not through them. Select anything relevant — or skip if you're good to go.

### Options

| Injury/Limitation |
|---|
| Knees |
| Lower back |
| Shoulder |
| Wrist |
| Hip |
| Neck |
| Ankle / foot |
| Postpartum |
| Chronic pain |
| Limited mobility |

**Free text field:**
> Anything else we should know? (optional)

**CTA options:**
- "Build my program →" (if any selected)
- "Skip — I'm good to go" (if none selected)

**Notes:** Multi-select. Free text is optional. "Postpartum" is listed as a limitation alongside physical injuries — this is intentional and important for the target audience.

---

## Screen 8: Summary (Review & Confirm)

**Headline:**
> Your program

**Program card displays:**
- Program name (mapped from goal + experience, e.g., "Foundations — Muscle")
- Days per week
- Session duration
- Equipment list
- Injuries (if any)
- Cycle awareness status

### Editable sections

**Per-day durations:**
> Adjust time per day (optional)
> Each training day shows a dropdown with minute options.

**Current lifts (optional):**
> Got any numbers to start with?
> Subtext: "These help Kine calibrate your starting weights. Skip if you're not sure — Kine will figure it out."

Lift fields vary by equipment:
- Barbell users: Back Squat, Deadlift, Bench Press, Overhead Press
- Dumbbell-only: Goblet Squat, DB RDL, DB Bench Press, DB Shoulder Press

**Start date:**
> When do you want to start?
> Options: "Today" / "Next Monday"

**CTA:** Start Week 1 →

**Notes:** This is the final review screen. The program card gives users confidence that their selections were understood. Lift inputs are explicitly optional — "Kine will figure it out" removes pressure.

---

## Voice and tone guidelines

| Do | Don't |
|---|---|
| Use plain language | Use jargon (RPE, 1RM, periodisation in user-facing copy) |
| Be direct and warm | Be clinical or overly casual |
| Explain the "why" | Assume knowledge |
| Frame cycle as context, not identity | Make cycle the headline feature |
| Present injuries as "working around" | Frame injuries as limitations to training |
| Keep each screen to one purpose | Combine decisions on a single screen |
| Make optional things feel optional | Gate progress behind optional inputs |

---

*This document reflects the onboarding flow as of March 2026. Update this doc when copy changes are made in code.*
