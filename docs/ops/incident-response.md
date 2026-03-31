# Incident Response Plan

What to do when things break. Written for a solo founder — scale this process as the team grows.

## Severity Levels

| Level | Definition | Response Time | Examples |
|---|---|---|---|
| **P0 — Critical** | App unusable for all users | Immediately | App won't load, auth broken, data loss |
| **P1 — High** | Core feature broken for all users | Within 1 hour | AI generation fails, sessions won't save, billing broken |
| **P2 — Medium** | Feature broken for some users | Within 4 hours | Specific exercise swap fails, cycle calculation wrong |
| **P3 — Low** | Minor issue, workaround exists | Within 24 hours | UI glitch, typo, non-critical analytics wrong |

## Incident Response Steps

### 1. Detect
- User reports via support email
- Vercel error logs spike
- Stripe webhook failures
- You notice it yourself

### 2. Assess Severity
- How many users affected? (All vs some)
- Is data at risk? (Loss, corruption, exposure)
- Is billing affected? (Users being charged incorrectly)
- Is there a workaround?

### 3. Communicate (P0/P1 only)
If users are affected and will notice:
- Post a brief status update: [COMMUNICATION_CHANNEL — e.g., status page, email, in-app banner]
- Template: "We're aware of [brief description] and are working on a fix. Your data is safe. We'll update you shortly."

### 4. Fix

#### AI Generation Down (P1)
1. Check Anthropic status page (status.anthropic.com)
2. Check Vercel function logs for errors
3. If Anthropic is down: fallback to Haiku model (already configured)
4. If our code broke: identify the failing API route, rollback if needed
5. If rate limited: check for abuse, adjust rate limits

#### Auth/Login Broken (P0)
1. Check Supabase status page
2. Check Supabase Dashboard → Auth for errors
3. If Supabase is down: users can't log in, but offline cached data is safe
4. If our code broke: check auth flow, rollback deployment

#### Stripe Webhooks Failing (P1)
1. Check Stripe Dashboard → Developers → Webhooks → Recent deliveries
2. Look for HTTP error codes in failed deliveries
3. Common causes:
   - Webhook secret mismatch (check env var)
   - Function timeout (check Vercel logs)
   - Supabase write failure (check RLS policies)
4. Stripe retries failed webhooks — fix the issue and they'll replay

#### Data Loss / Corruption (P0)
1. Stop the bleeding — if a deployment caused it, rollback immediately
2. Assess scope: which users, which data, what timeframe
3. Restore from Supabase backup if needed
4. Contact affected users directly
5. Post-mortem required

#### Signup/Auth Emails Not Sending (P1)
1. Check Resend dashboard for delivery failures or bounces
2. Check Supabase Auth → SMTP settings (host: `smtp.resend.com`, port: `465`, username: `resend`)
3. Verify Resend API key hasn't been rotated — password in Supabase SMTP must match
4. Check Cloudflare DNS — MX, SPF, DKIM records for `kinefit.app` must be intact
5. If Resend is down: existing logged-in users are unaffected, only new signups and password resets blocked
6. If DNS records removed: re-add from Resend dashboard → Domain → DNS records

#### Session Data Not Syncing (P2)
1. Check Supabase connectivity
2. Check if localStorage has unsynced data (user can check in browser dev tools)
3. If sync code broken: fix and deploy — cached data should sync on next attempt
4. If data was overwritten: check sync conflict resolution logic

### 5. Verify Fix
- Confirm the issue is resolved on production
- Check relevant monitoring (error logs, webhook deliveries)
- Test the affected flow end-to-end

### 6. Communicate Resolution (P0/P1)
- "The issue with [description] has been resolved. [Brief explanation if appropriate]. Sorry for the inconvenience."

### 7. Post-Mortem (P0/P1)

Write a brief post-mortem:

```markdown
## Incident: [Title]
**Date:** YYYY-MM-DD
**Duration:** [how long]
**Severity:** P0/P1
**Impact:** [who was affected, how]

### What happened
[Chronological description]

### Root cause
[Why it happened]

### Fix
[What was done to resolve it]

### Prevention
[What will prevent this from happening again]
```

Store post-mortems in `docs/03-scaling-ops/post-mortems/`.

## Key Dashboards

| Dashboard | URL | What to Check |
|---|---|---|
| Vercel | vercel.com/dashboard | Deployment status, function logs, errors |
| Supabase | supabase.com/dashboard | Database health, auth, RLS |
| Stripe | dashboard.stripe.com | Payments, webhooks, subscriptions |
| Anthropic | console.anthropic.com | API usage, rate limits, costs |
| Resend | resend.com/emails | Email delivery, bounce rates, failures |
| Cloudflare | dash.cloudflare.com | DNS records, domain status |

## Contact Points

| Service | Support | SLA |
|---|---|---|
| Vercel | support@vercel.com / Dashboard ticket | Pro plan: 24hr response |
| Supabase | support@supabase.io / Dashboard ticket | Pro plan: 24hr response |
| Stripe | Dashboard chat / support@stripe.com | Usually within hours |
| Anthropic | Console support ticket | Varies |
| Resend | support@resend.com / Dashboard | Free tier: best-effort |
| Cloudflare | Dashboard ticket | Free tier: community support |

## Preventive Measures

- [ ] Set up Vercel error alerts (email on function failures)
- [ ] Set up Stripe webhook failure alerts
- [ ] Monitor Supabase database size (approaching limits)
- [ ] Review Anthropic API usage weekly (catch anomalies early)
- [ ] Run QA checklist before every deployment
- [ ] Keep rollback SQL ready for every database migration
