# E2E Test Script — Week Display Fix

**Bug:** Header shows "Week 1" when the user is actually on week 8.  
**Fix:** Current week view now reads from `progressDB.currentWeek` instead of the stored `_weekNum` on the built week data.

---

## Prerequisites

- App running locally (`npm run dev` or equivalent)
- Access to Dev Tools panel (bottom of `/app` page)

---

## Test 1: Fresh onboarding — week starts at 1

1. Open Dev Tools panel → click **Reset ALL data** (or clear `kine_v2` from localStorage)
2. Complete onboarding flow
3. Build Week 1
4. **Verify:** Header shows **"Week 1 · {date range}"**
5. **Verify:** Phase badge shows **"Accumulation · Week 1/3"**

**Pass criteria:** Week number is 1 everywhere.

---

## Test 2: Advance week via Dev Tools — header updates

1. From the Week 1 view, scroll to bottom → open **Dev tools**
2. Click **Advance to Week 2** (this increments `currentWeek` and clears week data)
3. Click **Build Week 2**
4. **Verify:** Header shows **"Week 2 · {date range}"**
5. **Verify:** Phase badge updates accordingly (Accumulation · Week 2/3)
6. Repeat: advance to Week 3, build, verify header says **"Week 3"**

**Pass criteria:** Header week number matches `currentWeek` after each advance.

---

## Test 3: Simulate high week number (the original bug scenario)

1. Open Dev Tools → click **Simulate Perfect Week** to log sessions
2. Advance week repeatedly until you reach **Week 8** (or higher)
3. Build the week
4. **Verify:** Header shows **"Week 8 · {date range}"** (NOT "Week 1")
5. **Verify:** Profile panel (`/app/profile`) badge shows **"Week 8"**
6. **Verify:** Progress page (`/app/progress`) stat card shows **"Week 8"**

**Pass criteria:** Week 8 displays consistently across all pages. No fallback to 1.

---

## Test 4: Past week navigation — correct numbers

1. From Week 8, you should have week history from earlier advances
2. Click the **‹** arrow to navigate to a past week
3. **Verify:** Header shows the past week's number (e.g., "Week 7")
4. **Verify:** Banner shows **"Viewing Week 7 · read-only"**
5. Click **‹** again to go further back
6. **Verify:** Week number decrements correctly for each past week
7. Click **Current →** button to return
8. **Verify:** Header returns to **"Week 8 · {date range}"**

**Pass criteria:** Past weeks show their stored `_weekNum`, current week shows live `currentWeek`.

---

## Test 5: Week completion — correct week in celebration

1. On the current week, use Dev Tools → **Simulate Perfect Week** to complete all sessions
2. **Verify:** Completion message shows **"Week {N} complete"** with the correct number
3. **Verify:** "Up next" section shows **"Week {N+1}"**
4. **Verify:** "Build Week {N+1}" button shows the correct next number

**Pass criteria:** Completion and next-week numbers are consistent with the header.

---

## Test 6: Pre-session and week check-in pages

1. Navigate to `/app/pre-session` (start a session)
2. **Verify:** Session header shows **"Week {N}"** matching the main page
3. Go back, navigate to `/app/week-checkin`
4. **Verify:** Page title shows **"Week {N} review"**

**Pass criteria:** Week number is consistent across all pages.

---

## Test 7: Build week without advancing — no stale _weekNum

1. On any week (e.g., Week 5), use Dev Tools → **Rebuild** the current week
2. **Verify:** Header still shows **"Week 5"** (not reset to 1)
3. Refresh the page
4. **Verify:** Header still shows **"Week 5"**

**Pass criteria:** Rebuilding does not cause the week number to change.

---

## Test 8: localStorage persistence

1. Note the current week number (e.g., Week 6)
2. Close the browser tab entirely
3. Reopen `/app`
4. **Verify:** Header shows **"Week 6"** (persisted from store)

**Pass criteria:** Week number survives page reload and tab close.

---

## Summary Checklist

| # | Test | Status |
|---|------|--------|
| 1 | Fresh onboarding shows Week 1 | |
| 2 | Advancing weeks updates header | |
| 3 | High week number (Week 8+) displays correctly | |
| 4 | Past week navigation shows correct numbers | |
| 5 | Week completion shows correct week | |
| 6 | Pre-session and check-in pages consistent | |
| 7 | Rebuilding doesn't reset week number | |
| 8 | localStorage persistence works | |
