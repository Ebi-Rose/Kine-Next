"use client";

import Link from "next/link";
import Image from "next/image";

export default function WhyKinePage() {
  const check = (
    <svg viewBox="0 0 16 16" fill="none" stroke="#C49098" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-check-svg"><path d="M2 8.5L6 12.5L14 4"/></svg>
  );

  return (
    <div className="wk-page">
      <style>{`
        .wk-page {
          background: #FAFAFA;
          color: #1A1A1A;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }
        .wk-top-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #C49098;
          z-index: 10;
        }
        .wk-container {
          max-width: 860px;
          margin: 0 auto;
          padding: 80px 48px 64px;
          position: relative;
        }
        .wk-container::before {
          content: '';
          position: absolute;
          left: 20px;
          top: 80px;
          bottom: 64px;
          width: 2px;
          background: #C49098;
          opacity: 0.10;
        }

        /* Nav */
        .wk-nav { margin-bottom: 40px; }
        .wk-nav a {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          letter-spacing: 4px;
          text-decoration: none;
          font-weight: 400;
          transition: opacity 0.2s;
        }
        .wk-nav a:hover { opacity: 0.7; }
        .wk-nav .k { color: #C49098; }
        .wk-nav .rest { color: #1A1A1A; }

        /* Header */
        .wk-header { margin-bottom: 56px; }
        .wk-header h2 {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 700;
          font-size: 2.2rem;
          color: #C49098;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          line-height: 1;
          margin-bottom: 4px;
        }
        .wk-header h1 {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 700;
          font-size: 3.6rem;
          color: #1A1A1A;
          text-transform: uppercase;
          letter-spacing: 0.01em;
          line-height: 1.05;
          margin-bottom: 24px;
        }
        .wk-accent-line {
          width: 80px;
          height: 3px;
          background: #C49098;
          margin-bottom: 24px;
        }
        .wk-subhead {
          color: #555;
          font-size: 1.05rem;
          line-height: 1.65;
          max-width: 560px;
        }

        /* Founder */
        .wk-founder {
          background: #FFF;
          border: 1px solid #E8E8E8;
          border-left: 3px solid #C49098;
          padding: 32px 36px;
          margin-bottom: 56px;
          border-radius: 0 4px 4px 0;
        }
        .wk-founder-label {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 700;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #C49098;
          margin-bottom: 16px;
        }
        .wk-founder p {
          color: #555;
          font-size: 0.95rem;
          line-height: 1.7;
          max-width: 620px;
        }
        .wk-founder p + p { margin-top: 12px; }
        .wk-founder-name {
          color: #1A1A1A;
          font-weight: 400;
          font-size: 0.88rem;
          margin-top: 20px;
        }
        .wk-founder-name span {
          color: #999;
          font-weight: 300;
        }
        .wk-founder-img {
          float: right;
          margin: 0 0 16px 28px;
          border-radius: 4px;
          object-fit: cover;
        }

        /* Section labels */
        .wk-section-label {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 700;
          font-size: 1.3rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #C49098;
          margin-bottom: 8px;
          margin-top: 48px;
        }
        .wk-section-desc {
          color: #999;
          font-size: 0.88rem;
          font-style: italic;
          margin-bottom: 20px;
          max-width: 560px;
          line-height: 1.5;
        }

        /* Trust grid */
        .wk-trust-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .wk-trust-card {
          background: #FFF;
          border: 1px solid #E8E8E8;
          border-radius: 4px;
          padding: 22px 24px;
        }
        .wk-trust-title {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #C49098;
          margin-bottom: 8px;
        }
        .wk-trust-card p {
          color: #555;
          font-size: 0.88rem;
          line-height: 1.55;
        }

        /* Comparison */
        .wk-comparison { margin-bottom: 16px; }
        .wk-comparison-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          padding-bottom: 14px;
          border-bottom: 1px solid #E8E8E8;
        }
        .wk-col-label {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding-left: 36px;
        }
        .wk-col-typical { color: #999; }
        .wk-col-kine { color: #C49098; }
        .wk-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          border-bottom: 1px solid #E8E8E8;
        }
        .wk-row:nth-child(odd) { background: #F4F4F4; }
        .wk-cell {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px 8px;
        }
        .wk-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }
        .wk-x {
          position: relative;
          width: 14px;
          height: 14px;
        }
        .wk-x::before, .wk-x::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 14px;
          height: 1.8px;
          background: #BBB;
          border-radius: 1px;
        }
        .wk-x::before { transform: translate(-50%, -50%) rotate(45deg); }
        .wk-x::after { transform: translate(-50%, -50%) rotate(-45deg); }
        .icon-check-svg { width: 16px; height: 16px; }
        .wk-cell-typical .wk-text { color: #999; font-size: 0.92rem; line-height: 1.55; }
        .wk-cell-kine .wk-text { color: #1A1A1A; font-size: 0.92rem; line-height: 1.55; }

        /* CTA */
        .wk-cta { margin-top: 56px; margin-bottom: 20px; }
        .wk-cta h3 {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 700;
          font-size: 2.4rem;
          text-transform: uppercase;
          line-height: 1.1;
        }
        .wk-cta .wk-dark { color: #1A1A1A; }
        .wk-cta .wk-rose { color: #C49098; }
        .wk-closing {
          color: #555;
          font-size: 0.95rem;
          line-height: 1.65;
          max-width: 560px;
          margin-bottom: 56px;
        }

        /* Footer */
        .wk-footer {
          border-top: 1px solid #E8E8E8;
          padding-top: 24px;
          text-align: center;
        }
        .wk-footer-link {
          display: inline-block;
          color: #C49098;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 400;
          margin-bottom: 20px;
          transition: opacity 0.2s;
        }
        .wk-footer-link:hover { opacity: 0.7; }
        .wk-footer-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          letter-spacing: 4px;
          font-weight: 400;
          margin-bottom: 6px;
        }
        .wk-footer-logo .k { color: #C49098; }
        .wk-footer-logo .rest { color: #1A1A1A; }
        .wk-footer-tagline {
          font-size: 0.68rem;
          color: #999;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        @media (max-width: 640px) {
          .wk-container { padding: 60px 24px 48px; }
          .wk-container::before { left: 8px; }
          .wk-header h1 { font-size: 2.4rem; }
          .wk-header h2 { font-size: 1.5rem; }
          .wk-comparison-header, .wk-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .wk-comparison-header .wk-col-typical { display: none; }
          .wk-cell-typical { padding-bottom: 4px; opacity: 0.6; }
          .wk-cell-kine { padding-top: 4px; padding-bottom: 24px; }
          .wk-cta h3 { font-size: 1.8rem; }
          .wk-trust-grid { grid-template-columns: 1fr; }
          .wk-founder { padding: 24px 20px; }
          .wk-founder-img {
            float: none;
            display: block;
            margin: 0 auto 20px;
            width: 100% !important;
            height: auto !important;
          }
        }

        @media print {
          .wk-top-bar { position: absolute; }
          .wk-page { background: #FAFAFA; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .wk-container { padding: 40px 32px; }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700&family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />

      <div className="wk-top-bar" />

      <div className="wk-container">

        <nav className="wk-nav">
          <Link href="/"><span className="k">K</span><span className="rest">INĒ</span></Link>
        </nav>

        <header className="wk-header">
          <h2>What Makes</h2>
          <h1>Kine Different</h1>
          <div className="wk-accent-line" />
          <p className="wk-subhead">
            Most fitness apps were built for men, then painted pink. Others were vibe-coded over a weekend and shipped with no guardrails.<br /><br />
            Kine was built from the ground up on women&apos;s physiology &mdash; shaped by professionals with deep expertise in enterprise architecture, governance, information security, data privacy, women&apos;s health, product strategy, content strategy, quality assurance, and software engineering.
          </p>
        </header>

        {/* Founder */}
        <div className="wk-founder">
          <div className="wk-founder-label">Why I Built This</div>
          <Image
            src="/founder-ebi-rose.jpg"
            alt="Ebi-Rose, founder of Kine"
            width={220}
            height={293}
            className="wk-founder-img"
          />
          <p>I came into the gym midway through losing 65 kg. That was over a decade ago. The first few years I had no idea what I was doing &mdash; no coach, no program, just showing up and figuring it out. I slipped a disc. Messed up both shoulders. Went through phases where I was overtraining and getting absolutely nowhere. I have PCOS, and not a single app I used even knew what that was.</p>
          <p>I eventually got proper coaching and started learning from everyone I could &mdash; physios, trainers, doctors, other women who&apos;d been through the same thing. And the more I learned, the more I noticed the same pattern. Women around me were stopping training because of conditions nobody was helping them with. Or they were just given the same program as everyone else and told to go lighter. The industry either treats you like a small man or hands you pink dumbbells. That&apos;s it. Those are your options.</p>
          <p>People kept asking me the same questions. Women who wanted to train but didn&apos;t know where to start, or had a condition and didn&apos;t know if they even could. I&apos;d been in there long enough to know the answers, and I realised nobody was building what we actually needed. So I built it. Everything I&apos;ve learned over ten years, shaped by professionals across every discipline this thing needed. I&apos;m a working solution to my own problem.</p>
          <div className="wk-founder-name">Ebi-Rose <span>&mdash; Founder, Kine</span></div>
        </div>

        {/* vs Established */}
        <div className="wk-section-label">vs. Established Fitness Apps</div>
        <p className="wk-section-desc">Fitbod, Juggernaut, SWEAT, Dr. Muscle &mdash; apps with real engineering, but none built for women&apos;s bodies.</p>

        <section className="wk-comparison">
          <div className="wk-comparison-header">
            <span className="wk-col-label wk-col-typical">Them</span>
            <span className="wk-col-label wk-col-kine">Kine</span>
          </div>

          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">No awareness of PCOS, endometriosis, pelvic floor, fibroids, or hypermobility</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Five conditions with hand-authored rules &mdash; contra-indications, volume caps, warmup mods, cueing. Programs adapt silently, without labelling you.</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">No life stage support &mdash; perimenopause and post-menopause ignored entirely</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Perimenopause and post-menopause as first-class life stages &mdash; prioritising strength and power for bone density, not &ldquo;taking it easy&rdquo;</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">Cycle tracking at best &mdash; no impact on actual programming</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Cycle phase adjusts volume, load caps, and intensity &mdash; with distinct logic for combined pill, IUD, implant, and irregular cycles</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">Black-box decisions &mdash; you get a workout, no reasoning</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Every exercise choice explained in plain language &mdash; coaching that shows its reasoning, not just its answer</div></div>
          </div>
        </section>

        {/* vs Vibe-Coded */}
        <div className="wk-section-label">vs. Vibe-Coded Fitness Apps</div>
        <p className="wk-section-desc">The wave of &ldquo;prompt in, workout out&rdquo; apps built in a weekend. No engine, no guardrails, no accountability.</p>

        <section className="wk-comparison">
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">Entire workout generated by a prompt &mdash; no structure, no memory between sessions</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Deterministic engine builds 3-week periodised blocks with guardrails &mdash; it can&apos;t invent exercises, change loads, or add sessions</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">No contra-indications &mdash; might prescribe box jumps to someone with a prolapse</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Hard-filters dangerous exercises per condition. Pelvic floor removes all impact. Rep range floors prevent unsafe heavy singles. Warmups adapt automatically.</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">Miss a week? Start over. No memory of who you were.</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Gaps pause progress, never erase it. Every return gets a rebuilding plan &mdash; reduced load, reduced volume &mdash; not a zeroed counter</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">Same level of hand-holding forever</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Coaching thins as you grow &mdash; week 1 is explanatory, week 7 is just &ldquo;+2.5 kg.&rdquo; The app gets quieter as you get stronger.</div></div>
          </div>
        </section>

        {/* Privacy & Trust */}
        <div className="wk-section-label">Privacy &amp; Trust</div>
        <p className="wk-section-desc">Cycle data is health data. We treat it that way.</p>

        <div className="wk-trust-grid">
          <div className="wk-trust-card">
            <div className="wk-trust-title">No Tracking. No Ads. Ever.</div>
            <p>No tracking cookies, no analytics pixels, no advertising. Revenue comes from subscriptions, not your data. We don&apos;t sell it. We don&apos;t share it with anyone.</p>
          </div>
          <div className="wk-trust-card">
            <div className="wk-trust-title">Your Data Stays Yours</div>
            <p>Progress photos never leave your device. Health data requires your explicit consent and can be withdrawn at any time. Full data export and one-tap account deletion, always.</p>
          </div>
          <div className="wk-trust-card">
            <div className="wk-trust-title">Your Data Has Boundaries</div>
            <p>Your name, email, and payment info are never sent to the intelligence layer. Only training-relevant data is used, and none of it is used to train third-party models.</p>
          </div>
          <div className="wk-trust-card">
            <div className="wk-trust-title">Closed Loop by Design</div>
            <p>No integrations, no social feeds, no wearable imports. Self-report is the signal. External data creates noise and anxiety without improving your programming.</p>
          </div>
          <div className="wk-trust-card">
            <div className="wk-trust-title">GDPR Compliant</div>
            <p>Health data is treated as a special category with explicit opt-in. Encrypted in transit and at rest. Your data is yours to export or delete at any time.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="wk-cta">
          <h3><span className="wk-dark">Stop guessing.</span> <span className="wk-rose">Start training.</span></h3>
        </div>

        <p className="wk-closing">
          Structured training that adapts to the body you&apos;re in,
          the conditions you have, and what life looks like this week.
        </p>

        <footer className="wk-footer">
          <Link href="/" className="wk-footer-link">&larr; Back to homepage</Link>
          <div className="wk-footer-logo"><span className="k">K</span><span className="rest">INĒ</span></div>
          <div className="wk-footer-tagline">Strength training, shaped by you</div>
        </footer>

      </div>
    </div>
  );
}
