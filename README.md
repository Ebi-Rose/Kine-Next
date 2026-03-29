# Kine — AI Strength Training for Women

A progressive web app that builds personalised weekly strength programmes using AI, adapting to cycle phase, health conditions, injuries, equipment, and schedule.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19, Tailwind 4
- **State:** Zustand 5 with localStorage persistence (`kine_v2`) + Supabase cloud sync
- **Auth & DB:** Supabase (PostgreSQL, Auth, RLS)
- **Payments:** Stripe (subscriptions, webhooks, billing portal)
- **AI:** Claude API (Sonnet 4) via `/api/chat` proxy
- **Rate Limiting:** Upstash Redis (sliding window, 10 req/60s per user)
- **Error Monitoring:** Sentry v10 (client, server, edge)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Required (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase admin access
- `ANTHROPIC_API_KEY` — Claude API
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Client-side Stripe

### Optional
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Rate limiting (falls back to none)
- `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` — Build-time source map upload

## Key Architecture Notes

- **Session page** is split into 8 modular files (`src/app/app/session/`): orchestrator page, types, PR detection, ExerciseCard, FeedbackScreen, AnalysisScreen, SessionSummarySheet, WarmupSection, FullWarmupItem
- **Warmup engine** filters exercises based on `comfortFlags` (derived from health conditions): `impactSensitive` removes high-impact drills, `proneSensitive` removes prone-position drills
- **Skill preferences** persist exercise variant choices (e.g. Push-Up → Diamond Push-Up) and auto-apply to future generated weeks
- **Custom builder** has goal-aware defaults, template starters with recovery overlap badges, and smart warnings (muscle balance, consecutive-day overlap)
- **Sandbox mode** (`/app/sandbox`) lets intermediate+ users design a full 7-day week from scratch — gated by experience level

## Deployment

Deployed on Vercel. Push to `main` triggers production deploy.

- Sentry DSN is hardcoded (public ingest URL)
- `NEXT_PUBLIC_*` vars must be set before build (baked in at compile time)
- Stripe webhooks point to `/api/stripe-webhook`
