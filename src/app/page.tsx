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
          max-width: 1060px;
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
          .lp-phone-1, .lp-phone-2 { animation: none; }
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
        .lp-access { margin-top: 0; }
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
        .lp-socials { display: flex; gap: 10px; }
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
        .lp-socials a:hover { border-color: #c49098; color: #c49098; }
        .lp-socials svg { width: 13px; height: 13px; fill: currentColor; }
        .lp-footer-text { font-size: 10px; color: #999; }
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
        .lp-why-kine-link:hover { color: #b07880; border-color: #b07880; }
        .lp-why-kine-link svg {
          width: 14px; height: 14px;
          stroke: currentColor; fill: none; stroke-width: 1.5;
          transition: transform 0.2s;
        }
        .lp-why-kine-link:hover svg { transform: translateX(2px); }

        /* ─── TWO PHONES ─── */
        .lp-phones-wrapper {
          position: relative;
          flex-shrink: 0;
          width: 340px;
          height: 520px;
        }
        .lp-phones-glow {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 440px; height: 540px;
          background: radial-gradient(ellipse, rgba(196, 144, 152, 0.1) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .lp-phone {
          position: absolute;
          width: 200px;
          height: 420px;
          transform-style: preserve-3d;
          z-index: 1;
        }
        /* Front face — the visible phone */
        .lp-phone-face {
          position: absolute;
          inset: 0;
          border-radius: 30px;
          background: linear-gradient(145deg, #dbb3ba, #c49098, #b8868e);
          padding: 3px;
          box-shadow:
            0 20px 60px rgba(0,0,0,0.25),
            0 8px 24px rgba(0,0,0,0.15),
            0 0 40px rgba(196, 144, 152, 0.08);
          /* Subtle frame highlight */
          border: 1px solid rgba(255,255,255,0.12);
        }
        /* Left side edge — real 3D depth */
        .lp-phone-edge-left {
          position: absolute;
          top: 8px;
          bottom: 8px;
          left: 0;
          width: 420px;
          transform-origin: left center;
          transform: rotateY(-90deg);
          background: linear-gradient(180deg, #c49098 0%, #b07880 40%, #9e6a72 100%);
          border-radius: 2px;
          width: 8px;
        }
        /* Bottom edge — visible from angle */
        .lp-phone-edge-bottom {
          position: absolute;
          bottom: 0;
          left: 8px;
          right: 8px;
          height: 8px;
          transform-origin: bottom center;
          transform: rotateX(90deg);
          background: linear-gradient(90deg, #b07880, #c49098, #b07880);
          border-radius: 2px;
        }
        /* Side buttons — volume + power */
        .lp-phone-buttons {
          position: absolute;
          left: -3px;
          top: 95px;
          width: 3px;
          height: 24px;
          background: linear-gradient(180deg, #d4a5ad, #b8868e);
          border-radius: 2px 0 0 2px;
          box-shadow: 0 34px 0 0 #c49098, 0 48px 0 0 #c49098;
        }
        /* Power button — right side */
        .lp-phone-power {
          position: absolute;
          right: -3px;
          top: 120px;
          width: 3px;
          height: 30px;
          background: linear-gradient(180deg, #d4a5ad, #b8868e);
          border-radius: 0 2px 2px 0;
        }
        .lp-phone-inner {
          width: 100%; height: 100%;
          border-radius: 27px;
          overflow: hidden;
          position: relative;
          background: #111;
          box-shadow:
            inset 0 0 0 1px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .lp-phone-inner::before {
          content: '';
          position: absolute;
          top: 6px; left: 50%;
          transform: translateX(-50%);
          width: 64px; height: 16px;
          background: #111;
          border-radius: 10px;
          z-index: 10;
        }
        /* Screen glass reflection */
        .lp-phone-inner::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg,
            rgba(255,255,255,0.06) 0%,
            transparent 40%,
            transparent 60%,
            rgba(255,255,255,0.03) 100%);
          pointer-events: none;
          z-index: 11;
          border-radius: 27px;
        }
        .lp-phone-inner-light { background: #E8E8E8; }
        .lp-phone-inner-light::before { background: #E8E8E8; }

        .lp-phone-1 {
          left: 10px; top: 30px;
          transform: perspective(800px) rotateY(12deg) rotateX(5deg) rotateZ(-12deg);
          z-index: 3;
          animation: lpFloat1 4s ease-in-out infinite;
        }
        .lp-phone-2 {
          right: -20px; top: 60px;
          transform: perspective(800px) rotateY(-8deg) rotateX(-3deg) rotateZ(8deg);
          z-index: 2;
          animation: lpFloat2 4s ease-in-out infinite 0.5s;
        }
        @keyframes lpFloat1 {
          0%, 100% { transform: perspective(800px) rotateY(12deg) rotateX(5deg) rotateZ(-12deg) translateY(0); }
          50% { transform: perspective(800px) rotateY(12deg) rotateX(5deg) rotateZ(-12deg) translateY(-10px); }
        }
        @keyframes lpFloat2 {
          0%, 100% { transform: perspective(800px) rotateY(-8deg) rotateX(-3deg) rotateZ(8deg) translateY(0); }
          50% { transform: perspective(800px) rotateY(-8deg) rotateX(-3deg) rotateZ(8deg) translateY(-8px); }
        }

        /* Screen content shared */
        .lp-ph-screen {
          width: 100%; height: 100%;
          display: flex; flex-direction: column; gap: 6px;
        }
        .lp-ph-screen-dark { background: #13110f; padding: 32px 12px 12px; }
        .lp-ph-screen-light { background: #FAFAFA; padding: 32px 12px 12px; }

        .lp-ph-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px; letter-spacing: 2px; font-weight: 400;
          padding: 0 2px 6px;
        }
        .lp-ph-screen-dark .lp-ph-logo .lpk { color: #c49098; }
        .lp-ph-screen-dark .lp-ph-logo .lpr { color: #f0ebe6; }
        .lp-ph-screen-light .lp-ph-logo .lpk { color: #c49098; }
        .lp-ph-screen-light .lp-ph-logo .lpr { color: #1A1A1A; }

        .lp-ph-week { font-size: 6px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 400; padding: 0 2px; }
        .lp-ph-screen-dark .lp-ph-week { color: #8a847d; }

        .lp-ph-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px; font-weight: 300; font-style: italic;
          margin: -2px 0 4px; padding: 0 2px;
        }
        .lp-ph-screen-dark .lp-ph-title { color: #f0ebe6; }

        .lp-ph-badge {
          display: inline-block; font-size: 5px; letter-spacing: 1px;
          text-transform: uppercase; color: #6a9a7a;
          border: 1px solid rgba(106,154,122,0.3);
          border-radius: 5px; padding: 2px 5px; margin: 0 2px 3px;
        }

        .lp-ph-toggle { display: flex; border-radius: 8px; overflow: hidden; margin-bottom: 2px; border: 1px solid #2a2722; }
        .lp-ph-toggle-btn { flex: 1; text-align: center; font-size: 7px; padding: 3px 0; color: #8a847d; letter-spacing: 0.3px; }
        .lp-ph-toggle-btn.active { background: rgba(196,144,152,0.15); color: #f0ebe6; }

        .lp-ph-adapt { background: #1a1815; border: 1px solid #2a2722; border-radius: 12px; padding: 8px 10px; }
        .lp-ph-adapt-header { display: flex; align-items: center; gap: 3px; margin-bottom: 3px; }
        .lp-ph-adapt-dot { width: 4px; height: 4px; border-radius: 50%; background: #6a9a7a; }
        .lp-ph-adapt-label { font-size: 5px; letter-spacing: 1px; text-transform: uppercase; color: #8a847d; font-weight: 400; }
        .lp-ph-adapt-text { font-size: 7px; line-height: 1.5; color: #c4bdb5; font-weight: 300; }
        .lp-ph-adapt-tags { display: flex; gap: 3px; margin-top: 5px; }
        .lp-ph-adapt-tag { font-size: 5px; color: #8a847d; border: 1px solid #2a2722; border-radius: 5px; padding: 2px 5px; letter-spacing: 0.3px; }

        .lp-ph-session { background: #1a1815; border: 1px solid #2a2722; border-radius: 12px; padding: 8px 10px; flex: 1; display: flex; flex-direction: column; gap: 5px; }
        .lp-ph-session-label { font-size: 5px; color: #c49098; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 500; background: rgba(196,144,152,0.1); display: inline-block; padding: 2px 5px; border-radius: 3px; width: fit-content; }
        .lp-ph-ex-row { display: flex; align-items: center; gap: 5px; padding: 1px 0; }
        .lp-ph-ex-dot { width: 3px; height: 3px; border-radius: 50%; background: #c49098; flex-shrink: 0; }
        .lp-ph-ex-name { flex: 1; font-size: 8px; font-weight: 400; color: #f0ebe6; }
        .lp-ph-ex-rx { font-size: 7px; color: #8a847d; font-weight: 300; white-space: nowrap; }
        .lp-ph-start { margin-top: auto; width: 100%; padding: 7px 0; border-radius: 10px; background: #c49098; border: none; color: #13110f; font-size: 8px; font-weight: 500; letter-spacing: 0.5px; text-align: center; }

        .lp-ph-nav { margin-top: auto; display: flex; justify-content: space-around; padding-top: 6px; border-top: 1px solid #2a2722; }
        .lp-ph-nav-item { display: flex; flex-direction: column; align-items: center; gap: 1px; font-size: 6px; color: #3a3530; letter-spacing: 0.3px; }
        .lp-ph-nav-item.active { color: #c49098; }
        .lp-ph-nav-item svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 1.5; }

        /* ─── EDU SHEET (Phone 2 — light mode) ─── */
        .lp-edu-screen { padding: 0 !important; position: relative; }
        .lp-edu-backdrop { position: absolute; top: 0; left: 0; right: 0; padding: 32px 12px 12px; opacity: 0.2; }
        .lp-edu-sheet {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: #FFF; border-top: 1px solid #E8E8E8;
          border-radius: 16px 16px 0 0; padding: 10px 14px 14px;
          display: flex; flex-direction: column; gap: 8px;
          max-height: 88%; overflow: hidden;
        }
        .lp-edu-handle { width: 28px; height: 3px; background: #DDD; border-radius: 2px; margin: 0 auto 4px; }
        .lp-edu-title { font-family: 'Cormorant Garamond', serif; font-size: 14px; color: #1A1A1A; font-weight: 400; font-style: italic; }
        .lp-edu-tags { display: flex; flex-wrap: wrap; gap: 3px; }
        .lp-edu-tag-p { background: rgba(196,144,152,0.12); color: #c49098; font-size: 5px; font-weight: 500; padding: 2px 5px; border-radius: 8px; }
        .lp-edu-tag-s { background: #F4F4F4; border: 1px solid #E8E8E8; color: #999; font-size: 5px; padding: 2px 5px; border-radius: 8px; }
        .lp-edu-tag-r { background: #F4F4F4; border: 1px solid #E8E8E8; color: #999; font-size: 5px; padding: 2px 5px; border-radius: 8px; text-transform: capitalize; }
        .lp-edu-tag-c { background: rgba(196,144,152,0.06); border: 1px solid rgba(196,144,152,0.25); color: #c49098; font-size: 5px; padding: 2px 5px; border-radius: 8px; }
        .lp-edu-section { display: flex; flex-direction: column; gap: 2px; }
        .lp-edu-label { font-size: 5px; letter-spacing: 1px; text-transform: uppercase; color: #c49098; font-weight: 400; }
        .lp-edu-text { font-size: 7px; line-height: 1.5; color: #555; font-weight: 300; }
        .lp-edu-cycle { background: rgba(196,144,152,0.05); border: 1px solid rgba(196,144,152,0.2); border-radius: 8px; padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; }
        .lp-edu-cue { display: flex; align-items: flex-start; gap: 4px; font-size: 7px; color: #555; font-weight: 300; line-height: 1.5; }
        .lp-edu-cue-dot { color: #c49098; flex-shrink: 0; margin-top: -1px; }
        .lp-edu-prog { border-top: 1px solid #E8E8E8; padding-top: 6px; display: flex; flex-direction: column; gap: 3px; }
        .lp-edu-prog-row { display: flex; justify-content: space-between; }
        .lp-edu-prog-easier { font-size: 6px; color: #6a9a7a; }
        .lp-edu-prog-harder { font-size: 6px; color: #c49098; }
        .lp-edu-prog-name { font-size: 6px; color: #8a847d; font-weight: 300; }

        @media (max-width: 768px) {
          .landing-page { padding: 16px; justify-content: flex-start; padding-top: 4vh; }
          .lp-layout { flex-direction: column; gap: 24px; text-align: center; }
          .lp-content { align-items: center; gap: 8px; }
          .lp-logo { font-size: 48px; letter-spacing: 6px; }
          .lp-headline { font-size: 17px; max-width: 360px; text-align: center; }
          .lp-subline { font-size: 12px; max-width: 360px; text-align: center; }
          .lp-body { font-size: 13px; max-width: 300px; text-align: center; }
          .lp-waitlist { align-items: center; }
          .lp-waitlist-form { max-width: 320px; flex-direction: column; border-radius: 16px; }
          .lp-waitlist-form input { padding: 12px 14px; font-size: 13px; }
          .lp-waitlist-form button { padding: 12px 20px; font-size: 12px; border-radius: 0 0 16px 16px; }
          .lp-waitlist-note { text-align: center; }
          .lp-phones-wrapper { width: 260px; height: 380px; }
          .lp-phone { width: 140px; height: 300px; }
          .lp-phone-face { border-radius: 22px; padding: 2px; }
          .lp-phone-buttons { top: 70px; height: 18px; }
          .lp-phone-power { top: 90px; height: 22px; }
          .lp-phone-edge-left { width: 6px; }
          .lp-phone-inner { border-radius: 20px; }
          .lp-phone-inner::before { width: 44px; height: 10px; top: 4px; border-radius: 6px; }
          .lp-phone-1 { left: 5px; top: 10px; }
          .lp-phone-2 { right: -10px; top: 30px; }
          .lp-ph-screen { gap: 3px; }
          .lp-ph-screen-dark, .lp-ph-screen-light { padding: 20px 8px 8px; }
          .lp-ph-logo { font-size: 8px; padding-bottom: 3px; }
          .lp-ph-week { font-size: 5px; }
          .lp-ph-title { font-size: 11px; margin: -1px 0 2px; }
          .lp-ph-badge { font-size: 4px; padding: 1px 4px; margin-bottom: 2px; }
          .lp-ph-toggle { border-radius: 6px; margin-bottom: 1px; }
          .lp-ph-toggle-btn { font-size: 5px; padding: 2px 0; }
          .lp-ph-adapt { padding: 5px 7px; border-radius: 8px; }
          .lp-ph-adapt-label { font-size: 4px; }
          .lp-ph-adapt-text { font-size: 5px; }
          .lp-ph-adapt-tags { gap: 2px; margin-top: 3px; }
          .lp-ph-adapt-tag { font-size: 4px; padding: 1px 3px; }
          .lp-ph-session { padding: 5px 7px; border-radius: 8px; gap: 3px; }
          .lp-ph-session-label { font-size: 4px; padding: 1px 4px; }
          .lp-ph-ex-row { gap: 3px; }
          .lp-ph-ex-dot { width: 2px; height: 2px; }
          .lp-ph-ex-name { font-size: 6px; }
          .lp-ph-ex-rx { font-size: 5px; }
          .lp-ph-start { padding: 5px 0; border-radius: 7px; font-size: 6px; }
          .lp-ph-nav { display: none; }
          .lp-edu-sheet { padding: 6px 8px 8px; gap: 5px; border-radius: 12px 12px 0 0; }
          .lp-edu-handle { width: 20px; height: 2px; margin-bottom: 2px; }
          .lp-edu-title { font-size: 10px; }
          .lp-edu-tags { gap: 2px; }
          .lp-edu-tag-p, .lp-edu-tag-s, .lp-edu-tag-r, .lp-edu-tag-c { font-size: 4px; padding: 1px 3px; }
          .lp-edu-label { font-size: 4px; }
          .lp-edu-text { font-size: 5px; }
          .lp-edu-cycle { padding: 4px 6px; border-radius: 6px; }
          .lp-edu-cue { font-size: 5px; gap: 3px; }
          .lp-edu-prog { padding-top: 4px; gap: 2px; }
          .lp-edu-prog-easier, .lp-edu-prog-harder, .lp-edu-prog-name { font-size: 4px; }
          .lp-footer { flex-direction: column; align-items: center; gap: 8px; }
        }
        @media (max-width: 390px) {
          .lp-logo { font-size: 40px; }
          .lp-headline { font-size: 19px; max-width: 300px; }
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

        {/* Two phone mockups — rose gold frames, floating */}
        <div className="lp-phones-wrapper">
          <div className="lp-phones-glow"></div>

          {/* Phone 1 — Front, dark mode, glute day */}
          <div className="lp-phone lp-phone-1">
            <div className="lp-phone-buttons"></div>
            <div className="lp-phone-power"></div>
            <div className="lp-phone-edge-left"></div>
            <div className="lp-phone-edge-bottom"></div>
            <div className="lp-phone-face">
            <div className="lp-phone-inner">
              <div className="lp-ph-screen lp-ph-screen-dark">
                <div className="lp-ph-logo"><span className="lpk">K</span><span className="lpr">INĒ</span></div>
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
                  <div className="lp-ph-adapt-text">Building your base — higher reps, moderate load. Volume is the primary driver right now.</div>
                  <div className="lp-ph-adapt-tags">
                    <div className="lp-ph-adapt-tag">Accumulation block</div>
                    <div className="lp-ph-adapt-tag">Effort trending high</div>
                  </div>
                </div>

                <div className="lp-ph-session">
                  <div className="lp-ph-session-label">Today</div>
                  <div className="lp-ph-ex-row"><div className="lp-ph-ex-dot"></div><div className="lp-ph-ex-name">Hip Thrust</div><div className="lp-ph-ex-rx">3×12</div></div>
                  <div className="lp-ph-ex-row"><div className="lp-ph-ex-dot"></div><div className="lp-ph-ex-name">Romanian Deadlift</div><div className="lp-ph-ex-rx">3×10</div></div>
                  <div className="lp-ph-ex-row"><div className="lp-ph-ex-dot"></div><div className="lp-ph-ex-name">Bulgarian Split Squat</div><div className="lp-ph-ex-rx">3×10</div></div>
                  <div className="lp-ph-ex-row"><div className="lp-ph-ex-dot"></div><div className="lp-ph-ex-name">Cable Kickback</div><div className="lp-ph-ex-rx">3×15</div></div>
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

          {/* Phone 2 — Back, light mode, Hip Thrust education sheet */}
          <div className="lp-phone lp-phone-2">
            <div className="lp-phone-buttons"></div>
            <div className="lp-phone-power"></div>
            <div className="lp-phone-edge-left"></div>
            <div className="lp-phone-edge-bottom"></div>
            <div className="lp-phone-face">
            <div className="lp-phone-inner lp-phone-inner-light">
              <div className="lp-ph-screen lp-ph-screen-light lp-edu-screen">
                <div className="lp-edu-backdrop">
                  <div className="lp-ph-logo"><span className="lpk">K</span><span className="lpr">INĒ</span></div>
                  <div className="lp-ph-ex-row" style={{ opacity: 0.3 }}>
                    <div className="lp-ph-ex-dot"></div>
                    <div className="lp-ph-ex-name" style={{ color: '#1A1A1A' }}>Hip Thrust</div>
                    <div className="lp-ph-ex-rx" style={{ color: '#999' }}>3×12</div>
                  </div>
                </div>

                <div className="lp-edu-sheet">
                  <div className="lp-edu-handle"></div>
                  <div className="lp-edu-title">Hip Thrust</div>

                  <div className="lp-edu-tags">
                    <span className="lp-edu-tag-p">Glutes</span>
                    <span className="lp-edu-tag-p">Hamstrings</span>
                    <span className="lp-edu-tag-s">Core</span>
                    <span className="lp-edu-tag-r">primary pull</span>
                    <span className="lp-edu-tag-c">cycle-aware</span>
                  </div>

                  <div className="lp-edu-section">
                    <div className="lp-edu-label">Why this exercise</div>
                    <div className="lp-edu-text">The highest glute activator in your programme. Loaded hip extension with no spinal compression — safe to push hard without lower-back risk.</div>
                  </div>

                  <div className="lp-edu-cycle">
                    <div className="lp-edu-label">This week</div>
                    <div className="lp-edu-text" style={{ fontStyle: 'italic' }}>Follicular phase — recovery is strong right now. You can push volume and tolerate more work than usual.</div>
                  </div>

                  <div className="lp-edu-section">
                    <div className="lp-edu-label">What you should feel</div>
                    <div className="lp-edu-text">A deep burn across both glutes at lockout. If you feel it in your quads or lower back, check your foot position.</div>
                  </div>

                  <div className="lp-edu-section">
                    <div className="lp-edu-label">Form cues</div>
                    <div className="lp-edu-cue"><span className="lp-edu-cue-dot">•</span> Drive through your heels, not your toes</div>
                    <div className="lp-edu-cue"><span className="lp-edu-cue-dot">•</span> Tuck your chin slightly at the top</div>
                    <div className="lp-edu-cue"><span className="lp-edu-cue-dot">•</span> Pause for 1s at full lockout</div>
                  </div>

                  <div className="lp-edu-prog">
                    <div className="lp-edu-label" style={{ color: '#999' }}>Progression</div>
                    <div className="lp-edu-prog-row">
                      <span className="lp-edu-prog-easier">← Easier</span>
                      <span className="lp-edu-prog-harder">Harder →</span>
                    </div>
                    <div className="lp-edu-prog-row">
                      <span className="lp-edu-prog-name">Glute Bridge</span>
                      <span className="lp-edu-prog-name">Barbell Hip Thrust</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
