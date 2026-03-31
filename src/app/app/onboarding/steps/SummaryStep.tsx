"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import Button from "@/components/Button";
import Tile from "@/components/Tile";
import {
  DURATION_OPTIONS,
  DAY_LABELS,
  EQUIP_LABELS,
  CONDITION_OPTIONS,
  INJURY_OPTIONS,
  PROGRAM_MAP,
} from "@/data/constants";
import { detectLocale } from "@/lib/format";
import { getLiftFields, getNextMonday } from "../helpers";

export default function SummaryStep({ onFinish }: { onFinish: () => void }) {
  const store = useKineStore();
  const { goal, exp, equip, trainingDays, duration, injuries, conditions, cycleType, dayDurations, setDayDurations, personalProfile, setPersonalProfile } = store;
  const [showLifts, setShowLifts] = useState(false);
  const [lifts, setLifts] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState<"today" | "monday">("today");

  const programName = PROGRAM_MAP[goal || "general"]?.[exp || "new"] || "Custom Program";
  const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label || duration;

  // Lift assessment fields based on equipment
  const liftFields = getLiftFields(equip, goal);

  function handleFinish() {
    // Save lifts to profile
    if (showLifts && Object.keys(lifts).length > 0) {
      const currentLifts: Record<string, number> = {};
      Object.entries(lifts).forEach(([name, val]) => {
        const num = parseFloat(val);
        if (num > 0) currentLifts[name] = num;
      });
      setPersonalProfile({ ...personalProfile, currentLifts });
    }

    // Set start date
    const today = new Date();
    let startStr: string;
    if (startDate === "monday") {
      const dayOfWeek = today.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
      const monday = new Date(today);
      monday.setDate(today.getDate() + daysUntilMonday);
      startStr = monday.toISOString().split("T")[0];
    } else {
      startStr = today.toISOString().split("T")[0];
    }

    store.setProgressDB({
      ...store.progressDB,
      programStartDate: startStr,
      currentWeek: 1,
    });

    onFinish();
  }

  function updateDayDuration(dow: number, mins: number) {
    setDayDurations({ ...dayDurations, [dow]: mins });
  }

  return (
    <div>
      <p className="text-[10px] tracking-[0.3em] text-accent uppercase">Your program</p>
      <h2 className="mt-2 font-display text-2xl tracking-wide text-text">
        Here&apos;s what we&apos;ve built.
      </h2>
      <p className="mt-1 text-xs text-muted2">
        {goal === "strength" ? "Built around progressive strength development." :
         goal === "muscle" ? "Built to develop your body through consistent, intelligent training." :
         "Built to fit your life and keep you coming back."}
        {" "}Adjust anything before you start.
      </p>

      {/* Program card */}
      <div className="mt-6 rounded-[var(--radius-default)] border border-border bg-surface p-5">
        <h3 className="font-display text-xl tracking-wide text-accent">{programName}</h3>

        <div className="mt-4 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2 text-muted2">
            <span>📅</span>
            <span>{trainingDays.length} days/week — {trainingDays.map((d) => DAY_LABELS[d]).join(", ")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted2">
            <span>⏱</span>
            <span>{durationLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-muted2">
            <span>↗</span>
            <span>{equip.map((e) => EQUIP_LABELS[e]).join(", ")}</span>
          </div>
          {conditions.length > 0 && (
            <div className="flex items-center gap-2 text-muted2">
              <span>ℹ</span>
              <span>Adapted for {conditions.map(c => CONDITION_OPTIONS.find(o => o.value === c)?.label || c).join(", ")}</span>
            </div>
          )}
          {injuries.length > 0 && (
            <div className="flex items-center gap-2 text-muted2">
              <span>⚠</span>
              <span>Modified for {injuries.map(i => INJURY_OPTIONS.find(o => o.value === i)?.label || i).join(", ")}</span>
            </div>
          )}
          {cycleType && cycleType !== "na" && (
            <div className="flex items-center gap-2 text-muted2">
              <span>◐</span>
              <span>Cycle-aware loading</span>
            </div>
          )}
        </div>
      </div>

      {/* Per-day duration editing */}
      <div className="mt-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">Session durations</p>
        <div className="flex flex-col gap-2">
          {trainingDays.map((dow) => (
            <div key={dow} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
              <span className="text-xs text-text">{DAY_LABELS[dow]}</span>
              <select
                value={dayDurations[dow] || (duration === "short" ? 40 : duration === "medium" ? 50 : duration === "long" ? 75 : 90)}
                onChange={(e) => updateDayDuration(dow, parseInt(e.target.value))}
                aria-label={`Session duration for ${DAY_LABELS[dow]}`}
                className="rounded border border-border bg-bg px-2 py-1 text-xs text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <option value={30}>30 min</option>
                <option value={40}>40 min</option>
                <option value={45}>45 min</option>
                <option value={50}>50 min</option>
                <option value={60}>60 min</option>
                <option value={75}>75 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Lift assessment */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs tracking-wider text-muted uppercase">Current lifts · optional</p>
          <button onClick={() => setShowLifts(!showLifts)} className="text-xs text-accent hover:underline">
            {showLifts ? "skip for now" : "add lifts"}
          </button>
        </div>

        {showLifts && (
          <div className="mt-3 flex flex-col gap-2">
            {liftFields.map((field) => (
              <div key={field.name} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                <span className="text-xs text-text">{field.name}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={field.placeholder}
                    aria-label={`${field.name} weight in ${field.unit}`}
                    value={lifts[field.name] || ""}
                    onChange={(e) => setLifts({ ...lifts, [field.name]: e.target.value })}
                    className="w-16 rounded border border-border bg-bg px-2 py-1 text-center text-xs text-text outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  />
                  <span className="text-[10px] text-muted">{field.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start date */}
      <div className="mt-6">
        <p className="mb-2 text-xs tracking-wider text-muted uppercase">When do you want to start?</p>
        <div className="grid grid-cols-2 gap-3">
          <Tile selected={startDate === "today"} onClick={() => setStartDate("today")}>
            <div className="text-center">
              <div className="text-sm font-medium">Today</div>
              <div className="text-[10px] text-muted2">{new Date().toLocaleDateString(detectLocale(), { weekday: "short", day: "numeric", month: "short" })}</div>
            </div>
          </Tile>
          <Tile selected={startDate === "monday"} onClick={() => setStartDate("monday")}>
            <div className="text-center">
              <div className="text-sm font-medium">Next Monday</div>
              <div className="text-[10px] text-muted2">{getNextMonday()}</div>
            </div>
          </Tile>
        </div>
      </div>

      <div className="mt-8">
        <Button onClick={handleFinish} className="w-full" size="lg">
          Start Week 1 →
        </Button>
      </div>
    </div>
  );
}
