# Changelog

What's new in Kinē. Updated with each release.

Format: most recent first. Keep it human-readable — users read this, not developers.

---

## [DATE] — [VERSION or RELEASE NAME]

### New
- [Feature description — what it does and why it matters to users, in one sentence]

### Improved
- [What got better — be specific about the change]

### Fixed
- [What was broken — describe the symptom users experienced, not the technical cause]

---

## Writing Guidelines

### Tone
- Write for users, not developers
- Lead with the benefit, not the implementation
- One sentence per item — no paragraphs

### Examples

**Good:**
- "Exercise swap now respects your equipment list — no more barbell suggestions when you only have dumbbells."
- "Session logging is faster — sets save instantly instead of waiting for sync."
- "Fixed an issue where cycle phase wasn't updating after logging a period."

**Bad:**
- "Refactored the swap prompt to include equipment constraints in the system context." (too technical)
- "Bug fix." (too vague)
- "AMAZING NEW FEATURE: We've completely revolutionised..." (too much)

### Categories
- **New** — Genuinely new functionality
- **Improved** — Enhancement to existing feature
- **Fixed** — Bug that users noticed or were affected by
- Don't list: internal refactors, developer tooling changes, dependency updates

### What not to include
- Security patches (don't advertise what was vulnerable)
- Changes that don't affect user experience
- Partial features that aren't ready for use

---

## Example Entries

### 15 Apr 2026 — Week 2

**New**
- Per-day session duration: set different durations for different training days instead of one global setting.
- Exercise education: tap any exercise name during your session to see form cues, common mistakes, and video.

**Improved**
- Program generation is ~30% faster thanks to optimised AI prompts.
- Schedule warnings during onboarding are more specific — they now account for consecutive training days.

**Fixed**
- Fixed an issue where logging a period twice within 5 days created a duplicate entry.
- Fixed checkout not completing for some users on Safari.

---

### 8 Apr 2026 — Launch

**New**
- Kinē is live. AI-powered weekly programming, session logging, cycle-aware adjustments, exercise education, and offline support.

---

## Distribution

When a changelog entry is published:
1. Update this document
2. Consider an in-app "What's New" indicator (badge on profile/settings)
3. For major features: email subscribers
4. Update App Store description (when native app launches)
