"use client";

import { useKineStore } from "@/store/useKineStore";
import { weightUnit, detectLocale } from "@/lib/format";
import { appNow } from "@/lib/dev-time";

export function StepLabel({ step }: { step: number }) {
  if (step <= 0) return null;
  return (
    <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-2">
      Step {step} of 4
    </p>
  );
}

export function getLiftFields(equip: string[], goal: string | null): { name: string; placeholder: string; unit: string }[] {
  const unit = weightUnit(useKineStore.getState().measurementSystem || "metric");
  if (equip.includes("barbell")) {
    if (goal === "muscle") {
      return [
        { name: "Back Squat", placeholder: unit, unit },
        { name: "Romanian Deadlift", placeholder: unit, unit },
        { name: "Bench Press", placeholder: unit, unit },
      ];
    }
    return [
      { name: "Back Squat", placeholder: "1×5", unit },
      { name: "Deadlift", placeholder: "1×5", unit },
      { name: "Bench Press", placeholder: "1×5", unit },
      { name: "Overhead Press", placeholder: "1×5", unit },
    ];
  }
  if (equip.includes("dumbbells")) {
    return [
      { name: "Goblet Squat", placeholder: unit, unit },
      { name: "DB Romanian Deadlift", placeholder: unit, unit },
      { name: "DB Shoulder Press", placeholder: unit, unit },
    ];
  }
  if (equip.includes("machines")) {
    return [
      { name: "Leg Press", placeholder: unit, unit },
      { name: "Lat Pulldown", placeholder: unit, unit },
      { name: "Chest Press", placeholder: unit, unit },
    ];
  }
  return [
    { name: "Pull-Ups", placeholder: "max", unit: "reps" },
    { name: "Push-Ups", placeholder: "max", unit: "reps" },
  ];
}

export function getNextMonday(): string {
  const today = appNow();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  return monday.toLocaleDateString(detectLocale(), { weekday: "short", day: "numeric", month: "short" });
}
