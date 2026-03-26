"use client";

import { useState } from "react";

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQsA4Mi3mSja_dvyNmkGYtr9oi9kac8KLa3Uj-45-Bo5PWGmxu8ZpOZYgoinXFUPDe/exec";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again.");
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
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          color: #f0f0f0;
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
        .lp-content {
          flex: 1;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 48px;
          letter-spacing: 6px;
          line-height: 1;
        }
        .lp-logo .lp-k { color: #c49098; }
        .lp-logo .lp-rest { color: #f0f0f0; }
        .lp-headline {
          font-size: 20px;
          line-height: 1.5;
          color: #bbb;
          max-width: 380px;
        }
        .lp-headline strong {
          color: #f0f0f0;
          font-weight: 400;
        }
        .lp-subline {
          font-size: 17px;
          line-height: 1.6;
          color: #999;
          max-width: 380px;
        }
        .lp-body {
          font-size: 14px;
          line-height: 1.6;
          color: #666;
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
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #1a1a1a;
          background: #0f0f0f;
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
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          outline: none;
        }
        .lp-waitlist-form input::placeholder { color: #333; }
        .lp-waitlist-form button {
          padding: 14px 28px;
          background: #c49098;
          border: none;
          color: #0a0a0a;
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
        .lp-waitlist-note {
          font-size: 11px;
          color: #333;
          max-width: 300px;
        }
        .lp-access {
          margin-top: 0;
        }
        .lp-access a {
          font-size: 12px;
          color: #444;
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
          border: 1px solid #1a1a1a;
          color: #383838;
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
          color: #222;
        }

        /* Phone */
        .lp-phone-wrapper {
          position: relative;
          flex-shrink: 0;
        }
        .lp-phone {
          width: 210px;
          height: 420px;
          background: #0e0e0e;
          border-radius: 32px;
          border: 2px solid #1a1a1a;
          overflow: hidden;
          position: relative;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.02),
            0 24px 80px rgba(0,0,0,0.5),
            0 0 40px rgba(196, 144, 152, 0.03);
        }
        .lp-phone::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 24px;
          background: #0a0a0a;
          border-radius: 0 0 16px 16px;
          z-index: 10;
        }
        .lp-phone-screen {
          width: 100%;
          height: 100%;
          padding: 42px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #0a0a0a;
        }
        .lp-phone-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2px 8px;
        }
        .lp-ph-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
        }
        .lp-ph-logo .lpk { color: #c49098; }
        .lp-ph-logo .lpr { color: #ddd; }
        .lp-ph-week {
          font-size: 9px;
          color: #444;
          letter-spacing: 0.5px;
        }
        .lp-ph-session {
          background: #131313;
          border: 1px solid #1a1a1a;
          border-radius: 10px;
          padding: 12px;
        }
        .lp-ph-session-title {
          font-size: 12px;
          font-weight: 400;
          color: #e0e0e0;
          letter-spacing: 0.2px;
        }
        .lp-ph-session-meta {
          font-size: 9px;
          color: #555;
          margin-top: 4px;
        }
        .lp-ph-exercise {
          background: #131313;
          border: 1px solid #1a1a1a;
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lp-ph-ex-name {
          font-size: 11px;
          font-weight: 400;
          color: #ddd;
        }
        .lp-ph-ex-rx {
          font-size: 10px;
          color: #888;
          font-weight: 300;
          font-style: italic;
        }
        .lp-ph-ex-tags {
          display: flex;
          gap: 5px;
          margin-top: 2px;
        }
        .lp-ph-tag {
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 8px;
          letter-spacing: 0.2px;
        }
        .lp-ph-tag-accent {
          background: rgba(196, 144, 152, 0.1);
          color: #c49098;
        }
        .lp-ph-tag-muted {
          background: #151515;
          color: #555;
        }
        .lp-ph-cue {
          border-left: 2px solid rgba(196, 144, 152, 0.25);
          padding: 8px 10px;
          font-size: 10px;
          color: #777;
          font-weight: 300;
          font-style: italic;
          line-height: 1.5;
        }
        .lp-ph-edu {
          background: #111;
          border: 1px solid #181818;
          border-radius: 8px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .lp-ph-edu-label {
          font-size: 7px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #444;
        }
        .lp-ph-edu-text {
          font-size: 9px;
          color: #666;
          font-weight: 300;
          line-height: 1.5;
        }
        .lp-ph-edu-text em {
          color: #c49098;
          font-style: normal;
        }
        .lp-ph-checkin-done {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 32px 16px 20px;
          text-align: center;
        }
        .lp-ph-checkin-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(196, 144, 152, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-ph-checkin-title {
          font-size: 14px;
          font-weight: 400;
          color: #e0e0e0;
          letter-spacing: 0.2px;
        }
        .lp-ph-checkin-subtitle {
          font-size: 10px;
          color: #555;
        }
        .lp-ph-adjustment {
          background: #131313;
          border: 1px solid #1a1a1a;
          border-radius: 10px;
          padding: 14px;
          border-left: 2px solid rgba(196, 144, 152, 0.3);
        }
        .lp-ph-adjustment-text {
          font-size: 11px;
          color: #888;
          font-weight: 300;
          line-height: 1.6;
        }
        .lp-ph-nav {
          margin-top: auto;
          display: flex;
          justify-content: space-around;
          padding-top: 8px;
          border-top: 1px solid #141414;
        }
        .lp-ph-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-size: 7px;
          color: #2a2a2a;
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
          .lp-waitlist-form { max-width: 320px; flex-direction: column; border-radius: 12px; }
          .lp-waitlist-form input { padding: 12px 14px; font-size: 13px; }
          .lp-waitlist-form button { padding: 12px 20px; font-size: 12px; border-radius: 0 0 12px 12px; }
          .lp-waitlist-note { text-align: center; }
          .lp-phone { width: 140px; height: 260px; border-radius: 20px; }
          .lp-phone::before { width: 60px; height: 16px; }
          .lp-phone-screen { padding: 24px 10px 10px; gap: 6px; }
          .lp-ph-logo { font-size: 10px; }
          .lp-ph-week { font-size: 7px; }
          .lp-ph-checkin-done { padding: 16px 8px 10px; gap: 4px; }
          .lp-ph-checkin-icon { width: 32px; height: 32px; }
          .lp-ph-checkin-icon svg { width: 18px; height: 18px; }
          .lp-ph-checkin-title { font-size: 10px; }
          .lp-ph-checkin-subtitle { font-size: 7px; }
          .lp-ph-adjustment { padding: 8px; }
          .lp-ph-adjustment-text { font-size: 8px; }
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

      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />

      <div className="lp-layout">
        <div className="lp-content">
          <div className="lp-logo">
            <span className="lp-k">K</span><span className="lp-rest">INĒ</span>
          </div>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                  {loading ? "..." : "Join the waitlist"}
                </button>
              </form>
            ) : (
              <div className="lp-waitlist-success">
                You&apos;re in. We&apos;ll let you know when it&apos;s your turn.
              </div>
            )}
          </div>

          <div className="lp-waitlist-note">Currently in private beta testing.</div>

          <div className="lp-access">
            <a href="/access">Already have access? →</a>
          </div>

          <div className="lp-footer">
            <div className="lp-socials">
              <a href="https://www.instagram.com/_kinefitness" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@kine_app" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z"/></svg>
              </a>
            </div>
            <div className="lp-footer-text">
              <a href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}><span style={{ borderBottom: '1px solid #333' }}>Terms</span></a>
              {' · '}
              <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}><span style={{ borderBottom: '1px solid #333' }}>Privacy</span></a>
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
                <div className="lp-ph-week">Week 2 of 4</div>
              </div>

              <div className="lp-ph-checkin-done">
                <div className="lp-ph-checkin-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#c49098" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="lp-ph-checkin-title">Check-in received</div>
                <div className="lp-ph-checkin-subtitle">Your next week has been updated.</div>
              </div>

              <div className="lp-ph-adjustment">
                <div className="lp-ph-adjustment-text">
                  Soreness was high after Tuesday&apos;s session. Next week spaces your lower body days further apart.
                </div>
              </div>

              <div className="lp-ph-nav">
                <div className="lp-ph-nav-item active">
                  <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  Home
                </div>
                <div className="lp-ph-nav-item">
                  <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Log
                </div>
                <div className="lp-ph-nav-item">
                  <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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
