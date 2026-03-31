# Feature Spec Template

Use this template for any non-trivial feature. Forces clarity on scope before building.

---

## [Feature Name]

**Author:** [Name]
**Date:** [Date]
**Status:** Draft / In Review / Approved / Building / Shipped

---

### Problem
_What user problem does this solve? Be specific. Include evidence (user feedback, data, observation)._

[Write 2-3 sentences. Link to support tickets, user quotes, or analytics if available.]

### Principles Check
_Which Kinē principles does this feature align with? Does it conflict with any?_

- **Aligns with:** [List relevant principles]
- **Potential conflict:** [Any principles this might tension against, and how you resolve it]

### Solution
_What are we building? Describe the user experience, not the implementation._

[Write from the user's perspective. "When the user does X, they see Y, which allows them to Z."]

### Scope

**In scope:**
- [Specific thing 1]
- [Specific thing 2]
- [Specific thing 3]

**Out of scope:**
- [Thing we're deliberately not doing]
- [Thing that could be a follow-up]

### Design

_Rough description or mockup of the UI. Doesn't need to be pixel-perfect._

[Text description, ASCII mockup, or link to a mockup file]

### Technical Approach
_How will this be built? Key decisions, data model changes, API changes._

- **Frontend:** [Components to create/modify]
- **Backend:** [API routes, database changes]
- **AI:** [Any Claude API changes]
- **Data model:** [New tables, columns, or localStorage changes]

### Edge Cases
_What could go wrong or be weird?_

- [Edge case 1 — how we handle it]
- [Edge case 2 — how we handle it]
- [Edge case 3 — how we handle it]

### Success Criteria
_How do we know this worked? Be specific and measurable._

- [ ] [Criterion 1 — e.g., "80% of users who see this feature use it within 2 weeks"]
- [ ] [Criterion 2 — e.g., "Support tickets about X decrease by 50%"]
- [ ] [Criterion 3 — e.g., "No increase in session abandonment rate"]

### QA Checklist
_What specifically needs to be tested before shipping?_

- [ ] [Test case 1]
- [ ] [Test case 2]
- [ ] [Test case 3]
- [ ] Tested on mobile (375px)
- [ ] Tested offline
- [ ] No console errors

### Rollback Plan
_If this goes wrong after shipping, what do we do?_

[e.g., "Feature is behind a flag — disable via env var. No data migration needed."]

---

## Example: Exercise Swap Improvement

**Problem:** Users report that exercise swaps sometimes suggest exercises they also can't do (e.g., swapping a barbell exercise for another barbell exercise when user has no barbell).

**Principles check:**
- Aligns with: Equipment Reality (18), Injuries Are Constraints (19)
- No conflicts

**Solution:** When generating swap suggestions, explicitly pass the full equipment and injury constraint list to the AI prompt. Add a post-generation validation step that checks the suggestion against the user's equipment list.

**In scope:**
- Update swap prompt to include full constraints
- Add validation layer for swap suggestions
- Show error + retry if validation fails

**Out of scope:**
- Changing the swap UI
- Adding user feedback on swap quality (follow-up)

**Success criteria:**
- [ ] Zero swap suggestions that violate equipment constraints (from manual testing of 50 swaps)
- [ ] Swap generation time stays under 5 seconds
- [ ] No increase in swap API errors
