"use client";

import { useState } from "react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="landing-page">
      <style>{`
        .landing-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px 20px;
          position: relative;
          overflow: hidden;
          background: #13110f;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          color: #f0ebe6;
        }
        .landing-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/hero-bg.JPG') center/cover no-repeat;
          opacity: 0.05;
          pointer-events: none;
        }
        .lp-layout {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          max-width: 980px;
          width: 100%;
          animation: lpFadeUp 1s ease-out;
        }
        @keyframes lpFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-layout { animation: none; }
          .lp-waitlist-success { animation: none; }
        }
        .lp-content {
          flex: 1;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          letter-spacing: 6px;
          line-height: 1;
          margin: 0;
          font-weight: 400;
        }
        .lp-logo .lp-k { color: #c49098; }
        .lp-logo .lp-rest { color: #f0ebe6; }
        .lp-headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          line-height: 1.5;
          color: #c4bdb5;
          max-width: 380px;
        }
        .lp-headline strong {
          color: #f0ebe6;
          font-weight: 500;
        }
        .lp-subline {
          font-size: 17px;
          line-height: 1.6;
          color: #8a847d;
          max-width: 380px;
        }
        .lp-body {
          font-size: 14px;
          line-height: 1.6;
          color: #8a847d;
          max-width: 360px;
        }
        .lp-body em {
          color: #c49098;
          font-style: normal;
        }
        .lp-waitlist {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 0;
        }
        .lp-waitlist-form {
          display: flex;
          width: 100%;
          max-width: 360px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #2a2722;
          background: #1a1815;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .lp-waitlist-form:focus-within {
          border-color: rgba(196, 144, 152, 0.3);
          box-shadow: 0 0 24px rgba(196, 144, 152, 0.04);
        }
        .lp-waitlist-form input {
          flex: 1;
          padding: 14px 16px;
          background: transparent;
          border: none;
          color: #f0ebe6;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          outline: none;
        }
        .lp-waitlist-form input:focus-visible {
          outline: 2px solid #c49098;
          outline-offset: -2px;
          border-radius: 4px;
        }
        .lp-waitlist-form input::placeholder { color: #808080; }
        .lp-waitlist-form button {
          padding: 14px 28px;
          background: #c49098;
          border: none;
          color: #13110f;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
          letter-spacing: 0.5px;
        }
        .lp-waitlist-form button:hover { background: #d4a5ad; }
        .lp-waitlist-form button:disabled { opacity: 0.6; }
        .lp-waitlist-success {
          font-size: 14px;
          color: #c49098;
          letter-spacing: 0.3px;
          animation: lpFadeUp 0.4s ease-out;
        }
        .lp-waitlist-error {
          font-size: 13px;
          color: #ff8a80;
          letter-spacing: 0.3px;
        }
        .lp-waitlist-note {
          font-size: 11px;
          color: #8a847d;
          max-width: 300px;
        }
        .lp-access {
          margin-top: 0;
        }
        .lp-access a {
          font-size: 12px;
          color: #a09a93;
          text-decoration: none;
          transition: color 0.2s;
          letter-spacing: 0.3px;
        }
        .lp-access a:hover { color: #c49098; }
        .lp-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 0;
        }
        .lp-socials {
          display: flex;
          gap: 10px;
        }
        .lp-socials a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid #2a2722;
          color: #a09a93;
          transition: border-color 0.2s, color 0.2s;
          text-decoration: none;
        }
        .lp-socials a:hover {
          border-color: #c49098;
          color: #c49098;
        }
        .lp-socials svg {
          width: 13px;
          height: 13px;
          fill: currentColor;
        }
        .lp-footer-text {
          font-size: 10px;
          color: #8a847d;
        }

        /* Phone */
        .lp-phone-wrapper {
          position: relative;
          flex-shrink: 0;
        }
        .lp-phone {
          width: 210px;
          height: 420px;
          background: #13110f;
          border-radius: 32px;
          border: 2px solid #2a2722;
          overflow: hidden;
          position: relative;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.02),
            0 24px 80px rgba(0,0,0,0.5),
            0 0 40px rgba(196, 144, 152, 0.04);
        }
        .lp-phone::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 24px;
          background: #13110f;
          border-radius: 0 0 16px 16px;
          z-index: 10;
        }
        .lp-phone-screen {
          width: 100%;
          height: 100%;
          padding: 42px 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #13110f;
        }
        .lp-phone-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2px 8px;
        }
        .lp-ph-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 14px;
          letter-spacing: 2px;
          font-weight: 400;
        }
        .lp-ph-logo .lpk { color: #c49098; }
        .lp-ph-logo .lpr { color: #f0ebe6; }
        .lp-ph-phase {
          font-size: 7px;
          color: #8a847d;
          letter-spacing: 0.5px;
        }
        .lp-ph-hero {
          width: 100%;
          height: 70px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(196,144,152,0.15) 0%, rgba(196,144,152,0.05) 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 10px 12px;
          position: relative;
          overflow: hidden;
        }
        .lp-ph-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/hero-bg.JPG') center/cover no-repeat;
          opacity: 0.15;
        }
        .lp-ph-hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          color: #f0ebe6;
          font-weight: 400;
          position: relative;
          z-index: 1;
        }
        .lp-ph-hero-meta {
          font-size: 8px;
          color: rgba(240,235,230,0.6);
          position: relative;
          z-index: 1;
        }
        .lp-ph-exercise {
          background: #1a1815;
          border: 1px solid #2a2722;
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lp-ph-ex-thumb {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(196,144,152,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lp-ph-ex-thumb svg {
          width: 10px;
          height: 10px;
          fill: #c49098;
          opacity: 0.6;
        }
        .lp-ph-ex-info {
          flex: 1;
          min-width: 0;
        }
        .lp-ph-ex-name {
          font-size: 10px;
          font-weight: 400;
          color: #f0ebe6;
        }
        .lp-ph-ex-rx {
          font-size: 8px;
          color: #8a847d;
          font-weight: 300;
        }
        .lp-ph-cycle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: #1a1815;
          border: 1px solid #2a2722;
          border-radius: 14px;
        }
        .lp-ph-cycle-bar {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: #23201b;
          overflow: hidden;
          display: flex;
        }
        .lp-ph-cycle-seg {
          height: 100%;
        }
        .lp-ph-cycle-label {
          font-size: 7px;
          color: #8a847d;
          white-space: nowrap;
        }
        .lp-ph-nav {
          margin-top: auto;
          display: flex;
          justify-content: space-around;
          padding-top: 8px;
          border-top: 1px solid #2a2722;
        }
        .lp-ph-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-size: 7px;
          color: #3a3530;
          letter-spacing: 0.3px;
        }
        .lp-ph-nav-item.active { color: #c49098; }
        .lp-ph-nav-item svg {
          width: 14px;
          height: 14px;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.5;
        }
        .lp-phone-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 340px;
          height: 440px;
          background: radial-gradient(circle, rgba(196, 144, 152, 0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: -1;
        }

        @media (max-width: 768px) {
          .landing-page {
            padding: 16px 16px;
            justify-content: flex-start;
            padding-top: 4vh;
          }
          .lp-layout {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
          .lp-content {
            align-items: center;
            gap: 8px;
          }
          .lp-logo { font-size: 48px; letter-spacing: 6px; }
          .lp-headline { font-size: 17px; max-width: 360px; text-align: center; }
          .lp-subline { font-size: 12px; max-width: 360px; text-align: center; }
          .lp-body { font-size: 13px; max-width: 300px; text-align: center; }
          .lp-waitlist { align-items: center; }
          .lp-waitlist-form { max-width: 320px; flex-direction: column; border-radius: 16px; }
          .lp-waitlist-form input { padding: 12px 14px; font-size: 13px; }
          .lp-waitlist-form button { padding: 12px 20px; font-size: 12px; border-radius: 0 0 16px 16px; }
          .lp-waitlist-note { text-align: center; }
          .lp-phone { width: 140px; height: 260px; border-radius: 20px; }
          .lp-phone::before { width: 60px; height: 16px; }
          .lp-phone-screen { padding: 24px 10px 10px; gap: 6px; }
          .lp-ph-logo { font-size: 10px; }
          .lp-ph-hero { height: 50px; border-radius: 10px; }
          .lp-ph-hero-title { font-size: 12px; }
          .lp-ph-exercise { padding: 8px 10px; border-radius: 10px; }
          .lp-ph-ex-thumb { width: 24px; height: 24px; border-radius: 8px; }
          .lp-ph-cycle { padding: 6px 8px; border-radius: 10px; }
          .lp-ph-nav { display: none; }
          .lp-phone-glow { width: 220px; height: 300px; }
          .lp-footer { display: none; }
        }
        @media (max-width: 390px) {
          .lp-logo { font-size: 40px; }
          .lp-headline { font-size: 19px; max-width: 300px; }
          .lp-phone { width: 210px; height: 420px; }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />

      <div className="lp-layout">
        <div className="lp-content">
          <h1 className="lp-logo">
            <span className="lp-k">K</span><span className="lp-rest">INĒ</span>
          </h1>

          <p className="lp-headline">
            <strong>Most programmes weren&apos;t built for your body.</strong>
          </p>

          <p className="lp-subline">
            Showing up is the hard part. Kinē handles everything else.
          </p>

          <p className="lp-body">
            Structured progression that shifts when your life does. No guilt. No starting over. Every decision explained.
          </p>

          <div className="lp-waitlist">
            {!submitted ? (
              <form className="lp-waitlist-form" onSubmit={handleWaitlist}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  required
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                  {loading ? "..." : "Join the waitlist"}
                </button>
              </form>
            ) : (
              <div className="lp-waitlist-success" role="status" aria-live="polite">
                You&apos;re in. We&apos;ll let you know when it&apos;s your turn.
              </div>
            )}
          </div>

          {error && <div className="lp-waitlist-error" role="alert">{error}</div>}
          <div className="lp-waitlist-note">Currently in private beta testing.</div>

          <div className="lp-access">
            <a href="/access">Already have access? →</a>
          </div>

          <div className="lp-footer">
            <div className="lp-socials">
              <a href="https://www.instagram.com/_kinefitness" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@kine_app" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z"/></svg>
              </a>
            </div>
            <div className="lp-footer-text">
              <a href="/terms" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: '#888' }}>Terms</a>
              {' · '}
              <a href="/privacy" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: '#888' }}>Privacy</a>
              {' · '}
              <a href="/internal" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: '#888' }}>Internal</a>
              {' · '}
              &copy; 2026 Kinē
            </div>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="lp-phone-wrapper">
          <div className="lp-phone-glow"></div>
          <div className="lp-phone">
            <div className="lp-phone-screen">
              <div className="lp-phone-top">
                <div className="lp-ph-logo"><span className="lpk">K</span><span className="lpr">INĒ</span></div>
                <div className="lp-ph-phase">Follicular · Week 2</div>
              </div>

              <div className="lp-ph-hero">
                <div className="lp-ph-hero-title">Upper Push</div>
                <div className="lp-ph-hero-meta">Tuesday · ~45 min · 5 exercises</div>
              </div>

              <div className="lp-ph-exercise">
                <div className="lp-ph-ex-thumb">
                  <svg viewBox="0 0 24 24"><polygon points="10 8 16 12 10 16 10 8"/></svg>
                </div>
                <div className="lp-ph-ex-info">
                  <div className="lp-ph-ex-name">Dumbbell Bench Press</div>
                  <div className="lp-ph-ex-rx">3 × 10 · Push</div>
                </div>
              </div>

              <div className="lp-ph-exercise">
                <div className="lp-ph-ex-thumb">
                  <svg viewBox="0 0 24 24"><polygon points="10 8 16 12 10 16 10 8"/></svg>
                </div>
                <div className="lp-ph-ex-info">
                  <div className="lp-ph-ex-name">Overhead Press</div>
                  <div className="lp-ph-ex-rx">3 × 8 · Push</div>
                </div>
              </div>

              <div className="lp-ph-cycle">
                <div className="lp-ph-cycle-bar">
                  <div className="lp-ph-cycle-seg" style={{ width: '25%', background: '#b05a5a' }}></div>
                  <div className="lp-ph-cycle-seg" style={{ width: '35%', background: '#6a9a7a' }}></div>
                  <div className="lp-ph-cycle-seg" style={{ width: '15%', background: '#c49098' }}></div>
                  <div className="lp-ph-cycle-seg" style={{ width: '25%', background: '#8a7a5a' }}></div>
                </div>
                <div className="lp-ph-cycle-label">Day 10</div>
              </div>

              <div className="lp-ph-nav">
                <div className="lp-ph-nav-item active">
                  <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  Home
                </div>
                <div className="lp-ph-nav-item">
                  <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Progress
                </div>
                <div className="lp-ph-nav-item">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
                  Profile
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
