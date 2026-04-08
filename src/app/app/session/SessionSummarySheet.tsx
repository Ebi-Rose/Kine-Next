"use client";

import type { ExerciseLog } from "./types";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";

export default function SessionSummarySheet({
  logs,
  onClose,
  onConfirm,
}: {
  logs: Record<number, ExerciseLog>;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <BottomSheet open={true} onClose={onClose}>
      <div className="px-1 pb-4">
        <h3 className="font-display text-lg tracking-wide text-text mb-4">Session summary</h3>
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
          {Object.entries(logs).map(([idx, ex]) => {
            const isSkipped = ex.saved && ex.actual.length === 0;
            const loggedSets = ex.actual.filter((s) => s.reps || s.weight);
            return (
              <div key={idx} className={`rounded-lg border border-border bg-surface px-3 py-2 ${isSkipped ? "opacity-50" : ""}`}>
                <p className={`text-xs font-medium ${isSkipped ? "line-through text-muted" : "text-text"}`}>{ex.name}</p>
                {isSkipped ? (
                  <p className="text-[10px] text-muted">Skipped</p>
                ) : loggedSets.length > 0 ? (
                  <div className="flex flex-wrap gap-x-3 mt-0.5">
                    {loggedSets.map((s, i) => (
                      <span key={i} className="text-[10px] text-muted2">
                        {s.reps}×{s.weight || "BW"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-warning">No sets logged</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onClose}>
            Go back
          </Button>
          <Button size="sm" className="flex-1" onClick={onConfirm}>
            Confirm ✓
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
