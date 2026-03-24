# Deployment Runbook

Step-by-step guide for deploying Kinē. Written so someone other than the founder can ship safely.

## Overview

| Component | Platform | Deployment Method |
|---|---|---|
| Frontend + API routes | Vercel | Auto-deploy on push to `main` |
| Database | Supabase | Manual migration |
| Payments | Stripe | Dashboard + webhook config |
| Domain | kinefit.app | Vercel DNS |

## Standard Deployment (Code Change)

### Pre-deploy checklist

- [ ] All tests pass locally (`pnpm test`)
- [ ] Build succeeds locally (`pnpm build`)
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Tested the change in Vercel preview deployment (auto-created on PR)
- [ ] Checked QA checklist items relevant to the change (see qa-checklist.md)

### Deploy

1. Merge PR to `main` branch
2. Vercel auto-deploys within ~60 seconds
3. Monitor the Vercel deployment dashboard for build success
4. Verify the change on production (kinefit.app)

### Post-deploy verification

- [ ] App loads correctly
- [ ] Can log in
- [ ] Can generate a program (tests AI route)
- [ ] Can log a session (tests core functionality)
- [ ] Check Vercel function logs for errors

## Database Migration

### When needed
- Adding/modifying tables, columns, or RLS policies
- Changing data types or constraints

### Process

1. Write migration SQL and test on a local Supabase instance or staging
2. Back up production data:
   ```
   # Export from Supabase dashboard: Settings → Database → Backups
   ```
3. Run migration on production Supabase:
   - Go to Supabase Dashboard → SQL Editor
   - Paste and execute migration SQL
   - Verify: check table structure, RLS policies, test queries
4. Deploy code that depends on the migration
5. Verify app works end-to-end

### Rollback
- Keep the rollback SQL ready (reverse migration) before executing
- If data was lost, restore from backup

## Environment Variables

Managed in Vercel Dashboard → Settings → Environment Variables.

| Variable | Purpose | Where |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API access | Vercel |
| `STRIPE_SECRET_KEY` | Stripe server-side | Vercel |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Vercel |
| `SUPABASE_URL` | Database URL | Vercel |
| `SUPABASE_ANON_KEY` | Client-side Supabase access | Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase access | Vercel |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side | Vercel (public) |

**Never commit secrets to git.** If a key is compromised, rotate immediately in the relevant dashboard and update Vercel.

## Stripe Webhook Updates

If changing webhook handling:

1. Update webhook handler in code
2. Deploy to Vercel
3. Verify webhook endpoint URL in Stripe Dashboard → Developers → Webhooks
4. Check that all required events are subscribed:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Use Stripe CLI to test locally if needed:
   ```
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

## Rollback Procedure

### Code rollback
1. Go to Vercel Dashboard → Deployments
2. Find the last known-good deployment
3. Click "..." → "Promote to Production"
4. This instantly serves the previous version
5. Fix the issue on a branch, then redeploy normally

### Emergency: app is completely down
1. Check Vercel status page (vercel.com/status)
2. Check Supabase status page (status.supabase.com)
3. If Vercel is down: nothing to do — wait for their recovery
4. If Supabase is down: app works offline (localStorage), but auth/sync fails
5. If our code is the issue: rollback via Vercel (see above)
6. Post status update in [wherever you communicate with users]

## Monitoring

### What to check daily (during early launch)
- Vercel function invocations and errors (Dashboard → Analytics)
- Supabase database connections and query performance
- Stripe webhook delivery status (Dashboard → Developers → Webhooks)

### Red flags
- Spike in 500 errors on `/api/chat` (AI route broken)
- Webhook delivery failures (subscriptions not syncing)
- Auth errors (Supabase connectivity issue)
- Abnormally high API costs (possible abuse or infinite loop)

## Useful Commands

```bash
# Local development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm test                   # Run tests
pnpm lint                   # Lint check

# Vercel CLI
vercel                      # Deploy preview
vercel --prod               # Deploy production
vercel env pull .env.local  # Pull env vars locally
vercel logs                 # View function logs

# Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe-webhook
stripe trigger checkout.session.completed
```
