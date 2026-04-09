"use client";

import { useEffect, useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import { setDevDateOverride, getDevDateOverride, appNow, appTodayISO } from "@/lib/dev-time";
import { toast } from "@/components/Toast";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

/**
 * Wait for Zustand's async persist (encrypted storage) to flush before reloading.
 * The store uses AES-GCM encryption which is async — reloading immediately after
 * a setState would lose changes. AES-GCM on small JSON is sub-ms, so 150ms is plenty.
 */
function reloadAfterPersist() {
  setTimeout(() => window.location.reload(), 150);
}

/**
 * Floating dev panel — available on every /app/* page in development.
 * Renders as a draggable pill that expands into a compact overlay.
 */
// ── Dev gate ───────────────────────────────────────────────────────
// The DEV pill is visible to everyone so beta testers who've been given
// the passcode can opt in. Tapping the pill when locked shows a passcode
// modal; unlock is session-scoped via sessionStorage and persists until
// the tab closes. Visiting ?dev=unlock also opens the modal directly.
//
// This is a visibility/opt-in gate, not real security — the passcode
// ships in the client bundle. Good enough to keep non-technical users
// from accidentally opening the developer tool.
const DEV_PASSCODE = process.env.NEXT_PUBLIC_DEV_PASSCODE || "kine2026";
const DEV_UNLOCK_KEY = "kine_dev_unlocked";

function isDevUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.sessionStorage.getItem(DEV_UNLOCK_KEY) === "1"; }
  catch { return false; }
}

function setDevUnlocked(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.sessionStorage.setItem(DEV_UNLOCK_KEY, "1");
    else window.sessionStorage.removeItem(DEV_UNLOCK_KEY);
  } catch { /* noop */ }
}

