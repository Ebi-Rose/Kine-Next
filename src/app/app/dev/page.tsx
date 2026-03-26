"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";

export default function DevPanel() {
  const store = useKineStore();
  const router = useRouter();
  const [showState, setShowState] = useState(false);

  // Block access in production
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted2">Not available.</p>
      </div>
    );
  }

  function advanceWeek() {
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
      date: new Date().toISOString().split("T")[0],
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
        lifts[name].push({
          date: new Date(Date.now() - (8 - w) * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          weight: baseWeights[i] + w * 2.5,
          reps: 8,
        });
      }
    });

    store.setProgressDB({ ...store.progressDB, lifts });
    toast("Seeded 8 weeks of lift data", "success");
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
        <Section title="Time Controls">
          <Button variant="secondary" size="sm" className="w-full" onClick={advanceWeek}>
            Advance to next week
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
            store.setCycle({ periodLog: [{ date: new Date().toISOString().split("T")[0], type: "start" }], avgLength: 28 });
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
                  dayIdx: i, date: new Date().toISOString().split("T")[0],
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
                  dayIdx: i, date: new Date().toISOString().split("T")[0],
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
          <Button variant="ghost" size="sm" className="w-full mt-2 text-red-400" onClick={resetAll}>
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
