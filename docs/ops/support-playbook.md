# Support Playbook

Common issues, expected questions, and response templates for Kinē support.

## Guiding Principles

1. **Solution first, explanation second** — lead with the fix
2. **Match the user's urgency** — billing issues are urgent; feature requests are not
3. **Never blame the user** — if the UX confused them, that's our problem
4. **Escalation path:** Support email → founder direct (for now)

---

## Billing & Subscription

### "How do I cancel?"

> You can manage your subscription from the billing portal — tap your profile icon, then "Manage Subscription." This opens Stripe's portal where you can cancel. You'll keep access until the end of your current billing period.

### "I want a refund"

**Within 14 days of first purchase:**
> Absolutely — you're within our 14-day money-back guarantee. I'll process your refund now. You'll see it back on your card within 5-10 business days.

**After 14 days:**
> Subscriptions are non-refundable after the 14-day guarantee period, but your access continues until the end of your current billing cycle. I can cancel your renewal now if you'd like.

**Action:** Process refund via Stripe dashboard → Payments → Refund.

### "I was charged but can't access the app"

> I'm sorry about that — let me check your account. This usually happens when the webhook from Stripe hasn't synced yet. I'll fix this right now.

**Action:** Check Supabase `subscriptions` table. If missing/stale, manually reconcile with Stripe subscription status.

### "Can I switch from monthly to yearly?"

> Yes — go to Profile → Manage Subscription. In the billing portal, you can switch plans. The yearly plan saves you 17% (£25/month vs £29.99).

---

## Programs & Training

### "My program seems too easy / too hard"

> Your program is based on the profile you set up — goal, experience level, and equipment. A few things to check:
> 1. Is your experience level accurate? (Profile → About You)
> 2. Are your logged weights up to date? The AI uses your recent numbers.
> 3. After your next session, the check-in will ask how it felt — that feedback adjusts the following week.

### "Why did my exercises change this week?"

> Kinē generates a fresh program each week based on your performance, recovery, and (if you track it) your cycle phase. This is intentional — the variation keeps your training progressing rather than stalling on the same routine.

### "Can I keep the same program for multiple weeks?"

> Right now, each week generates fresh. If you find a session you love, you can use the Custom Builder to recreate it as a saved template. We're exploring repeat-week options for a future update.

### "I don't recognise an exercise"

> Every exercise in Kinē has an education section — tap the exercise name during your session to see instructions, cues, and common mistakes. If you'd prefer a different exercise, use the swap button (↔) to get an AI-suggested alternative that works with your equipment.

### "The AI gave me an exercise I can't do because of my injury"

> I'm sorry about that. The AI tries to respect your injury settings, but it's not perfect. Two things to do:
> 1. Swap the exercise using the ↔ button — the replacement will account for your constraints
> 2. Check that your injury is listed in Profile → Injuries & Limitations
>
> If this keeps happening, let me know which exercises are slipping through and I'll improve the constraints.

---

## Cycle Tracking

### "How does cycle tracking affect my training?"

> When you log your period, Kinē calculates your cycle phase and subtly adjusts your programming:
> - **Menstrual phase:** May reduce intensity, prioritise movements that feel better
> - **Follicular phase:** Higher capacity — programs may push harder
> - **Ovulatory phase:** Peak performance window
> - **Luteal phase:** Gradual pullback as energy typically decreases
>
> This is all optional and based on self-reported data. You can disable it any time.

### "My cycle is irregular — will this still work?"

> Yes. When you set your cycle type to "irregular," Kinē relies more on your recent logged periods rather than assuming a fixed pattern. The more you log, the better it adapts. If you don't track, your programming works normally without cycle adjustments.

### "I'm on hormonal birth control — should I track?"

> You can set your cycle type to "hormonal" in your profile. Hormonal birth control changes cycle dynamics, so Kinē adjusts how it interprets your data. It's still useful to log, but the phase-based adjustments are more subtle.

### "I want to stop tracking my cycle"

> Go to Profile → Cycle → set type to "Not applicable." Your historical data stays in case you want to resume, but it won't affect your programming going forward.

---

## Technical / Account

### "The app isn't loading"

> Try these in order:
> 1. Hard refresh (Ctrl/Cmd + Shift + R)
> 2. Check kinefit.app in an incognito/private window
> 3. Clear site data for kinefit.app in your browser settings
>
> If none of those work, let me know your browser and device and I'll investigate.

### "I logged a session but it disappeared"

> This can happen if you were offline and closed the browser before it synced. Check if the session appears in your history — if not, it may have been lost before sync completed. We're working on making offline sync more resilient.

### "How do I delete my account?"

> Email [SUPPORT_EMAIL] with your account email and we'll process deletion within 30 days. This permanently removes all your data — training history, profile, cycle data, and subscription. This cannot be undone.

**Action:** See data-deletion-procedure.md for the full process.

### "Can I export my data?"

> Yes — we can export your complete training history as a JSON file. Email [SUPPORT_EMAIL] and we'll send it within 7 days.

**Action:** Query Supabase for user's sessions, profile, and cycle data. Export as JSON.

---

## Feature Requests

### Template response:

> Thanks for the suggestion — I've noted it. We're a small team so I can't commit to timelines, but user feedback directly shapes what we build. The things we hear most often move up the list.

### Common requests and current status:

| Request | Status |
|---|---|
| Apple Watch / wearable integration | Not planned (closed-loop principle) |
| Social features / sharing | Not planned (by design) |
| Nutrition tracking | Not planned (out of scope) |
| Rep-in-reserve logging | Considering |
| Program templates / library | Custom Builder covers this partially |
| Rest timer customisation | In progress |
| Dark mode | Already dark by default |

---

## Escalation Triggers

Escalate immediately (don't template-respond) when:
- User reports a **safety issue** (exercise caused injury, program was dangerous)
- User reports a **billing error** (double charge, wrong amount)
- User reports **data loss** (sessions/history disappeared)
- User requests **data deletion** under GDPR
- User reports **AI generating inappropriate content**
- Any mention of **legal action**
