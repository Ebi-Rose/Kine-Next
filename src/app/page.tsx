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
          background: #FAFAFA;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          color: #1A1A1A;
        }
        .landing-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/hero-bg-opt.jpg') center/cover no-repeat;
          opacity: 0.03;
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
        .lp-logo .lp-rest { color: #1A1A1A; }
        .lp-headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          line-height: 1.5;
          color: #666;
          max-width: 380px;
        }
        .lp-headline strong {
          color: #1A1A1A;
          font-weight: 500;
        }
        .lp-subline {
          font-size: 17px;
          line-height: 1.6;
          color: #777;
          max-width: 380px;
        }
        .lp-body {
          font-size: 14px;
          line-height: 1.6;
          color: #777;
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
          border: 1px solid #E0E0E0;
          background: #FFFFFF;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .lp-waitlist-form:focus-within {
          border-color: rgba(196, 144, 152, 0.4);
          box-shadow: 0 0 24px rgba(196, 144, 152, 0.08);
        }
        .lp-waitlist-form input {
          flex: 1;
          padding: 14px 16px;
          background: transparent;
          border: none;
          color: #1A1A1A;
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
        .lp-waitlist-form input::placeholder { color: #AAAAAA; }
        .lp-waitlist-form button {
          padding: 14px 28px;
          background: #c49098;
          border: none;
          color: #FFFFFF;
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
          color: #999;
          max-width: 300px;
        }
        .lp-access {
          margin-top: 0;
        }
        .lp-access a {
          font-size: 12px;
          color: #999;
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
          border: 1px solid #E0E0E0;
          color: #999;
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
          color: #999;
        }
        .lp-why-kine-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 400;
          color: #c49098;
          text-decoration: none;
          letter-spacing: 0.5px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(196, 144, 152, 0.3);
          transition: color 0.2s, border-color 0.2s;
        }
        .lp-why-kine-link:hover {
          color: #b07880;
          border-color: #b07880;
        }
        .lp-why-kine-link svg {
          width: 14px;
          height: 14px;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.5;
          transition: transform 0.2s;
        }
        .lp-why-kine-link:hover svg { transform: translateX(2px); }

        /* Phone */
        .lp-phone-wrapper {
          position: relative;
          flex-shrink: 0;
        }
        .lp-phone {
          width: 210px;
          height: 460px;
          background: #111;
          border-radius: 32px;
          border: 3px solid #1a1a1a;
          overflow: hidden;
          position: relative;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.1),
            inset 0 0 0 1px rgba(255,255,255,0.04),
            0 24px 80px rgba(0,0,0,0.2),
            0 0 40px rgba(196, 144, 152, 0.06);
        }
        .lp-phone::before {
          content: '';
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 72px;
          height: 18px;
          background: #111;
          border-radius: 12px;
          z-index: 10;
        }
        .lp-phone-screen {
          width: 100%;
          height: 100%;
          padding: 36px 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #FAFAFA;
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
        .lp-ph-logo .lpr { color: #1A1A1A; }
        .lp-ph-phase {
          font-size: 7px;
          color: #8a847d;
          letter-spacing: 0.5px;
        }
        .lp-ph-week {
          font-size: 7px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #999;
          font-weight: 400;
        }
        .lp-ph-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          color: #1A1A1A;
          font-weight: 300;
          font-style: italic;
          margin: -2px 0 4px;
        }
        .lp-ph-badge {
          display: inline-block;
          font-size: 6px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #6a9a7a;
          border: 1px solid rgba(106,154,122,0.25);
          border-radius: 6px;
          padding: 2px 6px;
          margin-bottom: 4px;
          background: rgba(106,154,122,0.06);
        }
        .lp-ph-toggle {
          display: flex;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #E0E0E0;
          margin-bottom: 2px;
        }
        .lp-ph-toggle-btn {
          flex: 1;
          text-align: center;
          font-size: 8px;
          padding: 4px 0;
          color: #999;
          letter-spacing: 0.3px;
        }
        .lp-ph-toggle-btn.active {
          background: rgba(196,144,152,0.12);
          color: #1A1A1A;
        }
        .lp-ph-adapt {
          background: #FFF;
          border: 1px solid #E8E8E8;
          border-radius: 14px;
          padding: 10px 12px;
        }
        .lp-ph-adapt-header {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        }
        .lp-ph-adapt-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6a9a7a;
        }
        .lp-ph-adapt-label {
          font-size: 6px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #999;
          font-weight: 400;
        }
        .lp-ph-adapt-text {
          font-size: 8px;
          line-height: 1.5;
          color: #555;
          font-weight: 300;
        }
        .lp-ph-adapt-tags {
          display: flex;
          gap: 4px;
          margin-top: 6px;
        }
        .lp-ph-adapt-tag {
          font-size: 6px;
          color: #999;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          padding: 2px 6px;
          letter-spacing: 0.3px;
        }
        .lp-ph-session {
          background: #FFF;
          border: 1px solid #E8E8E8;
          border-radius: 14px;
          padding: 10px 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lp-ph-session-label {
          font-size: 6px;
          color: #c49098;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          font-weight: 500;
          background: rgba(196,144,152,0.08);
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }
        .lp-ph-ex-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 1px 0;
        }
        .lp-ph-ex-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .lp-ph-ex-name {
          flex: 1;
          font-size: 9px;
          font-weight: 400;
          color: #1A1A1A;
        }
        .lp-ph-ex-rx {
          font-size: 8px;
          color: #999;
          font-weight: 300;
          white-space: nowrap;
        }
        .lp-ph-start {
          margin-top: auto;
          width: 100%;
          padding: 8px 0;
          border-radius: 12px;
          background: #c49098;
          border: none;
          color: #FFF;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-align: center;
        }
        .lp-ph-nav {
          margin-top: auto;
          display: flex;
          justify-content: space-around;
          padding-top: 8px;
          border-top: 1px solid #E8E8E8;
        }
        .lp-ph-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-size: 7px;
          color: #CCC;
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
          background: radial-gradient(circle, rgba(196, 144, 152, 0.08) 0%, transparent 70%);
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
          .lp-ph-title { font-size: 14px; }
          .lp-ph-session { padding: 8px 10px; border-radius: 10px; }
          .lp-ph-nav { display: none; }
          .lp-phone-glow { width: 220px; height: 300px; }
          .lp-footer { flex-direction: column; align-items: center; gap: 8px; }
        }
        @media (max-width: 390px) {
          .lp-logo { font-size: 40px; }
          .lp-headline { font-size: 19px; max-width: 300px; }
          .lp-phone { width: 210px; height: 460px; }
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

          <a href="/why-kine" className="lp-why-kine-link">
            Why Kine
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>

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
              <a href="/terms" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: '#CCC' }}>Terms</a>
              {' · '}
              <a href="/privacy" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: '#CCC' }}>Privacy</a>
              {' · '}
              &copy; 2026 Kinē
            </div>
          </div>
        </div>

        {/* Phone mockup — mirrors actual app home screen */}
        <div className="lp-phone-wrapper">
          <div className="lp-phone-glow"></div>
          <div className="lp-phone">
            <div className="lp-phone-screen">
              <div className="lp-phone-top">
                <div className="lp-ph-logo"><span className="lpk">K</span><span className="lpr">INĒ</span></div>
              </div>

              <div className="lp-ph-week">Week 2 · 6 Apr–12 Apr</div>
              <div className="lp-ph-title">Your Week</div>
              <div className="lp-ph-badge">Follicular · Week 1/3</div>

              <div className="lp-ph-toggle">
                <div className="lp-ph-toggle-btn active">Today</div>
                <div className="lp-ph-toggle-btn">Week</div>
              </div>

              <div className="lp-ph-adapt">
                <div className="lp-ph-adapt-header">
                  <div className="lp-ph-adapt-dot"></div>
                  <div className="lp-ph-adapt-label">Adapted for you</div>
                </div>
                <div className="lp-ph-adapt-text">
                  Building your base — higher reps, moderate load. Volume is the primary driver right now.
                </div>
                <div className="lp-ph-adapt-tags">
                  <div className="lp-ph-adapt-tag">Accumulation block</div>
                  <div className="lp-ph-adapt-tag">Effort trending high</div>
                </div>
              </div>

              <div className="lp-ph-session">
                <div className="lp-ph-session-label">Today</div>
                <div className="lp-ph-ex-row">
                  <div className="lp-ph-ex-dot" style={{ background: 'var(--dot-push, #c49098)' }}></div>
                  <div className="lp-ph-ex-name">Dumbbell Bench Press</div>
                  <div className="lp-ph-ex-rx">3×10</div>
                </div>
                <div className="lp-ph-ex-row">
                  <div className="lp-ph-ex-dot" style={{ background: 'var(--dot-push, #c49098)' }}></div>
                  <div className="lp-ph-ex-name">Overhead Press</div>
                  <div className="lp-ph-ex-rx">3×8</div>
                </div>
                <div className="lp-ph-ex-row">
                  <div className="lp-ph-ex-dot" style={{ background: 'var(--dot-push, #c49098)' }}></div>
                  <div className="lp-ph-ex-name">Incline Dumbbell Fly</div>
                  <div className="lp-ph-ex-rx">3×12</div>
                </div>
                <div className="lp-ph-ex-row">
                  <div className="lp-ph-ex-dot" style={{ background: 'var(--dot-push, #c49098)' }}></div>
                  <div className="lp-ph-ex-name">Lateral Raise</div>
                  <div className="lp-ph-ex-rx">3×15</div>
                </div>
                <div className="lp-ph-start">Start session</div>
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
