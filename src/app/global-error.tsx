"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#13110f",
            color: "#f0ebe6",
            fontFamily: "system-ui, sans-serif",
            padding: 24,
            gap: 16,
          }}
        >
          <p
            style={{
              fontSize: 28,
              fontWeight: 300,
              letterSpacing: "0.25em",
            }}
          >
            <span style={{ color: "#c49098" }}>K</span>INĒ
          </p>
          <p style={{ color: "#8a8480", fontSize: 14, textAlign: "center" }}>
            Something went wrong. Try refreshing.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                background: "#c49098",
                color: "#fff",
                border: "none",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
            <a
              href="/"
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                background: "transparent",
                color: "#f0ebe6",
                border: "1px solid #2a2724",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
