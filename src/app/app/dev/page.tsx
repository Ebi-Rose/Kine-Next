"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import { setDevDateOverride, getDevDateOverride, appNow, appTodayISO } from "@/lib/dev-time";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";
import { TEST_PERSONAS, type TestPersona } from "@/data/test-personas";

export default function DevPanel() {
  const store = useKineStore();
  const router = useRouter();
  const [showState, setShowState] = useState(false);
  const [dateOverride, setDateOverride] = useState<string>(
    () => getDevDateOverride()?.toISOString().split("T")[0] || ""
  );
  const activeOverride = getDevDateOverride();

  // Block access in production
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted2">Not available.</p>
      </div>
    );
  }

  function applyDateOverride(dateStr: string) {
    if (!dateStr) {
      setDevDateOverride(null);
      setDateOverride("");
      toast("Date override cleared — using real time", "success");
      return;
    }
    const d = new Date(dateStr + "T12:00:00");
    if (isNaN(d.getTime())) {
      toast("Invalid date", "error");
      return;
    }
    setDevDateOverride(d);
    setDateOverride(dateStr);

    // When going back in time, strip future-dated data so the app
    // looks exactly as it would have at that point.
    const nowISO = new Date().toISOString().split("T")[0];
    if (dateStr < nowISO) {
      const { progressDB, setProgressDB, setWeekData, weekData } = store;
      const sessions = (progressDB.sessions as { date?: string; weekNum?: number }[])
        .filter((s) => !s.date || s.date <= dateStr);
      const lifts = { ...progressDB.lifts };
      for (const key of Object.keys(lifts)) {
        lifts[key] = lifts[key].filter((e: { date: string }) => e.date <= dateStr);
      }
      // Find the highest weekNum still present after filtering
      const maxWeek = sessions.reduce((m, s) => Math.max(m, s.weekNum || 1), 1);
      const feedbackHistory = progressDB.weekFeedbackHistory.filter(
        (f) => f.weekNum <= maxWeek
      );
      setProgressDB({
        ...progressDB,
        sessions,
        lifts,
        currentWeek: maxWeek,
        weekFeedbackHistory: feedbackHistory,
      });
      // If we rewound past the current week, load week data from history
      if (maxWeek < (progressDB.currentWeek || 1) && store.weekHistory.length > 0) {
        const histWeek = store.weekHistory.find(
          (w) => (w as { _weekNum?: number })._weekNum === maxWeek
        );
        if (histWeek) setWeekData(histWeek as typeof weekData);
      }
    }

    toast(`App time set to ${dateStr}`, "success");
  }

  function jumpDays(n: number) {
    const base = activeOverride || new Date();
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    const str = d.toISOString().split("T")[0];
    applyDateOverride(str);
  }

  function advanceWeek() {
    jumpDays(7);
    store.setProgressDB({
      ...store.progressDB,
      currentWeek: store.progressDB.currentWeek + 1,
    });
    store.setWeekData(null);
    toast(`Advanced to Week ${store.progressDB.currentWeek + 1}`, "success");
  }

  function simulateSession() {
    const fakeSession = {
      dayIdx: 0,
      date: appTodayISO(),
      weekNum: store.progressDB.currentWeek,
      title: "Simulated Session",
      logs: {},
      effort: 3,
      soreness: 2,
      prs: [],
    };
    store.setProgressDB({
      ...store.progressDB,
      sessions: [...store.progressDB.sessions, fakeSession],
    });
    toast("Simulated session added", "success");
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
        lifts[name].push({
          date: d.toISOString().split("T")[0],
          weight: baseWeights[i] + w * 2.5,
          reps: 8,
        });
      }
    });

    store.setProgressDB({ ...store.progressDB, lifts });
    toast("Seeded 8 weeks of lift data", "success");
  }

  function loadPersona(p: TestPersona) {
    // Onboarding slice
    store.setGoal(p.goal);
    store.setExp(p.exp);
    store.setEquip(p.equip);
    store.setDays(p.days);
    store.setDuration(p.duration);
    store.setInjuries(p.injuries);
    store.setInjuryNotes(p.injuryNotes);
    store.setConditions(p.conditions); // derives comfortFlags
    store.setCycleType(p.cycleType);
    // Profile — preserve any existing optional fields (lifeStage, age)
    store.setPersonalProfile({
      ...store.personalProfile,
      name: p.profile.name,
      height: p.profile.height,
      weight: p.profile.weight,
      trainingAge: p.profile.trainingAge,
    });
    // Clear generated week so next visit to /app rebuilds against new inputs
    store.setWeekData(null);
    toast(`Loaded persona: ${p.name}`, "success");
  }

  function resetEduFlags() {
    store.setGoal(store.goal); // trigger re-render
    toast("Education flags reset", "success");
  }

  function resetAll() {
    if (confirm("Reset ALL data?")) {
      localStorage.removeItem("kine_v2");
      window.location.href = "/app/onboarding";
    }
  }

  function exportState() {
    const state = localStorage.getItem("kine_v2");
    if (state) {
      navigator.clipboard.writeText(state);
      toast("State copied to clipboard", "success");
    }
  }

  function importState() {
    const input = prompt("Paste state JSON:");
    if (input) {
      try {
        JSON.parse(input); // validate
        localStorage.setItem("kine_v2", input);
        window.location.reload();
      } catch {
        toast("Invalid JSON", "error");
      }
    }
  }

  return (
    <div>
      <button onClick={() => router.push("/app")} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back to app
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Dev Panel</h1>
      <p className="mt-1 text-xs text-muted2">Development tools. Not visible in production.</p>

      <div className="mt-6 flex flex-col gap-3">
        <Section title="Personas">
          <p className="mb-3 text-[10px] text-muted2">
            Loads onboarding state for a test persona. Week data is cleared so{" "}
            <code className="text-muted">/app</code> rebuilds on next visit.
          </p>
          <div className="flex flex-col gap-2">
            {TEST_PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPersona(p)}
                className="text-left rounded-lg border border-border bg-surface2/50 px-3 py-2 hover:border-accent/30 hover:text-text transition-all"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-text">{p.name}</span>
                  <span className="text-[10px] text-muted2">{p.tagline}</span>
                </div>
                <p className="mt-1 text-[10px] text-muted">{p.tests}</p>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Time Override">
          {activeOverride && (
            <div className="mb-3 rounded-lg bg-accent/10 border border-accent/30 px-3 py-2">
              <p className="text-[10px] text-accent font-medium tracking-wider uppercase">Override active</p>
              <p className="text-xs text-text mt-0.5">
                App sees: {appNow().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          )}
          <div className="flex gap-2 mb-2">
            <input
              type="date"
              value={dateOverride}
              onChange={(e) => setDateOverride(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-bg px-2 py-1.5 text-xs text-text outline-none focus:border-accent"
            />
            <Button variant="secondary" size="sm" onClick={() => applyDateOverride(dateOverride)}>
              Set
            </Button>
          </div>
          <div className="flex gap-1.5 mb-2">
            <button onClick={() => jumpDays(1)} className="flex-1 rounded-lg border border-border bg-surface2/50 px-2 py-1.5 text-[10px] text-muted2 hover:text-text hover:border-accent/30 transition-all">+1 day</button>
            <button onClick={() => jumpDays(7)} className="flex-1 rounded-lg border border-border bg-surface2/50 px-2 py-1.5 text-[10px] text-muted2 hover:text-text hover:border-accent/30 transition-all">+1 week</button>
            <button onClick={() => jumpDays(14)} className="flex-1 rounded-lg border border-border bg-surface2/50 px-2 py-1.5 text-[10px] text-muted2 hover:text-text hover:border-accent/30 transition-all">+2 weeks</button>
            <button onClick={() => jumpDays(-7)} className="flex-1 rounded-lg border border-border bg-surface2/50 px-2 py-1.5 text-[10px] text-muted2 hover:text-text hover:border-accent/30 transition-all">-1 week</button>
          </div>
          {activeOverride && (
            <Button variant="ghost" size="sm" className="w-full text-muted2" onClick={() => applyDateOverride("")}>
              Clear override (use real time)
            </Button>
          )}
          <Button variant="secondary" size="sm" className="w-full mt-2" onClick={advanceWeek}>
            Advance week + time (+7 days)
          </Button>
        </Section>

        <Section title="Session Simulation">
          <Button variant="secondary" size="sm" className="w-full" onClick={simulateSession}>
            Simulate completed session
          </Button>
          <Button variant="secondary" size="sm" className="w-full mt-2" onClick={seedLifts}>
            Seed 8 weeks of lift data
          </Button>
        </Section>

        <Section title="State Management">
          <Button variant="secondary" size="sm" className="w-full" onClick={exportState}>
            Export state to clipboard
          </Button>
          <Button variant="secondary" size="sm" className="w-full mt-2" onClick={importState}>
            Import state from clipboard
          </Button>
          <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => setShowState(!showState)}>
            {showState ? "Hide" : "Show"} current state
          </Button>
          {showState && (
            <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-bg p-3 text-[10px] text-muted2">
              {JSON.stringify(store, null, 2).slice(0, 3000)}
            </pre>
          )}
        </Section>

        <Section title="Cycle">
          <div className="flex flex-wrap gap-2">
            {(["regular", "irregular", "hormonal", "perimenopause", "na"] as const).map((type) => (
              <button key={type} onClick={() => { store.setCycleType(type); toast(`Cycle: ${type}`, "success"); }}
                className={`rounded-lg border px-2 py-1 text-[10px] transition-all ${store.cycleType === type ? "border-accent text-accent" : "border-border text-muted2"}`}>
                {type}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => {
            store.setCycle({ periodLog: [{ date: appTodayISO(), type: "start" }], avgLength: 28 });
            toast("Period logged today", "success");
          }}>
            Log period start (today)
          </Button>
        </Section>

        <Section title="Scenarios">
          <Button variant="secondary" size="sm" className="w-full" onClick={() => {
            // Perfect week: 3-4 sessions, effort 2-3, soreness 1-2
            const planned = parseInt(store.days || "3");
            for (let i = 0; i < planned; i++) {
              store.setProgressDB({
                ...store.progressDB,
                sessions: [...store.progressDB.sessions, {
                  dayIdx: i, date: appTodayISO(),
                  weekNum: store.progressDB.currentWeek, title: `Session ${i + 1}`,
                  logs: {}, effort: 2, soreness: 1, prs: [],
                }],
              });
            }
            toast("Perfect week simulated", "success");
          }}>
            Simulate perfect week
          </Button>
          <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => {
            // Struggled week: 2 sessions, effort 4, soreness 3-4
            for (let i = 0; i < 2; i++) {
              store.setProgressDB({
                ...store.progressDB,
                sessions: [...store.progressDB.sessions, {
                  dayIdx: i, date: appTodayISO(),
                  weekNum: store.progressDB.currentWeek, title: `Session ${i + 1}`,
                  logs: {}, effort: 4, soreness: 3 + i, prs: [],
                }],
              });
            }
            toast("Struggled week simulated", "success");
          }}>
            Simulate struggled week
          </Button>
          <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => {
            // Gap return: advance 2 weeks with no sessions
            store.setProgressDB({
              ...store.progressDB,
              currentWeek: store.progressDB.currentWeek + 2,
            });
            store.setWeekData(null);
            toast("2-week gap simulated", "success");
          }}>
            Simulate 2-week gap
          </Button>
        </Section>

        <Section title="Reset">
          <Button variant="secondary" size="sm" className="w-full" onClick={resetEduFlags}>
            Reset education flags
          </Button>
          <Button variant="ghost" size="sm" className="w-full mt-2 text-danger" onClick={resetAll}>
            Reset all data
          </Button>
        </Section>

        <div className="mt-4 text-center text-[10px] text-muted">
          Week {store.progressDB.currentWeek} · {store.progressDB.sessions.length} sessions · {Object.keys(store.progressDB.lifts).length} lifts tracked
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs tracking-wider text-muted uppercase">{title}</p>
      <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
        {children}
      </div>
    </div>
  );
}
