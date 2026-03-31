# AI Prompt Registry

Documentation of every Claude API call in Kinē. This is core IP — treat it as such.

## Overview

| # | Feature | Model | Purpose | Avg. Cost |
|---|---|---|---|---|
| 1 | Week Builder | Sonnet (Haiku fallback) | Generate complete weekly program | ~£0.03-0.05 |
| 2 | Exercise Swap | Sonnet | Suggest alternative exercise | ~£0.01-0.02 |
| 3 | Skill Path | Sonnet | Create exercise progression chain | ~£0.02-0.03 |
| 4 | Session Feedback | Sonnet | Analyse post-session performance | ~£0.01-0.02 |
| 5 | Custom Builder | Sonnet | Assist manual program creation | ~£0.02-0.03 |
| 6 | Periodisation | Sonnet | Structure multi-week training blocks | ~£0.03-0.05 |
| 7 | Week Check-in | Sonnet | Adjust next week based on performance | ~£0.02-0.03 |

**Total per heavy user per week:** ~£0.15-0.25
**Total per heavy user per month:** ~£0.60-1.00

## API Configuration

- **Endpoint:** `/api/chat` (Next.js API route)
- **Primary model:** `claude-sonnet-4-20250514`
- **Fallback model:** `claude-haiku-4-5-20251001`
- **Rate limit:** 10 requests per 60 seconds per authenticated user
- **Streaming:** SSE for progressive UI updates
- **Max tokens:** Varies by feature (1024-4096)

---

## 1. Week Builder

**File:** `src/lib/week-builder.ts`
**Purpose:** Generate a complete weekly training program as structured JSON.

### Input Context
- Goal (strength / muscle / general fitness)
- Experience level (new / developing / intermediate)
- Available equipment (barbell, dumbbells, machines, bodyweight, kettlebells, bands)
- Schedule (which days, how many per week)
- Session duration per day
- Injuries / limitations
- Current cycle phase (if tracked)
- Recent lift data (weights, performance trends)
- Bodyweight

### Output Format
Structured JSON containing:
- Sessions per day (exercise name, sets, reps, weight suggestion, rest period)
- Session focus labels (e.g., "Lower Body — Quad Focus")
- Progressive overload cues (when to increase weight)
- Recovery notes

### Key System Prompt Elements
- Women's physiology emphasis: posterior chain (glutes, hamstrings, upper back) as priority
- Higher volume tolerance at lower relative intensities
- Cycle-phase-aware intensity modulation
- Equipment constraint enforcement
- Injury avoidance (exercises to exclude)

### Pre-Generation: Prompt Constraints
- **Exercise pool filtering:** The full exercise library is filtered by user's equipment and experience level, grouped by muscle group, and injected into the prompt as "EXERCISE POOL — only use exercises from this list"
- **Injury avoidance list:** All exercises flagged in `INJURY_SWAPS` for the user's reported injuries are injected as "INJURY — DO NOT USE THESE EXERCISES"
- **Exact naming instruction:** AI is told to use exact exercise names from the pool (not generic names)

### Post-Generation: Validation Layer
**File:** `src/lib/week-validation.ts`

After AI generates a week, `validateWeek()` runs the following checks and auto-repairs:
1. **Exercise name validation** — case-insensitive match, fuzzy matching via 60+ aliases, removes unknown exercises
2. **Equipment compatibility** — swaps exercises to same-muscle-group alternatives if user lacks required equipment
3. **Injury conflict detection** — applies `INJURY_SWAPS` with equipment-aware fallback chains
4. **Duplicate removal** — removes duplicate exercises within a session
5. **Exercise count check** — flags if significantly off from expected count
6. **Structural validation** — 7 days, day numbers 1-7, training days have exercises, rest days don't

### Failure Modes
- **Timeout:** Large programs with many constraints can be slow → fallback to Haiku
- **Invalid JSON:** AI occasionally outputs malformed JSON → parse with error handling, retry once
- **Exercise not in library:** Caught by validation layer → fuzzy match or remove
- **Ignoring constraints:** Caught by validation layer → auto-swap or remove conflicting exercises
- **All exercises removed by validation:** Falls back to deterministic `buildFallbackWeek()` using `WEEKLY_SPLITS` templates

