# Onboarding Copy Deck

Every word users see during the 6-step onboarding flow. This is the reviewable reference — code implementation should match exactly.

---

## Pre-Onboarding

**Screen:** Welcome / first load after signup

**Heading:** "Let's build your program"
**Subtext:** "6 quick questions so Kinē can generate your first week of training."
**CTA:** "Let's go"

---

## Step 1 of 6 — Goal

**Progress:** ●○○○○○

**Heading:** "What's your main goal?"
**Subtext:** "This shapes your programming — exercise selection, volume, and intensity."

**Options:**
| Option | Label | Description |
|---|---|---|
| 1 | **Build strength** | "Lift heavier. Focus on compound movements and progressive overload." |
| 2 | **Build muscle** | "More volume, more variety. Hypertrophy-focused programming." |
| 3 | **General fitness** | "Balanced strength and conditioning. A bit of everything, done well." |

**CTA:** "Next"

---

## Step 2 of 6 — Experience

**Progress:** ●●○○○○

**Heading:** "How long have you been training?"
**Subtext:** "Be honest — this calibrates your starting point, not your ceiling."

**Options:**
| Option | Label | Description |
|---|---|---|
| 1 | **New** | "Less than 6 months of consistent training." |
| 2 | **Developing** | "6 months to 2 years. You know the basics." |
| 3 | **Intermediate** | "2+ years. Comfortable with compound lifts and programming concepts." |

**CTA:** "Next"

---

## Step 3 of 6 — Equipment

**Progress:** ●●●○○○

**Heading:** "What equipment do you have access to?"
**Subtext:** "Select everything available to you. Your program only uses what you have."

**Options (multi-select):**
| Equipment | Icon |
|---|---|
| Barbell | 🏋️ |
| Dumbbells | 💪 |
| Machines | ⚙️ |
| Bodyweight only | 🤸 |
| Kettlebells | 🔔 |
| Resistance bands | 🔗 |

**Note:** If user selects "Bodyweight only," other options are deselected (and vice versa).

**CTA:** "Next"

---

## Step 4 of 6 — Schedule

**Progress:** ●●●●○○

**Heading:** "How many days per week can you train?"
**Subtext:** "Pick the days that work for you. The AI will space your sessions for recovery."

**Selector:** Day picker (Mon–Sun), tap to toggle

**Contextual warnings (appear below based on selection):**

| Condition | Warning |
|---|---|
| 1 day selected | "One session per week is a start — the program will make it count." |
| 2 days, consecutive | "Consider spacing your days for better recovery." |
| 5+ days selected | "Ambitious — make sure you're recovering enough between sessions." |
| 6-7 days, new experience | "At your experience level, 3-4 days might be more sustainable. You can always add more later." |
| 3 consecutive days | "Three days in a row is tough on recovery. Can you space any of them out?" |

**CTA:** "Next"

---

## Step 5 of 6 — Duration

**Progress:** ●●●●●○

**Heading:** "How long are your sessions?"
**Subtext:** "You can set this per day if your schedule varies."

**Options (per day or global):**
| Option | Label |
|---|---|
| 1 | Under 45 min |
| 2 | 45–60 min |
| 3 | 60–90 min |
| 4 | 90+ min |

**Contextual warnings:**

| Condition | Warning |
|---|---|
| Under 45 min + 1 day/week | "With limited time and frequency, sessions will be focused and efficient." |
| 90+ min + 5+ days | "That's a lot of training volume. The program will manage intensity carefully." |

**Toggle:** "Same duration for all days" / "Set per day"

**CTA:** "Next"

---

## Step 6 of 6 — Injuries & Limitations

**Progress:** ●●●●●●

**Heading:** "Any injuries or limitations?"
**Subtext:** "The AI will work around these — selecting exercises that are safe for you."

**Options (multi-select):**
| Limitation |
|---|
| Bad knees |
| Lower back |
| Shoulder |
| Wrist |
| Hip |
| Neck |
| Ankle |
| Postpartum |
| Chronic pain |
| Limited mobility |

**Free-form field:** "Anything else we should know?"
**Placeholder:** "e.g., recovering from ACL surgery, can't do overhead pressing"

**Pregnancy notice:**
"If you are currently pregnant, please consult your healthcare provider before starting any training program. Kinē can accommodate postpartum recovery but is not designed for prenatal programming."

**CTA:** "Generate my program"

---

## Post-Onboarding

**Screen:** Loading state while AI generates first program

**Heading:** "Building your program..."
**Subtext:** "This takes about 10 seconds. We're designing your first week based on everything you told us."

**Completion:**
**Heading:** "Your first week is ready"
**Subtext:** "Review your sessions and start training whenever you're ready."
**CTA:** "See your program"

---

## Copy Review Checklist

- [ ] Every screen has one singular purpose (Principle 4)
- [ ] No guilt or performative language (Principle 7)
- [ ] Experience descriptions don't imply judgment (Principle 2)
- [ ] Equipment selection is empowering, not limiting (Principle 18)
- [ ] Injury section treats limitations as constraints, not disqualifiers (Principle 19)
- [ ] All warnings are helpful, not alarming
- [ ] CTA buttons are clear and action-oriented
- [ ] Progress indicator is visible throughout
