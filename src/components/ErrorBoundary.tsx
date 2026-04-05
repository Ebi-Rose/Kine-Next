"use client";

import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack ?? undefined } } });
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  handleHardReset = () => {
    localStorage.removeItem("kine_v2");
    localStorage.removeItem("kine_dk");
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#111111",
        color: "#ffffff",
        fontFamily: "var(--font-body), system-ui, sans-serif",
        textAlign: "center",
        gap: "1rem",
      }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: "#999", maxWidth: "28ch", lineHeight: 1.5 }}>
          An unexpected error occurred. Try reloading — if it keeps happening, reset the app.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            onClick={this.handleReset}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #333",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
              outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.outline = "2px solid #C49098"; e.currentTarget.style.outlineOffset = "3px"; }}
            onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
          >
            Try again
          </button>
          <button
            onClick={this.handleHardReset}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#C49098",
              color: "#111",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
              outline: "none",
            }}
            onFocus={(e) => { e.currentTarget.style.outline = "2px solid #C49098"; e.currentTarget.style.outlineOffset = "3px"; }}
            onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
          >
            Reset app
          </button>
        </div>
      </div>
    );
  }
}
