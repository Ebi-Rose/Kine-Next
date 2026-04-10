import type { Metadata } from "next";
import ForceLightMode from "@/components/ForceLightMode";

export const metadata: Metadata = {
  title: "Privacy Policy — KINĒ",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg font-body text-text px-6 py-12 max-w-2xl mx-auto">
      <ForceLightMode />
      <a href="/" className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back to homepage
      </a>

      <h1 className="mt-8 font-display text-3xl tracking-wide">Privacy Policy</h1>
      <p className="mt-2 text-xs text-muted2">Last updated: 30 March 2026</p>

      <div className="mt-8 space-y-6 text-sm text-muted2 leading-relaxed">
        <section>
          <h2 className="text-base font-medium text-text mb-2">1. Who We Are</h2>
          <p>
            Kinē Ltd (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates kinefit.app. We are
            the data controller responsible for your personal data under the UK General Data
            Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
          <p className="mt-2">
            Contact:{" "}
            <a href="mailto:privacy@kinefit.app" className="text-accent hover:underline">
              privacy@kinefit.app
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">2. Data We Collect</h2>
          <p>We collect the following categories of personal data:</p>

          <h3 className="text-sm font-medium text-text mt-4 mb-1">Account data</h3>
          <p>Email address, password (hashed), authentication provider (e.g. Google).</p>

          <h3 className="text-sm font-medium text-text mt-4 mb-1">Profile data</h3>
          <p>Name, height, weight (all optional).</p>

          <h3 className="text-sm font-medium text-text mt-4 mb-1">Training data</h3>
          <p>
            Training goals, experience level, equipment, schedule preferences, exercise logs,
            lift history, session feedback, and progress photos you choose to take.
          </p>

          <h3 className="text-sm font-medium text-text mt-4 mb-1">Health data (special category)</h3>
          <p>
            With your explicit consent, we collect: menstrual cycle data (period start/end dates,
            cycle length), health conditions (PCOS, fibroids, endometriosis, pelvic floor
            concerns), injuries, and comfort preferences. This data is used solely to personalise
            your training programme.
          </p>

          <h3 className="text-sm font-medium text-text mt-4 mb-1">Payment data</h3>
          <p>
            Processed by Stripe. We store your Stripe customer ID and subscription status.
            We never see or store your full card number.
          </p>

          <h3 className="text-sm font-medium text-text mt-4 mb-1">Technical data</h3>
          <p>IP address (for rate limiting only, not stored), device type, browser type.</p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">3. Lawful Basis</h2>
          <p>We process your data on the following legal bases:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong className="text-text">Contract:</strong> Account, profile, training, and payment data are necessary to provide the Service.</li>
            <li><strong className="text-text">Explicit consent:</strong> Health data (cycle, conditions, injuries) is processed only with your explicit consent, given during onboarding. You may withdraw consent at any time by removing this data from your profile.</li>
            <li><strong className="text-text">Legitimate interest:</strong> Technical data for security, rate limiting, and service reliability.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">4. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Generate personalised training programmes via AI</li>
            <li>Track your progress and suggest weight/rep progressions</li>
            <li>Adjust programming based on cycle phase and health conditions</li>
            <li>Process payments and manage your subscription</li>
            <li>Provide coaching feedback and exercise education</li>
            <li>Maintain security and prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">5. AI Processing</h2>
          <p>
            Your training profile (goals, equipment, injuries, cycle phase, session history) is
            sent to Anthropic&apos;s Claude API to generate personalised programmes and coaching
            feedback. This data is sent as part of API requests and is subject to{" "}
            <a
              href="https://www.anthropic.com/policies/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Anthropic&apos;s Privacy Policy
            </a>
            . Anthropic does not use API inputs to train their models.
          </p>
          <p className="mt-2">
            We do not send your name, email, date of birth, or payment information to the AI.
            Only training-relevant data is included in AI requests.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">6. Data Sharing</h2>
          <p>We share data with the following third-party processors:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong className="text-text">Supabase</strong> (database &amp; authentication) — EU-hosted</li>
            <li><strong className="text-text">Stripe</strong> (payment processing) — PCI DSS compliant</li>
            <li><strong className="text-text">Anthropic</strong> (AI programme generation) — API data not used for training</li>
            <li><strong className="text-text">Vercel</strong> (hosting) — edge functions process requests</li>
          </ul>
          <p className="mt-2">
            We do not sell your data. We do not share your data with advertisers or data brokers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">7. Data Storage &amp; Security</h2>
          <p>
            Your data is stored in Supabase (cloud database) and locally on your device
            (localStorage for offline access). All data in transit is encrypted via TLS.
            Authentication tokens are managed by Supabase. Access cookies are signed with
            HMAC-SHA256.
          </p>
          <p className="mt-2">
            Progress photos are stored locally on your device only. They are not uploaded to
            our servers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">8. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-text">Active accounts:</strong> Data retained while your account is active.</li>
            <li><strong className="text-text">After cancellation:</strong> Training data retained for 90 days to allow resubscription, then deleted.</li>
            <li><strong className="text-text">Account deletion:</strong> All data deleted within 30 days of request.</li>
            <li><strong className="text-text">Inactive accounts:</strong> Accounts with no login for 24 months will receive a deletion notice. If no action is taken within 30 days, the account and all data will be permanently deleted.</li>
            <li><strong className="text-text">Payment records:</strong> Retained as required by financial regulations (up to 7 years).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">9. Your Rights (UK GDPR)</h2>
          <p>You have the right to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong className="text-text">Access</strong> your personal data</li>
            <li><strong className="text-text">Rectify</strong> inaccurate data via your profile</li>
            <li><strong className="text-text">Erase</strong> your data (&quot;right to be forgotten&quot;)</li>
            <li><strong className="text-text">Restrict</strong> processing of your data</li>
            <li><strong className="text-text">Port</strong> your data in a machine-readable format</li>
            <li><strong className="text-text">Withdraw consent</strong> for health data processing at any time via Profile &rarr; Privacy</li>
            <li><strong className="text-text">Object</strong> to processing based on legitimate interest</li>
            <li><strong className="text-text">Complain</strong> to the Information Commissioner&apos;s Office (ICO) at ico.org.uk</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact{" "}
            <a href="mailto:privacy@kinefit.app" className="text-accent hover:underline">
              privacy@kinefit.app
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">10. Cookies</h2>
          <p>
            We use two functional cookies: <code className="text-text">kine_access</code> (access
            session, 30-day expiry) and <code className="text-text">kine_sub</code> (subscription
            verification, 1-hour expiry). Both are httpOnly, signed, and not accessible to
            client-side JavaScript. We do not use tracking cookies, analytics cookies, or
            advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">11. Children</h2>
          <p>
            Kinē is not intended for users under 18. We do not knowingly collect data from
            anyone under 18. If we learn we have collected data from a minor, we will delete
            it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">12. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Material changes will be communicated
            via email or in-app notice. The &quot;last updated&quot; date at the top reflects
            the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-text mb-2">13. Contact</h2>
          <p>
            For privacy questions or data requests, contact:{" "}
            <a href="mailto:privacy@kinefit.app" className="text-accent hover:underline">
              privacy@kinefit.app
            </a>
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-border pt-6 text-xs text-muted">
        <p>© 2026 Kinē Ltd. All rights reserved.</p>
      </div>
    </div>
  );
}
