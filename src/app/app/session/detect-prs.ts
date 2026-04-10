import { useKineStore } from "@/store/useKineStore";
import { displayToKg } from "@/lib/format";
import type { ExerciseLog } from "./types";

/**
 * Detect personal records by comparing current session sets (in display units)
 * against lift history (stored in kg). Returns PRs in display units for toasting.
 */
export function detectPRs(logs: Record<number, ExerciseLog>): { name: string; weight: number; reps: number }[] {
  const store = useKineStore.getState();
  const system = store.measurementSystem || "metric";
  const prs: { name: string; weight: number; reps: number }[] = [];

  Object.values(logs).forEach((ex) => {
    if (!ex.saved || ex.actual.length === 0) return;

    // Best set from current session (display units) — weight-first ranking
    const bestSet = ex.actual.reduce(
      (best, s) => {
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps) || 0;
        if (w > best.w || (w === best.w && r > best.r)) return { w, r };
        return best;
      },
      { w: 0, r: 0 }
    );

    if (bestSet.w <= 0) return;

    // Convert to kg for comparison against stored history
    const bestKg = displayToKg(bestSet.w, system);

    const history = store.progressDB.lifts[ex.name] || [];
    const previousBest = history.reduce(
      (best, entry) => {
        if (entry.weight > best.w || (entry.weight === best.w && entry.reps > best.r))
          return { w: entry.weight, r: entry.reps };
        return best;
      },
      { w: 0, r: 0 }
    );

    if (bestKg > previousBest.w || (bestKg === previousBest.w && bestSet.r > previousBest.r)) {
      if (history.length > 0) {
        // Return display-unit weight for user-facing toast
        prs.push({ name: ex.name, weight: bestSet.w, reps: bestSet.r });
      }
    }
  });

  return prs;
}