export default function DevOverlay() {
  const store = useKineStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"time" | "sim" | "state">("time");
  const [dateOverride, setDateOverride] = useState<string>(
    () => getDevDateOverride()?.toISOString().split("T")[0] || ""
  );
  const [showState, setShowState] = useState(false);
  const [theme, setThemeState] = useState<Theme>("dark");
  const [unlocked, setUnlocked] = useState(false);
  const [showPasscodePrompt, setShowPasscodePrompt] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);

  useEffect(() => { setThemeState(getTheme()); }, []);

  // Gate: check unlock state + watch for ?dev=unlock URL trigger
  useEffect(() => {
    setUnlocked(isDevUnlocked());
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("dev") === "unlock") {
      setShowPasscodePrompt(true);
      url.searchParams.delete("dev");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  function submitPasscode() {
    if (passcodeInput === DEV_PASSCODE) {
      setDevUnlocked(true);
      setUnlocked(true);
      setShowPasscodePrompt(false);
      setPasscodeInput("");
      setPasscodeError(false);
      toast("Dev mode unlocked", "success");
    } else {
      setPasscodeError(true);
    }
  }

  function lockDev() {
    setDevUnlocked(false);
    setUnlocked(false);
    setOpen(false);
    toast("Dev mode locked", "success");
  }

  const activeOverride = getDevDateOverride();

  function applyDateOverride(dateStr: string, reload = true) {
    if (!dateStr) {
      setDevDateOverride(null);
      setDateOverride("");
      toast("Date override cleared", "success");
      if (reload) window.location.reload();
      return;
    }
    const d = new Date(dateStr + "T12:00:00");
    if (isNaN(d.getTime())) {
      toast("Invalid date", "error");
      return;
    }
    setDevDateOverride(d);
    setDateOverride(dateStr);
    toast(`App time → ${dateStr}`, "success");
    if (reload) window.location.reload();
  }

  function jumpDays(n: number, reload = true) {
    const base = activeOverride || new Date(); // eslint-disable-line no-restricted-syntax
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    applyDateOverride(d.toISOString().split("T")[0], reload);
  }

  function advanceWeek() {
    store.setProgressDB({
      ...store.progressDB,
      currentWeek: store.progressDB.currentWeek + 1,
    });
    store.setWeekData(null);
    // Set the date override (without reloading), then wait for store persist before reloading
    jumpDays(7, false);
    reloadAfterPersist();
  }

  function simulateSession() {
    store.setProgressDB({
      ...store.progressDB,
      sessions: [...store.progressDB.sessions, {
        dayIdx: 0,
        date: appTodayISO(),
        weekNum: store.progressDB.currentWeek,
        title: "Simulated Session",
        logs: {},
        effort: 3,
        soreness: 2,
        prs: [],
      }],
    });
    toast("Session simulated", "success");
  }

  function seedLifts() {
    const lifts = { ...store.progressDB.lifts };
    const exercises = ["Barbell Back Squat", "Romanian Deadlift", "Barbell Bench Press"];
    const baseWeights = [40, 35, 25];
    exercises.forEach((name, i) => {
      if (!lifts[name]) lifts[name] = [];
      for (let w = 0; w < 8; w++) {
        const d = appNow();
        d.setDate(d.getDate() - (8 - w) * 7);
        lifts[name].push({ date: d.toISOString().split("T")[0], weight: baseWeights[i] + w * 2.5, reps: 8 });
      }
    });
    store.setProgressDB({ ...store.progressDB, lifts });
    toast("Seeded 8 weeks", "success");
  }

  function simulatePerfectWeek() {
    const planned = parseInt(store.days || "3");
    const sessions = [...store.progressDB.sessions];
    const wk = store.progressDB.currentWeek;
    for (let i = 0; i < planned; i++) {
      sessions.push({
        dayIdx: i, date: appTodayISO(),
        weekNum: wk, title: `Session ${i + 1}`,
        logs: {}, effort: 2, soreness: 1, prs: [],
      });
    }
    store.setProgressDB({
      ...store.progressDB,
      sessions,
      currentWeek: wk + 1,
      weekFeedbackHistory: [
        ...store.progressDB.weekFeedbackHistory,
        { weekNum: wk, effort: 2, soreness: 1 },
      ],
    });
    store.setWeekData(null);
    jumpDays(7, false);
    reloadAfterPersist();
  }

  function simulateStruggledWeek() {
    const sessions = [...store.progressDB.sessions];
    const wk = store.progressDB.currentWeek;
    for (let i = 0; i < 2; i++) {
      sessions.push({
        dayIdx: i, date: appTodayISO(),
        weekNum: wk, title: `Session ${i + 1}`,
        logs: {}, effort: 4, soreness: 3 + i, prs: [],
      });
    }
    store.setProgressDB({
      ...store.progressDB,
      sessions,
      currentWeek: wk + 1,
      weekFeedbackHistory: [
        ...store.progressDB.weekFeedbackHistory,
        { weekNum: wk, effort: 4, soreness: 3 },
      ],
    });
    store.setWeekData(null);
    jumpDays(7, false);
    reloadAfterPersist();
  }

  function simulateGap() {
    store.setProgressDB({
      ...store.progressDB,
      currentWeek: store.progressDB.currentWeek + 2,
    });
    store.setWeekData(null);
    // Set the date override (without reloading), then wait for store persist before reloading
    jumpDays(14, false);
    reloadAfterPersist();
  }

  function resetAll() {
    if (confirm("Reset ALL data?")) {
      localStorage.removeItem("kine_v2");
      setDevDateOverride(null); // clear dev time override too
      window.location.href = "/app/onboarding";
    }
  }

  function exportState() {
    const state = localStorage.getItem("kine_v2");
    if (state) {
      navigator.clipboard.writeText(state);
      toast("Copied", "success");
    }
  }

  function importState() {
    const input = prompt("Paste state JSON:");
    if (input) {
      try {
        JSON.parse(input);
        localStorage.setItem("kine_v2", input);
        window.location.reload();
      } catch {
        toast("Invalid JSON", "error");
      }
    }
  }

  const tabs = [
    { id: "time" as const, label: "Time" },
    { id: "sim" as const, label: "Sim" },
    { id: "state" as const, label: "State" },
  ];

  // Passcode prompt (only visible if user hit ?dev=unlock)
  if (showPasscodePrompt && !unlocked) {
    return (
      <div
        role="dialog"
        aria-label="Dev mode passcode"
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
      >
        <div className="w-full max-w-xs rounded-2xl border border-border bg-bg p-5">
          <h3 className="text-sm font-medium text-text mb-1">Dev mode</h3>
          <p className="text-[11px] text-muted2 mb-3">
            Enter the passcode to unlock the developer tools for this session.
          </p>
          <input
            type="password"
            autoFocus
            value={passcodeInput}
            onChange={(e) => { setPasscodeInput(e.target.value); setPasscodeError(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") submitPasscode(); }}
            aria-invalid={passcodeError}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none mb-2 ${passcodeError ? "border-danger" : "border-border focus:border-accent"}`}
            placeholder="••••••••"
          />
          {passcodeError && (
            <p className="text-[10px] text-danger mb-2">Wrong passcode.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={submitPasscode}
              className="flex-1 rounded-full bg-accent text-bg px-3 py-2 text-xs font-medium"
            >
              Unlock
            </button>
            <button
              onClick={() => { setShowPasscodePrompt(false); setPasscodeInput(""); setPasscodeError(false); }}
              className="flex-1 rounded-full border border-border px-3 py-2 text-xs text-muted2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Floating pill — always visible. Tap opens the panel if unlocked,
  // otherwise prompts for the passcode.
  if (!open) {
    return (
      <button
        onClick={() => {
          if (unlocked) setOpen(true);
          else setShowPasscodePrompt(true);
        }}
        aria-label={unlocked ? "Open dev tools" : "Unlock dev tools"}
        className="fixed bottom-[140px] right-4 z-[999] flex items-center gap-1.5 rounded-full border border-accent/40 bg-bg/90 backdrop-blur-sm px-3 py-1.5 shadow-lg transition-all hover:border-accent hover:scale-105 active:scale-95"
        style={{ paddingRight: 'max(12px, env(safe-area-inset-right))' }}
      >
        <span className="text-[10px] font-medium text-accent">DEV</span>
        {!unlocked && (
          <span className="text-[9px] text-muted2">🔒</span>
        )}
        {unlocked && activeOverride && (
          <span className="text-[9px] text-muted2">
            {appNow().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </button>
    );
  }

  // Safety: if something opened the panel while still locked, force lock.
  if (!unlocked) {
    setOpen(false);
    return null;
  }

  return (
    <div className="fixed bottom-[140px] right-4 z-[999] w-72 rounded-2xl border border-border bg-bg/95 backdrop-blur-md shadow-2xl overflow-hidden" style={{ marginRight: 'max(0px, calc(env(safe-area-inset-right) - 16px))' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-accent tracking-wider">DEV</span>
          <span className="text-[9px] text-muted">
            W{store.progressDB.currentWeek} · {store.progressDB.sessions.length}s
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="rounded border border-border/50 px-1.5 py-0.5 text-[9px] text-muted2 hover:text-accent hover:border-accent/40 transition-all capitalize"
          >
            {theme}
          </button>
          <button
            onClick={lockDev}
            title="Lock dev mode"
            className="rounded border border-border/50 px-1.5 py-0.5 text-[9px] text-muted2 hover:text-accent hover:border-accent/40 transition-all"
          >
            Lock
          </button>
          <button onClick={() => setOpen(false)} className="text-[10px] text-muted2 hover:text-text px-1">✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
              tab === t.id ? "text-accent border-b border-accent" : "text-muted2 hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 max-h-[50vh] overflow-y-auto">
        {/* Time tab */}
        {tab === "time" && (
          <div className="flex flex-col gap-2">
            {activeOverride && (
              <div className="rounded-lg bg-accent/10 border border-accent/30 px-2.5 py-1.5">
                <p className="text-[9px] text-accent font-medium tracking-wider uppercase">Override active</p>
                <p className="text-[11px] text-text mt-0.5">
                  {appNow().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
            <div className="flex gap-1.5">
              <input
                type="date"
                value={dateOverride}
                onChange={(e) => setDateOverride(e.target.value)}
                className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-2 py-1 text-[10px] text-text outline-none focus:border-accent"
              />
              <button onClick={() => applyDateOverride(dateOverride)} className="rounded-lg bg-accent/20 px-2 py-1 text-[10px] text-accent hover:bg-accent/30 transition-colors">Set</button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: "+1d", n: 1 },
                { label: "+1w", n: 7 },
                { label: "+2w", n: 14 },
                { label: "-1w", n: -7 },
              ].map((b) => (
                <button key={b.label} onClick={() => jumpDays(b.n)} className="rounded-lg border border-border bg-surface/50 py-1 text-[9px] text-muted2 hover:text-text hover:border-accent/30 transition-all">
                  {b.label}
                </button>
              ))}
            </div>
            {activeOverride && (
              <button onClick={() => applyDateOverride("")} className="text-[9px] text-muted2 hover:text-text transition-colors">
                Clear override
              </button>
            )}
            <button onClick={advanceWeek} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-[10px] text-muted2 hover:text-text hover:border-accent/30 transition-all">
              Advance week + time
            </button>

            {/* Cycle quick actions */}
            <p className="text-[9px] text-muted uppercase tracking-wider mt-1">Cycle</p>
            <div className="flex flex-wrap gap-1">
              {(["regular", "irregular", "hormonal", "perimenopause", "na"] as const).map((type) => (
                <button key={type} onClick={() => { store.setCycleType(type); toast(`Cycle: ${type}`, "success"); }}
                  className={`rounded-full px-2 py-0.5 text-[9px] transition-all ${store.cycleType === type ? "bg-accent/20 text-accent border border-accent/30" : "bg-surface2/50 text-muted2 border border-transparent hover:text-text"}`}>
                  {type}
                </button>
              ))}
            </div>
            <button onClick={() => { store.setCycle({ periodLog: [{ date: appTodayISO(), type: "start" }], avgLength: 28 }); toast("Period logged", "success"); }}
              className="rounded-lg border border-border bg-surface px-2 py-1 text-[10px] text-muted2 hover:text-text transition-all">
              Log period start
            </button>
          </div>
        )}

        {/* Sim tab */}
        {tab === "sim" && (
          <div className="flex flex-col gap-1.5">
            {/* Persona loaders */}
            <p className="text-[9px] text-muted uppercase tracking-wider">Load persona</p>
            <div className="grid grid-cols-3 gap-1">
              {[
                { key: "mia", label: "Mia", desc: "Experienced" },
                { key: "priya", label: "Priya", desc: "On-and-off" },
                { key: "aisha", label: "Aisha", desc: "Beginner" },
                { key: "emma", label: "Emma", desc: "Postpartum" },
                { key: "diane", label: "Diane", desc: "Peri" },
                { key: "iris", label: "Iris", desc: "Hypermobile" },
                { key: "demo", label: "Demo", desc: "Generic" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={async () => {
                    if (p.key === "demo") {
                      const { loadDemoData } = await import("@/data/demo-data");
                      loadDemoData(useKineStore.getState());
                    } else {
                      const { PERSONA_LOADERS } = await import("@/data/personas");
                      PERSONA_LOADERS[p.key]?.(useKineStore.getState());
                    }
                    toast(`Loaded ${p.label}`, "success");
                    reloadAfterPersist();
                  }}
                  className="rounded-lg border border-border bg-surface/50 py-1.5 text-center transition-all hover:border-accent/30"
                >
                  <span className="block text-[10px] text-text">{p.label}</span>
                  <span className="block text-[8px] text-muted2">{p.desc}</span>
                </button>
              ))}
            </div>

            <p className="text-[9px] text-muted uppercase tracking-wider mt-1">Quick sim</p>
            <Btn onClick={simulateSession}>Simulate session</Btn>
            <Btn onClick={seedLifts}>Seed 8 weeks of lifts</Btn>
            <Btn onClick={simulatePerfectWeek}>Perfect week</Btn>
            <Btn onClick={simulateStruggledWeek}>Struggled week</Btn>
            <Btn onClick={simulateGap}>2-week gap</Btn>
            <Btn onClick={() => { store.setGoal(store.goal); toast("Edu flags reset", "success"); }}>Reset edu flags</Btn>
          </div>
        )}

        {/* State tab */}
        {tab === "state" && (
          <div className="flex flex-col gap-1.5">
            <Btn onClick={exportState}>Export to clipboard</Btn>
            <Btn onClick={importState}>Import from clipboard</Btn>
            <Btn onClick={() => setShowState(!showState)}>{showState ? "Hide" : "Show"} state</Btn>
            {showState && (
              <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-surface p-2 text-[8px] text-muted2 leading-relaxed">
                {JSON.stringify(store, null, 2).slice(0, 3000)}
              </pre>
            )}
            <button onClick={resetAll} className="mt-2 rounded-lg border border-danger/30 px-2 py-1.5 text-[10px] text-danger hover:bg-danger/10 transition-all">
              Reset all data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[10px] text-muted2 text-left hover:text-text hover:border-accent/30 transition-all">
      {children}
    </button>
  );
}
