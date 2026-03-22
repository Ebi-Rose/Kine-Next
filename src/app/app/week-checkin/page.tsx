"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";

export default function WeekCheckinPage() {
  const router = useRouter();
  const { progressDB, setProgressDB } = useKineStore();
  const [energy, setEnergy] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const weekSessions = (progressDB.sessions as { weekNum?: number }[])
    .filter((s) => s.weekNum === progressDB.currentWeek);

  function submit() {
    if (energy === null || motivation === null) {
      toast("Rate both before submitting", "error");
      return;
    }

    const checkin = {
      weekNum: progressDB.currentWeek,
      energy,
      motivation,
      notes,
      sessionsCompleted: weekSessions.length,
      date: new Date().toISOString().split("T")[0],
    };

    setProgressDB({
      ...progressDB,
      weekFeedbackHistory: [
        ...progressDB.weekFeedbackHistory,
        { weekNum: progressDB.currentWeek, effort: energy, soreness: motivation, notes },
      ],
    });

    toast("Week check-in saved", "success");
    router.push("/app");
  }

  const energyLabels = ["Drained", "Low", "Normal", "High"];
  const motivationLabels = ["Struggling", "Flat", "Steady", "Fired up"];

  return (
    <div>
      <button onClick={() => router.push("/app")} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back to week
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Week Check-in</h1>
      <p className="mt-1 text-xs text-muted2">
        Week {progressDB.currentWeek} — {weekSessions.length} session{weekSessions.length !== 1 ? "s" : ""} completed.
        How are you feeling?
      </p>

      {/* Energy */}
      <div className="mt-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">Energy levels</p>
        <div className="grid grid-cols-4 gap-2">
          {energyLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => setEnergy(i + 1)}
              className={`rounded-[var(--radius-default)] border px-2 py-3 text-xs transition-all ${
                energy === i + 1
                  ? "border-accent bg-accent-dim text-text"
                  : "border-border bg-surface text-muted2 hover:border-border-active"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Motivation */}
      <div className="mt-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">Motivation</p>
        <div className="grid grid-cols-4 gap-2">
          {motivationLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => setMotivation(i + 1)}
              className={`rounded-[var(--radius-default)] border px-2 py-3 text-xs transition-all ${
                motivation === i + 1
                  ? "border-accent bg-accent-dim text-text"
                  : "border-border bg-surface text-muted2 hover:border-border-active"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">Anything else?</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How's life outside training? Sleep, stress, anything on your mind..."
          rows={3}
          className="w-full rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent resize-none"
        />
      </div>

      <div className="mt-8">
        <Button
          className="w-full"
          size="lg"
          disabled={energy === null || motivation === null}
          onClick={submit}
        >
          Submit check-in
        </Button>
      </div>
    </div>
  );
}
