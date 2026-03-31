# Data Deletion Procedure

Internal procedure for handling account deletion requests under GDPR "right to erasure."

## Trigger

User emails [SUPPORT_EMAIL] requesting account deletion, or submits deletion via in-app flow (when implemented).

## Timeline

- **Acknowledge:** Within 48 hours of request
- **Complete deletion:** Within 30 days
- **Confirmation email:** Sent upon completion

## Step-by-Step Process

### 1. Verify Identity

- Confirm the request comes from the email associated with the account
- If from a different email, request verification (e.g., "please send this request from your registered email")

### 2. Cancel Active Subscription (Stripe)

```
1. Find customer in Stripe Dashboard by email
2. Cancel subscription immediately (not at period end)
3. If within 14-day guarantee, process refund
4. Note the Stripe customer ID for records
```

### 3. Delete Supabase Data

Delete in this order to respect foreign key constraints:

```sql
-- Replace USER_ID with the actual user UUID

-- 1. Delete session/workout data
DELETE FROM sessions WHERE user_id = 'USER_ID';
DELETE FROM session_exercises WHERE session_id IN (SELECT id FROM sessions WHERE user_id = 'USER_ID');

-- 2. Delete cycle data
DELETE FROM cycle_logs WHERE user_id = 'USER_ID';

-- 3. Delete program data
DELETE FROM programs WHERE user_id = 'USER_ID';

-- 4. Delete subscription record
DELETE FROM subscriptions WHERE user_id = 'USER_ID';

-- 5. Delete user profile
DELETE FROM profiles WHERE user_id = 'USER_ID';

-- 6. Delete auth user (Supabase Auth)
-- Use Supabase Dashboard: Authentication → Users → Find → Delete
-- Or via Admin API:
-- supabase.auth.admin.deleteUser('USER_ID')
```

### 4. Verify Deletion

- Confirm no rows remain for the user ID across all tables
- Check Supabase Auth users list to confirm auth record is gone
- Check Stripe to confirm subscription is cancelled

### 5. Stripe Customer Record

Stripe retains customer records for tax/compliance purposes. This is permitted under GDPR Article 17(3)(b) (legal obligation). We do not need to delete the Stripe customer record, but we should:
- Remove any metadata we added (supabase_user_id)
- Note in Stripe that the account was deleted per GDPR request

### 6. Send Confirmation

Email the user:

> Your Kinē account and all associated data have been permanently deleted. This includes your training history, profile, cycle data, and subscription.
>
> Your Stripe payment record is retained for legal/tax compliance as required by law, but contains no training or health data.
>
> If you ever want to return, you're welcome to create a new account.

### 7. Log the Deletion

Maintain a deletion log (spreadsheet or database — NOT containing user data):

| Date | Request Source | Completion Date | Stripe Cancelled | Supabase Cleared | Confirmation Sent |
|---|---|---|---|---|---|
| YYYY-MM-DD | Email | YYYY-MM-DD | Yes | Yes | Yes |

## Edge Cases

### User wants to delete data but keep account
- Delete training history and cycle data
- Keep auth and profile
- Reset onboarding state so they start fresh

### User wants to delete cycle data only
- Delete from `cycle_logs` table
- Set cycle type to "Not applicable" in profile
- No need to touch Stripe or auth

### User is mid-subscription with time remaining
- Cancel immediately, process prorated refund at discretion
- Delete data per normal procedure
- Do not retain data "in case they come back"

### User cannot access their registered email
- Require alternative identity verification (e.g., last 4 of card used, approximate signup date)
- Document the verification method used
