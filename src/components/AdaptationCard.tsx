"use client";

import { useKineStore } from "@/store/useKineStore";
import { getCurrentPhase } from "@/lib/cycle";
import { getCurrentPhaseInfo } from "@/lib/periodisation";
import type { CyclePhase } from "@/lib/cycle";

interface AdaptationTag {
  label: string;
  variant: "phase" | "block" | "feedback";
}

const PHASE_COPY: Record<CyclePhase, string> = {
  menstrual:
    "Your body is in its recovery phase. We've eased intensity and leaned into movement quality over load.",
  follicular:
    "Rising energy this week. Your body is primed for strength — we've leaned into heavier compound work.",
  ovulatory:
    "Peak energy window. This is your strongest phase — we've programmed to match it.",
  luteal:
    "Your body is prioritising recovery this week. We've kept intensity moderate and leaned into form cues over load increases.",
};

const PHASE_COPY_BEGINNER: Record<CyclePhase, string> = {
  menstrual:
    "Go at your own pace today. Showing up is what counts — movement quality over everything.",
  follicular:
    "Energy is rising. A good window for building confidence with your movements and finding your rhythm.",
  ovulatory:
    "Energy is high this week. Focus on nailing your technique and enjoying the session.",
  luteal:
    "Take it steady this week. Consistency matters more than intensity right now.",
};

export default function AdaptationCard() {
  const { cycleType, cycle, progressDB, exp } = useKineStore();

  const { currentWeek, phaseOffset, weekFeedbackHistory, sessions } =
    progressDB;

  // Periodisation context
  const phaseInfo = getCurrentPhaseInfo(currentWeek, phaseOffset);

  // Cycle context (only for regular cycle tracking)
  const cyclePhase =
    cycleType === "regular"
      ? getCurrentPhase(cycle.periodLog, cycle.avgLength)
      : null;

  // Feedback context — latest week feedback
  const latestFeedback = weekFeedbackHistory.length > 0
    ? weekFeedbackHistory[weekFeedbackHistory.length - 1]
    : null;

  // Build the adaptation message
  let message: string;
  const isBeginner = exp === "new" || (progressDB.sessions?.length ?? 0) < 6;
  if (cyclePhase) {
    message = isBeginner ? PHASE_COPY_BEGINNER[cyclePhase.phase] : PHASE_COPY[cyclePhase.phase];
  } else if (phaseInfo.phase.name === "Deload") {
    message =
      "Your body is asking for recovery. Same movements, significantly lighter. This is based on your recent effort and soreness — not a fixed schedule.";
  } else if (currentWeek === 1) {
    message =
      "Your first week — we're learning your baseline. Expect moderate loads and a chance to settle into the movements.";
  } else {
    message = phaseInfo.description;
  }

  // Build tags
  const tags: AdaptationTag[] = [];

  if (cyclePhase) {
    tags.push({
      label: `${cyclePhase.label} · Day ${cyclePhase.day}`,
      variant: "phase",
    });
  }

  tags.push({
    label: `${phaseInfo.phase.name} block`,
    variant: "block",
  });

  if (latestFeedback) {
    if (latestFeedback.effort >= 3) {
      tags.push({ label: "High effort", variant: "feedback" });
    } else if (latestFeedback.soreness >= 3) {
      tags.push({ label: "Body is sore", variant: "feedback" });
    } else if (latestFeedback.scheduleFeeling === "too_much") {
      tags.push({ label: "Schedule feeling heavy", variant: "feedback" });
    }
  }

  // Don't show card if no meaningful context (week 1, no cycle, no feedback)
  if (currentWeek === 1 && !cyclePhase && !latestFeedback) {
    return (
      <div className="mb-4 rounded-[10px] border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] tracking-[0.2em] uppercase text-accent font-medium">
            Adapted for you
          </span>
        </div>
        <p className="text-sm font-light leading-relaxed text-text">
          Your first week — we&apos;re learning your baseline. Expect moderate
          loads and a chance to settle into the movements.
        </p>
      </div>
    );
  }

  const TAG_STYLES: Record<AdaptationTag["variant"], string> = {
    phase: "bg-[rgba(138,122,90,0.15)] text-[#c4a872]",
    block: "bg-accent-dim text-accent",
    feedback: "bg-accent-dim text-accent",
  };

  return (
    <div className="mb-4 rounded-[10px] border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-accent font-medium">
          Adapted for you
        </span>
      </div>
      <p className="text-sm font-light leading-relaxed text-text mb-3">
        {message}
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className={`text-[10px] px-2.5 py-1 rounded-full ${TAG_STYLES[tag.variant]}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
