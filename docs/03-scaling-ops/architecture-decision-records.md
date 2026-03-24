# Architecture Decision Records (ADRs)

Key technical decisions made during Kinē's development, with context on why — so future contributors (or future-you) don't reverse them without understanding the reasoning.

---

## ADR-001: localStorage-First Architecture

**Date:** 2025
**Status:** Active

### Decision
Use browser localStorage as the primary data store, syncing to Supabase as the persistent backend.

### Context
Kinē needs to work offline (gym environments have unreliable connectivity). Users log sets mid-session and can't wait for network calls.

### Reasoning
- Offline-first means the app never blocks on network
- localStorage is synchronous and fast — zero latency for UI updates
- Supabase sync happens in the background when connectivity is available
- PWA service worker caches the app shell for full offline capability

### Trade-offs
- Data can be lost if user clears browser data before sync
- Conflict resolution is needed if data changes on two devices
- localStorage has a ~5MB limit per origin (sufficient for training data)

### Alternatives considered
- IndexedDB (more storage, but async API adds complexity for little gain)
- Offline-only with manual export (too limiting for multi-device)

---

## ADR-002: Claude API for AI Programming

**Date:** 2025
**Status:** Active

### Decision
Use Anthropic's Claude (Sonnet) via API for all AI features, with Haiku as fallback.

### Context
Kinē's core differentiator is AI-generated training programs. The AI needs to understand exercise programming, women's physiology, and output structured JSON.

### Reasoning
- Claude excels at structured output (JSON program generation)
- System prompts allow deep domain knowledge injection
- Streaming support (SSE) enables progressive UI updates
- Anthropic's data policy: API inputs not used for training

### Trade-offs
- Vendor dependency on Anthropic
- Per-call cost (~£0.02-0.05 per generation)
- Requires internet for generation (but programs are cached)

### Alternatives considered
- OpenAI GPT-4 (comparable quality, but Anthropic data policy is cleaner)
- Fine-tuned local model (too expensive to develop and maintain for one product)
- Rule-based programming engine (not flexible enough for personalisation)

---

## ADR-003: No Integrations / Closed-Loop Principle

**Date:** 2025
**Status:** Active — Core Principle

### Decision
Kinē does not integrate with external fitness platforms, wearables, or social networks. Self-report is the primary signal.

### Context
Users asked for Apple Watch integration, Strava sync, and social sharing.

### Reasoning
- External data (heart rate, sleep scores) creates noise and anxiety without improving programming decisions
- Wearable data is notoriously unreliable for strength training (HR sensors during pressing, etc.)
- Social features increase churn in women's fitness apps (comparison, performance anxiety)
- Self-reported data (RPE, logged weights, session completion) is sufficient for programming decisions
- Fewer integrations = fewer failure modes and privacy concerns

### Trade-offs
- Perceived as a "missing feature" by some users
- No Apple Watch presence (a marketing disadvantage)
- Can't import historical data from other apps

### When to revisit
- If a wearable provides genuinely useful strength training data (e.g., velocity-based tracking)
- If user demand is overwhelming AND we can demonstrate it improves outcomes

---

## ADR-004: Progressive Web App (PWA) over Native

**Date:** 2025
**Status:** Active

### Decision
Ship as a PWA rather than native iOS/Android apps.

### Context
Solo developer with limited resources. Need to ship one codebase that works everywhere.

### Reasoning
- Single codebase (React/Next.js) for all platforms
- No app store review delays — ship updates instantly
- No 15-30% app store commission on subscriptions
- Service worker enables full offline support
- Install-to-home-screen provides near-native experience

### Trade-offs
- No App Store / Google Play presence (discovery disadvantage)
- Push notifications are limited on iOS (improved with iOS 16.4+)
- No background sync when app is closed
- Some users don't know how to "install" a PWA

### When to revisit
- When revenue justifies the development cost of native apps
- If iOS PWA capabilities remain too limited for key features

---

## ADR-005: Supabase for Backend

**Date:** 2025
**Status:** Active

### Decision
Use Supabase (PostgreSQL + Auth + Row Level Security) as the backend.

### Context
Need a backend with authentication, real-time capabilities, and row-level security — without building a custom server.

### Reasoning
- PostgreSQL is battle-tested for relational training data
- Row Level Security (RLS) means each user can only access their own data by default
- Built-in auth (magic link, OAuth) — no custom auth system needed
- Generous free tier for development, predictable scaling costs
- Edge functions available if needed

### Trade-offs
- Vendor lock-in to Supabase (mitigated: standard PostgreSQL underneath)
- No server-side logic beyond Vercel serverless functions
- RLS policies must be carefully maintained

---

## ADR-006: Vercel for Hosting and Serverless

**Date:** 2025
**Status:** Active

### Decision
Use Vercel for hosting the PWA and running serverless API functions.

### Context
Need hosting with serverless function support for the Claude API proxy, Stripe webhooks, and checkout sessions.

### Reasoning
- Seamless deployment from GitHub
- Serverless functions for API routes (chat, Stripe, checkout)
- Edge network for fast global delivery
- Environment variable management for secrets
- Preview deployments for PRs

### Trade-offs
- Function cold starts can add latency to AI requests
- Serverless functions have execution time limits (10s default, 60s pro)
- Cost scales with function invocations

---

## ADR-007: No User-to-User Features

**Date:** 2025
**Status:** Active — Core Principle

### Decision
No messaging, sharing, leaderboards, public profiles, or any feature that connects one user to another.

### Context
Every fitness app adds social features. We chose not to.

### Reasoning
- Research shows social comparison in fitness contexts increases anxiety, especially for women
- Social features require moderation, reporting, blocking — operational overhead for a solo team
- Kine's value is personal: your body, your program, your progress
- Social features create engagement metrics that optimise for screen time, not training outcomes

### When to revisit
- Not planned. This is a core principle, not a resource constraint.

---

## Template for New ADRs

```markdown
## ADR-XXX: [Title]

**Date:** YYYY-MM
**Status:** Active / Superseded by ADR-XXX / Deprecated

### Decision
[One sentence: what we decided]

### Context
[What prompted this decision]

### Reasoning
[Why this was the right choice — bullet points]

### Trade-offs
[What we gave up — be honest]

### Alternatives considered
[What else we evaluated and why we rejected it]

### When to revisit
[Under what conditions this decision should be reconsidered]
```
