"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import type { WeekData, WeekDay } from "@/lib/week-builder";
import { DAY_LABELS } from "@/data/constants";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";
import { toast } from "@/components/Toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SessionRearrange({ open, onClose }: Props) {
  const { weekData, setWeekData, progressDB } = useKineStore();
  const [selected, setSelected] = useState<number | null>(null);

  const week = weekData as WeekData | null;
  if (!week) return null;

  const curWeek = progressDB.currentWeek || 1;
  const completedDayIdxs = new Set(
    (progressDB.sessions as { weekNum?: number; dayIdx?: number }[])
      .filter((s) => s.weekNum === curWeek)
      .map((s) => s.dayIdx)
  );

  function handleDayClick(idx: number) {
    // Don't allow rearranging completed sessions
    if (completedDayIdxs.has(idx)) return;
    if (selected === null) {
      // First tap — select source
      setSelected(idx);
    } else if (selected === idx) {
      // Deselect
      setSelected(null);
    } else if (completedDayIdxs.has(idx)) {
      // Can't swap into a completed slot
      setSelected(null);
    } else {
      // Second tap — swap the two days
      const updatedDays = [...week!.days];
      const sourceDay = { ...updatedDays[selected] };
      const targetDay = { ...updatedDays[idx] };

      // Swap everything except dayNumber
      const sourceDayNum = sourceDay.dayNumber;
      const targetDayNum = targetDay.dayNumber;

      updatedDays[selected] = { ...targetDay, dayNumber: sourceDayNum };
      updatedDays[idx] = { ...sourceDay, dayNumber: targetDayNum };

      setWeekData({ ...week!, days: updatedDays });
      setSelected(null);
      toast("Week rearranged", "success");
      onClose();
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Rearrange Week">
      <p className="text-xs text-muted2 mb-4">
        Tap a session, then tap where you want to move it.
      </p>

      <div className="flex flex-col gap-2">
        {week.days.map((day, i) => (
          <button
            key={i}
            onClick={() => handleDayClick(i)}
            disabled={completedDayIdxs.has(i)}
            className={`flex items-center justify-between rounded-[var(--radius-default)] border p-3 text-left transition-all ${
              completedDayIdxs.has(i)
                ? "border-border/30 bg-surface/30 opacity-50 cursor-not-allowed"
                : selected === i
                  ? "border-accent bg-accent-dim"
                  : "border-border bg-surface hover:border-border-active"
            }`}
          >
            <div>
              <span className="text-xs font-medium text-muted2">
                {DAY_LABELS[(day.dayNumber - 1) % 7]}
              </span>
              <span className="ml-2 text-sm text-text">
                {day.isRest ? "Rest" : day.sessionTitle}
              </span>
              {completedDayIdxs.has(i) && (
                <span className="ml-2 text-[9px] text-accent">Done</span>
              )}
            </div>
            {!day.isRest && (
              <span className="text-[10px] text-muted">
                {day.exercises.length} exercises
              </span>
            )}
          </button>
        ))}
      </div>

      {selected !== null && (
        <p className="mt-3 text-center text-xs text-accent">
          Now tap where to move {week.days[selected].isRest ? "Rest" : week.days[selected].sessionTitle}
        </p>
      )}

      <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={onClose}>
        Cancel
      </Button>
    </BottomSheet>
  );
}
