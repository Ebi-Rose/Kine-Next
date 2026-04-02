"use client";

import { useState } from "react";

export default function InternalPage() {
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim() === "ebi1234") {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!authed) {
    return (
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#13110f",
        fontFamily: "'DM Sans', sans-serif",
        color: "#f0ebe6",
        padding: 20,
      }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          letterSpacing: 4,
          marginBottom: 8,
        }}>
          <span style={{ color: "#c49098" }}>K</span>INĒ
        </h1>
        <p style={{ fontSize: 14, color: "#8a847d", marginBottom: 24 }}>Internal access</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 280, alignItems: "center" }}>
          <input
            type="password"
            placeholder="Access code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(false); }}
            autoFocus
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#1a1815",
              border: error ? "1px solid #c44" : "1px solid #2a2722",
              borderRadius: 12,
              color: "#f0ebe6",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              textAlign: "center",
              letterSpacing: 2,
            }}
          />
          {error && <p style={{ fontSize: 12, color: "#c44", margin: 0 }}>Wrong code</p>}
          <button type="submit" style={{
            padding: "10px 32px",
            background: "#c49098",
            border: "none",
            borderRadius: 12,
            color: "#13110f",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}>
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#13110f",
      fontFamily: "'DM Sans', sans-serif",
      color: "#f0ebe6",
      padding: "40px 20px",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28,
          letterSpacing: 4,
          marginBottom: 32,
        }}>
          <span style={{ color: "#c49098" }}>K</span>INĒ <span style={{ fontSize: 14, color: "#8a847d", letterSpacing: 1 }}>internal</span>
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a href="/filming-checklist.html" style={{
            display: "block",
            padding: "20px 24px",
            background: "#1a1815",
            border: "1px solid #2a2722",
            borderRadius: 16,
            color: "#f0ebe6",
            textDecoration: "none",
            transition: "border-color 0.2s",
          }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Filming Day Checklist</div>
            <div style={{ fontSize: 12, color: "#8a847d" }}>107 exercises with step-by-step guides, warm-ups, and TikTok references</div>
          </a>
        </div>
      </div>
    </div>
  );
}
