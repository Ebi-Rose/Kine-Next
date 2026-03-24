# Privacy Policy

**Effective Date:** [DATE]
**Last Updated:** [DATE]

Kinē ("we", "our", "us") operates the Kinē fitness application (kinefit.app). This policy explains how we collect, use, and protect your personal data.

## 1. Data We Collect

### Account Data
- Email address (for authentication and communication)
- Name (optional, for personalisation)
- Height and weight (for programming context)

### Training Data
- Exercise selections, sets, reps, and weights logged per session
- Session timestamps and duration
- Personal records and training history
- Program preferences (goals, experience level, equipment, schedule)
- Injury and limitation notes

### Menstrual Cycle Data (Optional)
- Period start dates (self-reported)
- Cycle length (calculated or manually entered)
- Cycle type (regular, irregular, hormonal, perimenopause)

This is classified as **special category health data** under UK GDPR. We process it only with your explicit consent, and only to adjust your training programming.

### Technical Data
- IP address (for rate limiting only — not stored long-term)
- Browser/device type (for rendering the PWA)

## 2. How We Use Your Data

| Purpose | Lawful Basis |
|---|---|
| Generate personalised training programs | Contractual necessity |
| Adjust programming for cycle phase | Explicit consent |
| Process subscription payments | Contractual necessity |
| Send transactional emails (receipts, account changes) | Legitimate interest |
| Rate-limit API requests | Legitimate interest |

We do **not** use your data for:
- Advertising or ad targeting
- Selling to third parties
- Behavioural profiling beyond training personalisation
- Social features or public profiles

## 3. Third-Party Processors

| Processor | Purpose | Data Shared |
|---|---|---|
| **Supabase** (EU/US) | Database and authentication | Account data, training data, cycle data |
| **Anthropic (Claude API)** | AI program generation | Training profile, equipment, goals, cycle phase (no name or email) |
| **Stripe** | Payment processing | Email, subscription plan, payment method (handled entirely by Stripe) |
| **Vercel** | Hosting and serverless functions | IP address (transient, for request routing) |

We have Data Processing Agreements with each processor. No data is sold or shared with brokers.

## 4. AI Data Processing

When Kinē generates your training program, we send the following to Anthropic's Claude API:
- Your training goal, experience level, and equipment
- Your schedule and session duration preferences
- Your injury/limitation notes
- Your current cycle phase (if cycle tracking is enabled)
- Your recent training data (weights, performance trends)

We do **not** send your name, email, or payment information to the AI. Anthropic does not use API inputs for model training (per their [data policy](https://www.anthropic.com/policies/privacy)).

## 5. Data Storage and Security

- All data is stored in Supabase with row-level security (RLS) — each user can only access their own data
- Authentication is handled via Supabase Auth (email magic link / OAuth)
- API endpoints are rate-limited (10 requests per 60 seconds)
- Payment data never touches our servers — Stripe handles all card processing
- The app works offline via a service worker; offline data is stored in your browser's localStorage and synced when connectivity is restored

## 6. Data Retention

- **Active accounts:** Data retained for the lifetime of your subscription
- **Cancelled accounts:** Training data retained for 90 days, then deleted
- **Deleted accounts:** All data permanently removed within 30 days of deletion request

## 7. Your Rights (UK GDPR)

You have the right to:
- **Access** your personal data (we can export it as JSON)
- **Rectify** inaccurate data (edit in-app or contact us)
- **Erase** your data ("right to be forgotten" — see Section 6)
- **Restrict** processing of your data
- **Port** your data to another service (JSON export)
- **Withdraw consent** for cycle tracking at any time (disable in settings)
- **Object** to processing based on legitimate interest

To exercise any right, email: **[PRIVACY_EMAIL]**

We will respond within 30 days. If unsatisfied, you may lodge a complaint with the ICO (ico.org.uk).

## 8. Cookies and Local Storage

Kinē uses **no tracking cookies**. We use:
- **localStorage:** To cache your training data for offline use and store UI preferences
- **Service worker cache:** To enable the PWA to function offline
- **Supabase auth token:** Stored in localStorage for session persistence

No third-party cookies. No analytics trackers. No pixel tags.

## 9. Children

Kinē is not intended for users under 16. We do not knowingly collect data from children.

## 10. Changes to This Policy

We will notify you of material changes via email or in-app notice. Continued use after notification constitutes acceptance.

## 11. Contact

For privacy questions or data requests:
- Email: **[PRIVACY_EMAIL]**
- Data Controller: **[LEGAL_NAME]**, [ADDRESS]
- ICO Registration: **[ICO_NUMBER]** (if applicable)

---

*This policy covers the Kinē web application at kinefit.app. It does not cover third-party services linked from our site.*
