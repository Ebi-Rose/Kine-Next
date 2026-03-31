"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import { weightUnit } from "@/lib/format";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";
import { BackButton } from "./_helpers";

function getLiftFieldsForProfile(equip: string[], goal: string | null, unit: string): { name: string; unit: string }[] {
  if (equip.includes("barbell")) {
    if (goal === "muscle") {
      return [
        { name: "Back Squat", unit },
        { name: "Romanian Deadlift", unit },
        { name: "Bench Press", unit },
      ];
    }
    return [
      { name: "Back Squat", unit },
      { name: "Deadlift", unit },
      { name: "Bench Press", unit },
      { name: "Overhead Press", unit },
    ];
  }
  if (equip.includes("dumbbells")) {
    return [
      { name: "Goblet Squat", unit },
      { name: "DB Romanian Deadlift", unit },
      { name: "DB Shoulder Press", unit },
    ];
  }
  if (equip.includes("machines")) {
    return [
      { name: "Leg Press", unit },
      { name: "Lat Pulldown", unit },
      { name: "Chest Press", unit },
    ];
  }
  return [
    { name: "Pull-Ups", unit: "reps" },
    { name: "Push-Ups", unit: "reps" },
  ];
}

export default function LiftsPanel({ onBack }: { onBack: () => void }) {
  const { personalProfile, setPersonalProfile, equip, goal, measurementSystem } = useKineStore();
  const unit = weightUnit(measurementSystem || "metric");
  const [lifts, setLifts] = useState<Record<string, string>>(() => {
    const current = personalProfile.currentLifts || {};
    const mapped: Record<string, string> = {};
    Object.entries(current).forEach(([k, v]) => { mapped[k] = String(v); });
    return mapped;
  });

  const liftFields = getLiftFieldsForProfile(equip, goal, unit);

  function save() {
    const currentLifts: Record<string, number> = {};
    Object.entries(lifts).forEach(([name, val]) => {
      const num = parseFloat(val);
      if (num > 0) currentLifts[name] = num;
    });
    setPersonalProfile({ ...personalProfile, currentLifts });
    toast("Lifts updated", "success");
    onBack();
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">Current lifts</h2>
      <p className="mt-1 text-xs text-muted2 font-light">Optional — helps set starting weights for your programme.</p>

      <div className="mt-4 flex flex-col gap-3">
        {liftFields.map((field) => (
          <div key={field.name} className="flex items-center justify-between rounded-[10px] border border-border bg-surface px-4 py-3">
            <span className="text-xs text-text">{field.name}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                placeholder="—"
                value={lifts[field.name] || ""}
                onChange={(e) => setLifts({ ...lifts, [field.name]: e.target.value })}
                className="w-16 rounded border border-border bg-bg px-2 py-1 text-center text-xs text-text outline-none focus:border-accent"
              />
              <span className="text-[10px] text-muted">{field.unit}</span>
            </div>
          </div>
        ))}
        <Button onClick={save} className="w-full">Save lifts</Button>
      </div>
    </div>
  );
}
