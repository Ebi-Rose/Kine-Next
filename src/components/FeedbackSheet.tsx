"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BottomSheet from "./BottomSheet";
import { getUser } from "@/lib/auth";

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

  // Pull signed-in user info on open
  useEffect(() => {
    if (!open) return;
    (async () => {
      const user = await getUser();
      if (user?.email) setEmail(user.email);
      const meta = (user?.user_metadata ?? {}) as { name?: string; full_name?: string };
      setName(meta.name ?? meta.full_name ?? null);
    })();
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStatus("idle");
        setContent("");
        setErrorMsg("");
      }, 300);
    }
  }, [open]);

  const submit = async () => {
    if (!content.trim() || !email.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          severity: category === "bug" ? severity : null,
          content: content.trim(),
          email: email.trim().toLowerCase(),
          name,
          screen: pathname,
          device: navigator.userAgent,
          app_version: APP_VERSION,
        }),
      });
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
          </div>

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
            disabled={!content.trim() || !email.trim() || status === "sending"}
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
