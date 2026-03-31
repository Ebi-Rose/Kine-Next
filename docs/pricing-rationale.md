# Pricing Rationale

Internal document explaining pricing decisions. Not user-facing.

## Current Pricing

| Plan | Price | Effective Monthly |
|---|---|---|
| Monthly | £29.99/mo | £29.99 |
| Yearly | £300/yr | £25.00 (17% discount) |

14-day money-back guarantee on first purchase.

## Why £29.99/month

### Position in market

| App | Price | What You Get |
|---|---|---|
| Hevy Free | £0 | Workout logger |
| Hevy Pro | £8/mo | Logger + analytics |
| Strong Pro | £4/mo | Logger |
| JEFIT Elite | £8/mo | Logger + templates |
| Fitbod Premium | £10/mo | Exercise-level AI |
| **Kinē** | **£29.99/mo** | **Full AI programming** |
| Juggernaut AI | £19/mo | AI powerlifting programming |
| Online coach (budget) | £100-150/mo | Human programming |
| Online coach (premium) | £200-400/mo | Human programming + check-ins |

### The logic

1. **We're not a logger.** Loggers are £0-10/month because they're digital notebooks. Kinē generates your entire program — different value proposition, different price.

2. **We're not a coach, but we're coach-adjacent.** A good online coach costs £150-400/month. Kinē does ~80% of the programming work for ~15-20% of the price. That's the value frame.

3. **£29.99 signals quality.** At £10/month, users would expect a logger. At £30, they expect intelligence. The price sets the expectation correctly.

4. **AI costs are real.** Each program generation costs ~£0.02-0.05 in Claude API calls. With 7 AI features and multiple calls per week, a heavy user might cost £2-5/month in API alone. At £10/month, margins collapse.

5. **Small user base = higher ARPU needed.** We're not going for millions of users. A focused product for a specific audience works at higher price with lower volume.

### Yearly discount rationale

- 17% discount (£25/mo vs £29.99) is enough to be meaningful without being desperate
- Annual commit improves cash flow and reduces churn
- Round number (£300) feels clean and intentional

## Unit Economics (Target)

| Metric | Target | Notes |
|---|---|---|
| ARPU | ~£27/mo | Blended monthly + yearly |
| API cost/user/mo | £2-5 | Depends on usage (7 AI features) |
| Infrastructure cost/user/mo | ~£0.50 | Supabase, Vercel |
| Gross margin | ~80-85% | Before marketing/support |
| Monthly churn target | <5% | Industry average for fitness is 8-12% |
| LTV target | £300+ | ~11 months average retention needed |
| CAC target | <£50 | Need LTV:CAC ratio of 6:1+ |

## What Would Trigger a Price Change

### Price increase
- API costs rise significantly (Anthropic pricing change)
- Feature set expands substantially (native app, advanced analytics)
- Market validates higher willingness-to-pay

### Price decrease
- Churn is too high at current price (>10% monthly)
- Competitive pressure from a similar women-focused tool
- API costs drop dramatically, enabling lower-margin pricing

### New tier (potential future)
- **Free tier:** Limited features (logger only, no AI) — for funnel
- **Pro tier:** Current offering at £29.99
- **Premium tier:** Priority AI, advanced analytics, export — £49.99

## Competitor Price Sensitivity

- **Fitbod at £10/mo** is the closest comparable (AI-powered), but it's exercise-level, not program-level
- **Juggernaut at £19/mo** is program-level AI, but powerlifting-specific and not women-focused
- **Neither** has cycle awareness or women's physiology foundation

Our unique value justifies the premium. If a direct competitor emerges (women-focused AI programming), we'd compete on quality and depth, not price.

## FAQ (Internal)

**"Why not a free tier?"**
Not yet. Free tiers work for products with viral loops (social, sharing). Kinē is deliberately closed-loop. A free tier would cost in API and infrastructure with no viral growth mechanism. May revisit for funnel purposes.

**"Why not a cheaper entry plan?"**
Every plan must include AI programming — that's the product. A plan without AI is just a logger, and we're not competing as a logger. If we ever do a limited free plan, it'd be for conversion, not revenue.

**"What about student/NHS/discounted pricing?"**
Worth considering post-launch if demand exists. Could offer a 30% discount (£20.99/mo) for verified students. Don't discount so much that it undermines the value frame.
