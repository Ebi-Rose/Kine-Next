"use client";

import { useKineStore } from "@/store/useKineStore";
import type { Duration } from "@/store/useKineStore";
import Button from "@/components/Button";
import Tile from "@/components/Tile";
import { DURATION_OPTIONS, DAY_LABELS } from "@/data/constants";
import { evaluateSchedule, evaluateDurationContext } from "@/lib/schedule-eval";
import { StepLabel } from "../helpers";

export default function ScheduleStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { trainingDays, setTrainingDays, setDays, duration, setDuration, goal, exp, equip } =
    useKineStore();

  function toggleDay(dow: number) {
    let newDays: number[];
    if (trainingDays.includes(dow)) {
      newDays = trainingDays.filter((d) => d !== dow);
    } else {
      newDays = [...trainingDays, dow].sort();
    }
    setTrainingDays(newDays);
    setDays(String(newDays.length));
  }

  const canContinue = trainingDays.length > 0 && duration !== null;
  const scheduleFeedback = evaluateSchedule(trainingDays, exp);
  const durationFeedback = evaluateDurationContext(duration, trainingDays, exp, goal, equip);

  return (
    <div className="animate-fade-up">
      <StepLabel step={numberedStep} />
      <h2 className="font-display tracking-wide text-text" style={{ fontSize: 'clamp(20px, 6vw, 28px)', lineHeight: 1.1 }}>
        When can you train?
      </h2>

      <p className="mt-4 text-xs text-muted2 uppercase tracking-wider">
        Training days
      </p>
      <div className="mt-2 flex gap-2">
        {DAY_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => toggleDay(i)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium transition-all ${
              trainingDays.includes(i)
                ? "bg-accent text-bg"
                : "bg-surface2 text-muted2 hover:text-text"
            }`}
          >
            {label.slice(0, 2)}
          </button>
        ))}
      </div>

      {/* Schedule feedback */}
      {scheduleFeedback && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${
          scheduleFeedback.type === "warning" ? "bg-red-900/20 text-red-300"
          : scheduleFeedback.type === "positive" ? "bg-green-900/20 text-green-300"
          : "bg-surface2 text-muted2"
        }`}>
          {scheduleFeedback.message}
        </div>
      )}

      <p className="mt-6 text-xs text-muted2 uppercase tracking-wider">
        Session length
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {DURATION_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={duration === opt.value}
            onClick={() => setDuration(opt.value as Duration)}
          >
            {opt.label}
          </Tile>
        ))}
      </div>

      {/* Duration feedback */}
      {durationFeedback && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${
          durationFeedback.type === "warning" ? "bg-red-900/20 text-red-300"
          : "bg-surface2 text-muted2"
        }`}>
          {durationFeedback.message}
        </div>
      )}

      <div className="mt-8">
        <Button onClick={onNext} disabled={!canContinue} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}