### Quality Checks
- All exercises must exist in the exercise library (enforced by validation layer)
- No excluded exercises appear — injury/equipment constraints (enforced by validation layer)
- Total volume matches experience level expectations
- Session duration is within user's specified range

---

## 2. Exercise Swap

**File:** `src/components/ExerciseSwapSheet.tsx` + `src/lib/injury-swaps.ts`
**Purpose:** Suggest an alternative exercise when user can't/doesn't want to do the prescribed one.

### Input
- Exercise being replaced
- Reason for swap (if given)
- User's equipment
- User's injuries
- Session context (what other exercises are in the session)

### Output
- 2-3 alternative exercises with brief rationale
- Same muscle group / movement pattern
- Respects constraints

### Failure Modes
- Suggests an exercise user also can't do → validate against constraints
- Suggests duplicate of another exercise in session → check session context

---

## 3. Skill Path

**File:** `src/components/SkillPathSheet.tsx` + `src/data/skill-paths.ts`
**Purpose:** Create a progression chain for learning a complex exercise.

### Input
- Target exercise (e.g., pull-up, pistol squat)
- User's current level
- Available equipment

### Output
- Ordered list of progressions from current ability to target
- Each step has criteria for moving to the next

---

## 4. Session Feedback

**File:** `src/lib/session-analysis.ts`
**Purpose:** Analyse completed session data and provide brief coaching insight.

### Input
- Completed session data (exercises, sets, reps, weights)
- Comparison to prescribed program
- User profile context

### Output
- Brief natural language feedback (2-3 sentences)
- Pattern observations (e.g., "You've been increasing bench press consistently")
- Subtle adjustment suggestions

---

## 5. Custom Builder

**File:** `src/app/app/custom-builder/page.tsx`
**Purpose:** Help user build their own program with AI assistance.

### Input
- User's desired focus / goal for the session
- Equipment
- Time available
- Any specific exercises they want to include

### Output
- Suggested session structure
- Exercise recommendations to fill gaps
- Set/rep scheme suggestions

---

## 6. Periodisation

**File:** `src/lib/periodisation.ts`
**Purpose:** Structure training across multiple weeks (mesocycle planning).

### Input
- User profile (all standard context)
- Current training phase
- Recent performance data
- Upcoming schedule constraints

### Output
- Multi-week block structure
- Volume/intensity progression across weeks
- Deload timing (autoregulated based on performance signals)
- Phase labels (accumulation, intensification, deload)

---

## 7. Week Check-in

**File:** `src/app/app/week-checkin/page.tsx`
**Purpose:** Adjust the upcoming week based on how the previous week went.

### Input
- Previous week's completed sessions
- Adherence (which sessions were completed/skipped)
- Performance vs prescription (did they hit targets?)
- User's subjective feedback (if provided)
- Current cycle phase

### Output
- Adjustment recommendations for next week
- Volume/intensity modifications
- Schedule adjustments if needed

---

## Prompt Engineering Guidelines

### Do
- Include all relevant user context in the system prompt
- Specify the exact JSON output format expected
- Include constraint enforcement instructions explicitly
- Use streaming for any generation that takes >2 seconds
- Validate AI output before displaying to user
- **Sanitise user-supplied text** before inserting into prompts (see below)

### Don't
- Send PII (name, email) to the API
- Trust AI output without validation
- Allow unlimited retries on failure (max 2 retries)
- Cache programs indefinitely (regenerate weekly)
- Insert raw user text into prompts without sanitisation

### User Input Sanitisation

User-supplied text (injury notes, week feedback notes) is wrapped in `<user_notes>` tags in prompts. The system prompt instructs Claude to treat this as data, not instructions. However, a user could include `</user_notes>` to escape the boundary and inject prompt instructions.

**Defence:** `sanitiseUserNotes()` in `src/lib/week-builder.ts` strips `<user_notes>` and `</user_notes>` tags from all user text before prompt insertion. This is applied to:
- Injury notes (free-text injury description)
- Week check-in notes (free-text feedback)

Any new prompt that accepts user-supplied text must use this function.

### Cost Monitoring
- Track API costs in Anthropic Console weekly
- Set billing alerts for unusual spikes
- If costs exceed £X/month, investigate:
  - Are users generating excessively? (Rate limit should prevent)
  - Is there an infinite retry loop?
  - Has a prompt grown too large? (Optimise context)
