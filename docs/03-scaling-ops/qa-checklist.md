# QA Checklist

What to verify before each release. Not every item applies to every deploy — check what's relevant to the change.

## Core Flows

### Authentication
- [ ] Can sign up with new email (magic link)
- [ ] Can log in with existing account
- [ ] Session persists after closing and reopening browser
- [ ] Logged-out users are redirected to login
- [ ] Subscription status is correctly reflected after login

### Onboarding
- [ ] All 6 steps render correctly
- [ ] Can progress through and complete onboarding
- [ ] Selections persist across steps (going back doesn't reset)
- [ ] Schedule warnings appear for edge cases (7 days, 1 day, consecutive days)
- [ ] Duration per day matches selected duration
- [ ] Injury multi-select works (including free-form notes)
- [ ] Completing onboarding triggers first program generation

### Program Generation (AI)
- [ ] Weekly program generates successfully
- [ ] All exercises in program exist in the exercise library
- [ ] Injury constraints are respected (no excluded exercises)
- [ ] Equipment constraints are respected
- [ ] Session count matches schedule
- [ ] Session duration is within user's specified range
- [ ] Cycle phase is reflected in programming (if tracked)

### Session Logging
- [ ] Can start a session
- [ ] Can log sets (weight, reps)
- [ ] Rest timer works
- [ ] Can swap an exercise mid-session
- [ ] Can complete a session
- [ ] Session saves to localStorage
- [ ] Session syncs to Supabase (when online)
- [ ] PR detection works when a new record is set

### Exercise Features
- [ ] Exercise education opens (tap exercise name)
- [ ] Exercise swap returns valid alternatives
- [ ] Swapped exercise respects constraints
- [ ] Exercise illustrations/videos load

### Cycle Tracking
- [ ] Can log a period start date
- [ ] Phase calculation is correct (check against expected dates)
- [ ] Cycle pill shows correct day and phase
- [ ] Duplicate logging within 5 days is handled
- [ ] Switching cycle type updates behaviour
- [ ] "Not applicable" disables cycle-related UI

### Billing
- [ ] Checkout flow works (use Stripe test mode)
- [ ] Successful payment activates subscription
- [ ] Billing portal opens from profile
- [ ] Cancellation works and access continues until period end
- [ ] Webhook processes correctly:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_failed`

### Offline / PWA
- [ ] App loads when offline (after first visit)
- [ ] Can log a full session offline
- [ ] Data syncs correctly when reconnecting
- [ ] Service worker is registered and active
- [ ] "Install" prompt works on supported browsers

## Visual / UI

- [ ] No layout breaks on mobile (375px width)
- [ ] No layout breaks on tablet (768px)
- [ ] No layout breaks on desktop (1280px+)
- [ ] Dark theme renders correctly (it's the only theme)
- [ ] Accent colour (#C49098) is consistent
- [ ] Bebas Neue loads for headings
- [ ] DM Sans loads for body text
- [ ] Modals/drawers open and close correctly
- [ ] Scroll behaviour is smooth (no janky reflows)

## Performance

- [ ] Initial load < 3 seconds on 4G connection
- [ ] No console errors in production build
- [ ] No memory leaks during session logging (check heap in dev tools)
- [ ] API rate limiting works (10 req/60s)

## Data Integrity

- [ ] New user starts with empty state (no stale data)
- [ ] Deleting cycle data doesn't affect training data
- [ ] Profile changes trigger program re-evaluation
- [ ] Multiple browser tabs don't corrupt data

## Security

- [ ] No API keys exposed in client-side code
- [ ] Supabase RLS policies enforced (user can't access other users' data)
- [ ] Stripe webhook signature verification is active
- [ ] Rate limiting is functional
- [ ] Auth tokens expire appropriately

## Regression Hotspots

These areas have broken before — double-check when touching related code:
- [ ] Webhook Supabase upserts (subscription status)
- [ ] Login routing (race condition between auth and navigation)
- [ ] Checkout user retrieval (cached vs fetched auth user)
- [ ] Offline sync after extended offline periods
