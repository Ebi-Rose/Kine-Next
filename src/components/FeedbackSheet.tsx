"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import BottomSheet from "./BottomSheet";
import { getUser } from "@/lib/auth";
import { useVoiceRecorder } from "@/lib/useVoiceRecorder";
import { collectContext } from "@/lib/feedback-context";

type Category = "bug" | "idea" | "confusion" | "love";
type Severity = "low" | "medium" | "high" | "critical";

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: "bug",       label: "Bug",       emoji: "🐞" },
  { value: "idea",      label: "Idea",      emoji: "💡" },
  { value: "confusion", label: "Confusion", emoji: "🤔" },
  { value: "love",      label: "Love it",   emoji: "💖" },
];

const SEVERITIES: { value: Severity; label: string }[] = [
  { value: "low",      label: "Low" },
  { value: "medium",   label: "Medium" },
  { value: "high",     label: "High" },
  { value: "critical", label: "Blocks me" },
];

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FeedbackSheet({ open, onClose }: Props) {
  const pathname = usePathname();
  const [category, setCategory] = useState<Category>("bug");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-captured screenshot of the app at the moment the sheet opens
  const [screenshot, setScreenshot] = useState<Blob | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [includeScreenshot, setIncludeScreenshot] = useState(true);

  // Voice → transcript → summary
  const [liveTranscript, setLiveTranscript] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const { recording, supported: voiceSupported, start: startVoice, stop: stopVoice } =
    useVoiceRecorder(setLiveTranscript);

  // Ref to capture image of the page on open
  const captureOnOpenRan = useRef(false);

  // Pull signed-in user info on open + capture screenshot
  useEffect(() => {
    if (!open) {
      captureOnOpenRan.current = false;
      return;
    }

    (async () => {
      const user = await getUser();
      if (user?.email) setEmail(user.email);
      const meta = (user?.user_metadata ?? {}) as { name?: string; full_name?: string };
      setName(meta.name ?? meta.full_name ?? null);
    })();

    // Capture the underlying app once per open, before sheet finishes animating
    if (!captureOnOpenRan.current) {
      captureOnOpenRan.current = true;
      // Small delay so the sheet hasn't darkened the page yet — we capture
      // as the click fires; using requestAnimationFrame to let React mount
      requestAnimationFrame(() => { void capture(); });
    }
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStatus("idle");
        setContent("");
        setErrorMsg("");
        setLiveTranscript("");
        setSummary(null);
        setVoiceError(null);
        clearScreenshot();
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Screenshot ───────────────────────────────────────────────────
  const capture = async () => {
    setCapturing(true);
    try {
      // Dynamic import keeps modern-screenshot out of the initial bundle
      const { domToBlob } = await import("modern-screenshot");
      const target = document.querySelector("main#main-content") as HTMLElement | null
        ?? document.body;
      const blob = await domToBlob(target, {
        scale: Math.min(window.devicePixelRatio || 1, 2),
        backgroundColor: "#0f0f12",
        type: "image/png",
        quality: 0.9,
      });
      if (blob) {
        setScreenshot(blob);
        setScreenshotPreview(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.error("[feedback] capture failed", e);
    } finally {
      setCapturing(false);
    }
  };

  const clearScreenshot = () => {
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  // ── Voice ───────────────────────────────────────────────────────
  const handleStopVoice = async () => {
    const transcript = stopVoice();
    if (!transcript.trim()) {
      setVoiceError("Didn't catch that. Try again?");
      return;
    }
    setSummarizing(true);
    setVoiceError(null);
    try {
      const res = await fetch("/api/feedback/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "summarize failed");
      setSummary(data.summary);
    } catch (e) {
      setVoiceError(e instanceof Error ? e.message : "summarize failed");
      // Fallback: drop the raw transcript into content so it isn't lost
      if (!content.trim()) setContent(transcript);
    } finally {
      setSummarizing(false);
    }
  };

  const acceptSummary = () => {
    if (summary) setContent(summary);
    setSummary(null);
    setLiveTranscript("");
  };

  const rejectSummary = () => {
    setSummary(null);
    setLiveTranscript("");
  };

  // ── Submit ───────────────────────────────────────────────────────
  const submit = async () => {
    if (!content.trim() || !email.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const fd = new FormData();
      fd.append("category", category);
      if (category === "bug") fd.append("severity", severity);
      fd.append("content", content.trim());
      fd.append("email", email.trim().toLowerCase());
      if (name) fd.append("name", name);
      fd.append("screen", pathname);
      fd.append("device", navigator.userAgent);
      fd.append("app_version", APP_VERSION);
      if (screenshot && includeScreenshot) {
        fd.append("screenshot", screenshot, `auto-${Date.now()}.png`);
      }

      // Rich context snapshot (zustand state, recent routes, errors, identity)
      try {
        const ctx = await collectContext();
        fd.append("context", JSON.stringify(ctx));
      } catch { /* non-fatal */ }

      const res = await fetch("/api/feedback", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Send feedback">
      {status === "done" ? (
        <div className="py-6 text-center">
          <div className="text-2xl mb-2">✓</div>
          <div className="text-text font-medium mb-1">Got it — thank you</div>
          <div className="text-text-muted text-sm">We read every report.</div>
          <button
            onClick={onClose}
            className="mt-5 px-4 py-2 rounded-lg bg-accent/15 border border-accent/30 text-accent text-sm"
          >
            close
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-4">
          <div>
            <Label>What is it?</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`rounded-xl border px-2 py-3 flex flex-col items-center gap-1 transition-all ${
                    category === c.value
                      ? "bg-accent/15 border-accent/40 text-accent"
                      : "bg-surface border-border text-text-muted"
                  }`}
                >
                  <span className="text-lg">{c.emoji}</span>
                  <span className="text-[11px]">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {category === "bug" && (
            <div>
              <Label>How bad?</Label>
              <div className="flex gap-2">
                {SEVERITIES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSeverity(s.value)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-[11px] transition-all ${
                      severity === s.value
                        ? "bg-accent/15 border-accent/40 text-accent"
                        : "bg-surface border-border text-text-muted"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Voice flow: live transcript while recording, summary preview after stop */}
          {(recording || summarizing || summary) ? (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 flex flex-col gap-2">
              {recording && (
                <>
                  <div className="flex items-center gap-2 text-[11px] text-accent">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    Listening…
                  </div>
                  <div className="text-[12px] text-text leading-snug min-h-[2.5em]">
                    {liveTranscript || <span className="text-text-muted">Speak now</span>}
                  </div>
                  <button
                    onClick={handleStopVoice}
                    className="self-start rounded-md border border-accent/40 bg-accent/10 text-accent text-[11px] px-3 py-1"
                  >
                    Stop & summarise
                  </button>
                </>
              )}
              {summarizing && (
                <div className="text-[11px] text-text-muted">Summarising…</div>
              )}
              {summary && !summarizing && (
                <>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted">Cleaned-up version</div>
                  <textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    rows={5}
                    className="w-full rounded-md bg-surface border border-border text-text px-2 py-2 text-[12px] leading-snug focus:outline-none focus:border-accent/40"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={acceptSummary}
                      className="flex-1 rounded-md border border-accent/40 bg-accent/15 text-accent text-[11px] py-1.5"
                    >
                      Accept
                    </button>
                    <button
                      onClick={rejectSummary}
                      className="flex-1 rounded-md border border-border bg-surface text-text-muted text-[11px] py-1.5"
                    >
                      Discard
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <Label>What happened?</Label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={5}
                placeholder={
                  category === "bug" ? "What were you doing? What did you expect? What happened instead?" :
                  category === "idea" ? "What would you love to see?" :
                  category === "confusion" ? "What were you trying to do?" :
                  "Tell us…"
                }
                className="w-full rounded-lg bg-surface border border-border text-text px-3 py-2 text-sm placeholder:text-text-muted/60 focus:outline-none focus:border-accent/40"
              />
              {voiceSupported && (
                <button
                  type="button"
                  onClick={() => { setVoiceError(null); startVoice(); }}
                  className="mt-2 text-[11px] text-accent hover:underline flex items-center gap-1"
                >
                  🎙 or speak it instead
                </button>
              )}
              {voiceError && (
                <div className="mt-1 text-[11px] text-red-300">{voiceError}</div>
              )}
            </div>
          )}

          {/* Auto-captured screenshot */}
          {(capturing || screenshotPreview) && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Screenshot</Label>
                {screenshotPreview && (
                  <label className="flex items-center gap-1.5 text-[10px] text-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeScreenshot}
                      onChange={e => setIncludeScreenshot(e.target.checked)}
                      className="accent-current"
                    />
                    include
                  </label>
                )}
              </div>
              {capturing && (
                <div className="text-[11px] text-text-muted">Capturing screen…</div>
              )}
              {screenshotPreview && (
                <div className={`relative ${includeScreenshot ? "" : "opacity-40"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshotPreview}
                    alt="captured screen"
                    className="w-full max-h-48 object-contain rounded-lg border border-border bg-bg"
                  />
                </div>
              )}
            </div>
          )}

          {!email && (
            <div>
              <Label>Your email</Label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-surface border border-border text-text px-3 py-2 text-sm placeholder:text-text-muted/60 focus:outline-none focus:border-accent/40"
              />
            </div>
          )}

          <div className="text-[10px] text-text-muted/60">
            Sending: <span className="text-text-muted">{pathname}</span> · v{APP_VERSION}
          </div>

          {status === "error" && (
            <div className="text-[12px] text-red-300 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}

          <button
            onClick={submit}
            disabled={!content.trim() || !email.trim() || status === "sending" || recording || summarizing}
            className="w-full rounded-lg bg-accent/15 border border-accent/30 text-accent py-3 text-sm disabled:opacity-50"
          >
            {status === "sending" ? "sending…" : "send feedback"}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
      {children}
    </div>
  );
}
