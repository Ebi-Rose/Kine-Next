"use client";

import { useState } from "react";
import { useKineStore, type CoachingDetail } from "@/store/useKineStore";
import { getCurrentPhase } from "@/lib/cycle";
import { getCurrentPhaseInfo } from "@/lib/periodisation";
import { getConditionCoachNote } from "@/lib/condition-context";
import { getActivityCoachNote } from "@/lib/outside-activity-context";
import type { OutsideActivityId } from "@/data/outside-activity-rules";

interface AdaptationFactor {
  source: "condition" | "activity" | "cycle" | "periodisation" | "checkin";
  label: string;
  detail: string;
}

const SOURCE_DOTS: Record<AdaptationFactor["source"], string> = {
  condition: "bg-red-400",
  activity: "bg-green-500",
  cycle: "bg-pink-400",
  periodisation: "bg-purple-400",
  checkin: "bg-amber-400",
};

const SOURCE_TAG_STYLES: Record<AdaptationFactor["source"], string> = {
  condition: "bg-red-400/10 text-red-700",
  activity: "bg-green-500/10 text-green-700",
  cycle: "bg-pink-400/10 text-pink-700",
  periodisation: "bg-purple-400/10 text-purple-700",
  checkin: "bg-amber-400/10 text-amber-700",
};

function useAdaptationFactors(weekNum: number): AdaptationFactor[] {
  const {
    conditions,
    outsideActivities,
    outsideActivityFocus,
    cycleType,
    cycle,
    progressDB,
  } = useKineStore();

  const factors: AdaptationFactor[] = [];

  // Conditions (PCOS, endometriosis, etc.)
  if (conditions && conditions.length > 0) {
    const note = getConditionCoachNote(conditions);
    if (note) {
      const labels = conditions.map((c) =>
        c === "pcos" ? "PCOS"
          : c === "fibroids" ? "Fibroids"
          : c === "endometriosis" ? "Endometriosis"
          : c === "pelvic_floor" ? "Pelvic floor"
          : c
      );
      factors.push({
        source: "condition",
        label: labels.join(", "),
        detail: note,
      });
    }
  }

  // Outside activities
  if (outsideActivities && outsideActivities.length > 0) {
    const note = getActivityCoachNote(
      outsideActivities as OutsideActivityId[],
      (outsideActivityFocus as OutsideActivityId) || null,
    );
    if (note) {
      const focusLabel = outsideActivityFocus
        ? ` (${outsideActivityFocus === outsideActivities[0] ? "focus" : "focus"})`
        : "";
      const actLabels = outsideActivities.map((a) =>
        a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      );
      factors.push({
        source: "activity",
        label: actLabels.join(", ") + (outsideActivityFocus ? " (focus)" : ""),
        detail: note,
      });
    }
  }

  // Cycle phase
  if (cycleType === "regular") {
    const phase = getCurrentPhase(cycle.periodLog, cycle.avgLength);
    if (phase) {
      factors.push({
        source: "cycle",
        label: `${phase.label} phase · Day ${phase.day}`,
        detail: phase.trainingNote,
      });
    }
  }

  // Periodisation
  const phaseInfo = getCurrentPhaseInfo(weekNum, progressDB.phaseOffset);
  factors.push({
    source: "periodisation",
    label: phaseInfo.label,
    detail: phaseInfo.description,
  });

  // Check-in feedback (for the previous week)
  const prevWeekFeedback = progressDB.weekFeedbackHistory.find(
    (f) => f.weekNum === weekNum - 1 || f.weekNum === weekNum
  );
  if (prevWeekFeedback) {
    const parts: string[] = [];
    if (prevWeekFeedback.effort >= 3) parts.push("high effort last week");
    if (prevWeekFeedback.soreness >= 3) parts.push("elevated soreness");
    if (prevWeekFeedback.scheduleFeeling === "too_much") parts.push("volume felt heavy");
    if (prevWeekFeedback.scheduleFeeling === "too_easy") parts.push("ready for more challenge");
    if (parts.length > 0) {
      factors.push({
        source: "checkin",
        label: "Check-in",
        detail: parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(". ") + " — factored into this week.",
      });
    }
  }

  return factors;
}

export default function AdaptationRibbon({ weekNum }: { weekNum: number }) {
  const { coachingDetail } = useKineStore();
  const factors = useAdaptationFactors(weekNum);
  const [expanded, setExpanded] = useState(coachingDetail === "coach");

  if (factors.length === 0) return null;

  // Quiet mode: tags only
  if (coachingDetail === "quiet") {
    return (
      <div className="mb-4 flex flex-wrap gap-1.5">
        {factors.map((f) => (
          <span
            key={f.source}
            className={`text-[9px] px-2 py-0.5 rounded-full ${SOURCE_TAG_STYLES[f.source]}`}
          >
            {f.label}
          </span>
        ))}
      </div>
    );
  }

  // Default / Coach: collapsible ribbon
  return (
    <div className="mb-4 rounded-[12px] border border-border/30 bg-surface/60 px-3 py-2.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] font-medium text-text">Adapted for you</span>
        </div>
        <span className="text-[10px] text-muted2">
          {expanded ? "‹ collapse" : `${factors.length} factors ›`}
        </span>
      </button>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-border/20 flex flex-col gap-2">
          {factors.map((f) => (
            <div key={f.source} className="flex items-start gap-2">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${SOURCE_DOTS[f.source]}`} />
              <p className="text-[11px] leading-relaxed text-muted2">
                <strong className="text-text">{f.label}</strong> — {f.detail}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
