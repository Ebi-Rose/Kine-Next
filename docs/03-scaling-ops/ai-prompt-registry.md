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

- **Endpoint:** `/api/chat` (Vercel serverless function)
- **Primary model:** `claude-sonnet-4-20250514`
- **Fallback model:** `claude-haiku-4-5-20251001`
- **Rate limit:** 10 requests per 60 seconds per IP
- **Streaming:** SSE for progressive UI updates
- **Max tokens:** Varies by feature (1024-4096)

---

## 1. Week Builder

**File:** `src/features/week/week-builder.js`
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

### Failure Modes
- **Timeout:** Large programs with many constraints can be slow → fallback to Haiku
- **Invalid JSON:** AI occasionally outputs malformed JSON → parse with error handling, retry once
- **Exercise not in library:** AI may suggest exercises outside the 188-exercise library → validate and substitute
- **Ignoring constraints:** Rare but possible for injuries → post-generation validation layer

### Quality Checks
- All exercises must exist in the exercise library
- No excluded exercises appear (injury/equipment constraints)
- Total volume matches experience level expectations
- Session duration is within user's specified range

---

## 2. Exercise Swap

**File:** `src/features/exercise-swap/swap.js`
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

**File:** `src/features/skill-path/skill-path.js`
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

**File:** `src/features/session/session-feedback.js`
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

**File:** `src/features/custom-builder/custom-builder.js`
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

**File:** `src/features/periodisation/periodisation.js`
**Purpose:** Structure training across multiple weeks (mesocycle planning).

### Input
- User profile (all standard context)
- Current training phase
- Recent performance data
- Upcoming schedule constraints

### Output
- Multi-week block structure (e.g., 4-week mesocycle)
- Volume/intensity progression across weeks
- Deload timing
- Phase labels (accumulation, intensification, deload)

---

## 7. Week Check-in

**File:** `src/features/week-checkin/week-checkin.js`
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

### Don't
- Send PII (name, email) to the API
- Trust AI output without validation
- Allow unlimited retries on failure (max 2 retries)
- Cache programs indefinitely (regenerate weekly)

### Cost Monitoring
- Track API costs in Anthropic Console weekly
- Set billing alerts for unusual spikes
- If costs exceed £X/month, investigate:
  - Are users generating excessively? (Rate limit should prevent)
  - Is there an infinite retry loop?
  - Has a prompt grown too large? (Optimise context)
