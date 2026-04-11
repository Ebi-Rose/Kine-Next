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

        /* Highlight callout */
        .wk-highlight {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem;
          font-style: italic;
          color: #555;
          line-height: 1.6;
          max-width: 620px;
          padding: 24px 0;
          margin-bottom: 48px;
          border-top: 2px solid #C49098;
          border-bottom: 1px solid #E8E8E8;
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
          .wk-header { margin-bottom: 36px; }
          .wk-header h1 { font-size: 1.6rem; }
          .wk-header h2 { font-size: 1rem; }
          .wk-subhead { font-size: 0.85rem; }
          .wk-section-label { font-size: 1rem; }
          .wk-section-desc { font-size: 0.78rem; }
          .wk-cell-typical .wk-text, .wk-cell-kine .wk-text { font-size: 0.8rem; }
          .wk-comparison-header, .wk-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .wk-comparison-header .wk-col-typical { display: none; }
          .wk-cell-typical { padding-bottom: 4px; opacity: 0.6; }
          .wk-cell-kine { padding-top: 4px; padding-bottom: 24px; }
          .wk-cta h3 { font-size: 1.4rem; }
          .wk-trust-grid { grid-template-columns: 1fr; }
          .wk-trust-title { font-size: 0.72rem; }
          .wk-trust-card p { font-size: 0.78rem; }
          .wk-founder { padding: 24px 20px; }
          .wk-founder p { font-size: 0.82rem; }
          .wk-founder-label { font-size: 0.68rem; }
          .wk-closing { font-size: 0.82rem; }
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

        {/* Founder — leads with the personal story to establish trust */}
        <div className="wk-founder">
          <div className="wk-founder-label">Why I Built This</div>
          <Image
            src="/founder-ebi-rose.jpg"
            alt="Ebi-Rose, founder of Kine"
            width={220}
            height={293}
            className="wk-founder-img"
          />
          <p>I came into the gym midway through losing 65 kg. That was over a decade ago. No coach, no programme, just showing up and figuring it out. I slipped a disc. Messed up both shoulders. Went through phases where I was overtraining and getting absolutely nowhere. I have PCOS, and not a single app I used even knew what that was.</p>
          <p>Over the years I got proper coaching and started to understand how important strength training really is &mdash; especially for women. Conditions like PCOS and insulin resistance genuinely respond to it. Perimenopause changes what training should look like. Hormones shift priorities week to week. But none of that is reflected in what&apos;s actually available. The industry moved on from pink dumbbells, but it still hasn&apos;t arrived at real female-centred training for everyday women.</p>
          <p>And the options that do exist? Limited, expensive, and built around commitments most real lives can&apos;t sustain. Six days a week, strict plans, no room for a bad month. When life happened &mdash; and it always does &mdash; fitness was the first thing to fall. Then you&apos;d start over. Again.</p>
          <p>I experienced the consequences of that first hand &mdash; and saw many more around me. Women stopping because of conditions nobody was helping them with. Women who wanted to start but didn&apos;t know if they even could. The knowledge was out there, but it was locked behind personal trainers most people can&apos;t afford, or buried in programmes that assumed you had nothing else going on.</p>
          <p>So I combined everything. My teaching background, my academic work in data science, maths, science and social science, my professional experience in enterprise architecture, governance and information security &mdash; and everything I&apos;ve learned over ten years in the gym. Kine isn&apos;t a side project. It&apos;s what happens when you bring all of that to a problem nobody else was solving properly.</p>
          <div className="wk-founder-name">Ebi-Rose <span>&mdash; Founder, Kine</span></div>
        </div>

        <div className="wk-highlight">
          Shaped by professionals with deep expertise in Women&apos;s Health, Fitness, Data, AI, Security, Privacy, Product Strategy and Software Engineering.
        </div>

        {/* vs Established */}
        <div className="wk-section-label">vs. Established Fitness Apps</div>
        <p className="wk-section-desc">Fitbod, Juggernaut, SWEAT, Dr. Muscle &mdash; good apps, real engineering. But they don&apos;t teach you anything, and they weren&apos;t built for your body.</p>

        <section className="wk-comparison">
          <div className="wk-comparison-header">
            <span className="wk-col-label wk-col-typical">Them</span>
            <span className="wk-col-label wk-col-kine">Kine</span>
          </div>

          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">You get a workout. No explanation for why those exercises, in that order, at that weight.</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Every exercise comes with a reason &mdash; why it&apos;s in your session, what you should feel, form cues, and where to go next. You learn as you train.</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">Miss a session and you&apos;re behind. Miss a week and you&apos;re starting over.</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Life happens. Swap exercises, move days around, take time off. When you come back, you get a rebuilding plan &mdash; not a blank slate.</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">Either fully AI-generated or completely static. Nothing in between.</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">The engine is rule-based &mdash; rooted in exercise science and years of professional input. AI helps explain things in plain language. It doesn&apos;t write your programme.</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">No awareness of conditions, hormonal cycles, or life stages. One programme fits everyone.</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">PCOS, endometriosis, pelvic floor, perimenopause &mdash; each has hand-written rules that shape your programme quietly. Cycle phase adjusts volume and intensity with logic for pill, IUD, and irregular cycles.</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">Same level of guidance on day one and day one hundred.</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Early on, the app explains a lot. As you get stronger, it steps back. Week 1 tells you why. Week 7 just says &ldquo;+2.5 kg.&rdquo;</div></div>
          </div>
        </section>

        {/* vs Vibe-Coded */}
        <div className="wk-section-label">vs. Vibe-Coded Fitness Apps</div>
        <p className="wk-section-desc">The new wave of &ldquo;type a prompt, get a workout&rdquo; apps. No engine behind them, no research, no one checking the output.</p>

        <section className="wk-comparison">
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">A language model generates your entire workout. No structure, no memory of what you did last week.</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">A deterministic engine builds 3-week periodised blocks. Every rule was written by hand and reviewed by professionals. The engine can&apos;t invent exercises or change your loads on a whim.</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">You get reps and sets. That&apos;s it. No context, no coaching, nothing to learn from.</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Every exercise has a full coaching layer &mdash; why it was chosen for you, what muscles it works, form cues, breathing, condition-specific notes, and where it sits on your progression path.</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">No safety checks. Could prescribe box jumps to someone with a prolapse and not know the difference.</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Dangerous exercises are hard-filtered per condition. Pelvic floor removes all impact work. Rep range floors prevent unsafe heavy singles. Warmups adapt automatically.</div></div>
          </div>
          <div className="wk-row">
            <div className="wk-cell wk-cell-typical"><div className="wk-icon"><div className="wk-x" /></div><div className="wk-text">Built over a weekend, shipped without review. No professional input at any stage.</div></div>
            <div className="wk-cell wk-cell-kine"><div className="wk-icon">{check}</div><div className="wk-text">Years of research turned into rules, not prompts. Shaped by professionals across exercise science, women&apos;s health, data privacy, and engineering. AI helps with language &mdash; it never touches the programme itself.</div></div>
          </div>
        </section>

        {/* Built to a Standard */}
        <div className="wk-section-label">Built to Leading Standards</div>
        <p className="wk-section-desc">Most fitness apps ship fast and fix later. Kine was built the way software should be &mdash; tested, reviewed, and held to account.</p>

        <div className="wk-trust-grid">
          <div className="wk-trust-card">
            <div className="wk-trust-title">Every Rule is Tested</div>
            <p>Hundreds of automated specs verify the engine before anything ships. Condition filters, cycle logic, volume caps, rep ranges &mdash; all tested against real scenarios, not just happy paths.</p>
          </div>
          <div className="wk-trust-card">
            <div className="wk-trust-title">Compliance Engine</div>
            <p>A dedicated compliance layer checks every programme the engine produces. If a session violates a condition rule, a volume cap, or a safety boundary, it doesn&apos;t ship. Full stop.</p>
          </div>
          <div className="wk-trust-card">
            <div className="wk-trust-title">Spec-Driven Development</div>
            <p>Every feature starts with a specification, not a prompt. Conditions, life stages, cycle logic &mdash; each one has a written spec reviewed by professionals before a single line of code is written.</p>
          </div>
          <div className="wk-trust-card">
            <div className="wk-trust-title">AI Has Boundaries</div>
            <p>AI writes coaching text in plain language. It never generates exercises, sets loads, or makes programme decisions. The engine is deterministic &mdash; same inputs always produce the same output.</p>
          </div>
          <div className="wk-trust-card">
            <div className="wk-trust-title">Privacy by Default</div>
            <p>No tracking, no ads, no data sales. Health data is GDPR special-category with explicit opt-in. Progress photos never leave your device. Your data is yours to export or delete at any time.</p>
          </div>
          <div className="wk-trust-card">
            <div className="wk-trust-title">Closed Loop by Design</div>
            <p>No wearable imports, no social feeds. Self-report is the signal. External data creates noise without improving your training. Everything the engine needs, it asks you directly.</p>
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
