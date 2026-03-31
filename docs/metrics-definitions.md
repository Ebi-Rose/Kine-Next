# Metrics Definitions

Define what we measure and how, before we have data — so we're not retrofitting definitions to look good.

---

## Core Business Metrics

### Monthly Recurring Revenue (MRR)
- **Definition:** Sum of all active subscription revenue normalised to monthly
- **Calculation:** (Monthly subscribers × £29.99) + (Yearly subscribers × £25.00)
- **Source:** Stripe dashboard
- **Cadence:** Weekly check

### Active Subscribers
- **Definition:** Users with a valid, non-cancelled subscription
- **Includes:** Users in their billing period after cancellation (access continues until period end)
- **Excludes:** Users in 14-day refund window who haven't used the app
- **Source:** Supabase subscriptions table

### Monthly Churn Rate
- **Definition:** Percentage of subscribers who cancel in a given month
- **Calculation:** (Cancellations in month / Active subscribers at start of month) × 100
- **Target:** <5% (industry average for fitness is 8-12%)
- **Note:** Count cancellation at the date they cancel, not when access expires

### Lifetime Value (LTV)
- **Definition:** Average total revenue per subscriber over their lifetime
- **Calculation:** ARPU / Monthly churn rate
- **Target:** £300+ (~11 months at blended ARPU)

### Customer Acquisition Cost (CAC)
- **Definition:** Total marketing spend / New subscribers acquired
- **Target:** <£50 (LTV:CAC ratio of 6:1+)
- **Note:** Track by channel when possible (organic, paid, referral)

---

## Engagement Metrics

### Active User
- **Definition:** A subscriber who logged at least one session in the past 7 days
- **Why 7 days:** Most users train 3-5 days/week. 7 days captures a full training cycle.
- **Not:** "Opened the app" — that doesn't indicate real use

### Weekly Active Rate
- **Definition:** Active users / Total active subscribers × 100
- **Target:** >70%
- **Cadence:** Weekly

### Sessions Per User Per Week
- **Definition:** Average number of completed sessions per active user per week
- **Calculation:** Total sessions logged in week / Active users in week
- **Target:** 3-4 (matching typical training frequency)
- **Note:** A "completed session" = at least 1 exercise with logged sets

### Program Generation Rate
- **Definition:** How many users generate a new program per week
- **Why it matters:** If users stop generating, they're either:
  - Using custom builder (fine)
  - Not training (churn risk)
  - Repeating old programs (feature gap)

### Feature Adoption

Track percentage of active users using each feature:

| Feature | Measurement |
|---|---|
| Cycle tracking | % of users with cycle type ≠ "not applicable" |
| Exercise swap | % of sessions with at least one swap |
| Skill paths | % of users who've created a skill path |
| Custom builder | % of users who've built a custom session |
| Warm-up engine | % of sessions where warm-up was used |
| Exercise education | % of sessions where education was opened |

---

## Retention Metrics

### Week 1 Retention
- **Definition:** % of new subscribers who log at least 1 session in their first week
- **Target:** >80%
- **Why it matters:** If they don't train in week 1, they almost certainly churn

### Week 4 Retention
- **Definition:** % of new subscribers still active (logged a session) in week 4
- **Target:** >60%

### Week 12 Retention
- **Definition:** % of new subscribers still active at 12 weeks
- **Target:** >40%
- **Why it matters:** If someone makes it 3 months, they're likely a long-term user

### Onboarding Completion Rate
- **Definition:** % of users who start onboarding and complete all 6 steps
- **Target:** >90%
- **Track drop-off:** Which step do people abandon on?

### Time to First Session
- **Definition:** Time between completing onboarding and logging their first session
- **Target:** <24 hours
- **Why it matters:** Faster = more engaged = more likely to retain

---

## Quality Metrics

### AI Program Quality
Harder to measure quantitatively. Proxy indicators:

| Indicator | Good Sign | Bad Sign |
|---|---|---|
| Exercise swap rate | <15% of exercises swapped | >30% swapped (program doesn't fit) |
| Session completion rate | >85% of started sessions completed | <70% (too hard, too long, bad exercises) |
| Regeneration rate | Users don't regenerate | Users regenerate >2x/week (unhappy with output) |

### Support Ticket Volume
- **Target:** <2% of active users per month
- **Track by category:** billing, programming quality, technical issues, feature requests
- **Trend matters more than absolute number**

### App Performance
- **Initial load time:** <3 seconds on 4G
- **AI generation time:** <15 seconds for weekly program
- **Offline reliability:** 100% of sessions saveable offline

---

## What We Don't Measure (Intentionally)

| Metric | Why We Skip It |
|---|---|
| Daily Active Users (DAU) | Training isn't daily. DAU would misrepresent engagement. |
| Time in app | We want efficient sessions, not screen time. More time ≠ better. |
| Streak length | Principle 14. Streaks create anxiety. We don't track or display them. |
| Social sharing | Principle 3. No social features, nothing to share. |
| NPS | Too blunt for a small user base. Direct conversations are more valuable. |
| Body measurements | Principle 12. We don't collect or track body metrics beyond weight. |

---

## Reporting Cadence

| Metric | Frequency | Owner |
|---|---|---|
| MRR, subscribers, churn | Weekly | Founder |
| Active users, sessions/week | Weekly | Founder |
| Retention cohorts | Monthly | Founder |
| Feature adoption | Monthly | Founder |
| AI quality proxies | Monthly | Founder |
| Support volume by category | Monthly | Founder |
| Full business review | Quarterly | Founder |

---

## Implementation Priority

1. **Now:** MRR, active subscribers, churn (Stripe + Supabase queries)
2. **At launch:** Weekly active rate, sessions/week, onboarding completion
3. **Month 2:** Retention cohorts, feature adoption, AI quality proxies
4. **Month 3+:** Full dashboard with trends
