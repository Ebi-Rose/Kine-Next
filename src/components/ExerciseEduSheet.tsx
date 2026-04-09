"use client";

import { useState, useEffect } from "react";
import { findExercise } from "@/data/exercise-library";
import { getMuscleTags, getBreathingCue, getConditionCue, isSquat, isHinge, isCompound, KNEE_TRACKING_CUE, NEUTRAL_SPINE_CUE, HIP_HINGE_FIRST, DEPTH_BEFORE_LOAD } from "@/data/education";
import { getSkillPath } from "@/data/skill-paths";
import { EXERCISE_INDICATIONS, type ConditionId } from "@/data/exercise-indications";
import BottomSheet from "@/components/BottomSheet";

type EduEntry = { why?: string; feel?: string; context?: string; cues?: string[] };
type EduLibrary = Record<string, EduEntry>;

interface Props {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  /** Optional legacy AI-generated fields. The sheet now prefers indication
   *  profile data and falls back to these if they're populated. */
  why?: string;
  feel?: string;
  context?: string;
  cues?: string[];
  conditions?: string[];
  /** User's goal — used to substitute {goal} tokens in whyForYou. */
  goal?: "muscle" | "strength" | "general" | null;
  /** Phase-aware framing copy from the indication pipeline (cycle envelope). */
  framing?: string;
  /** Whether a heavy 3–6 rep top set is appropriate for this lift in the current phase. */
  heavyTopSetsAllowed?: boolean;
}

const GOAL_LABELS: Record<string, string> = {
  muscle: "muscle",
  strength: "strength",
  general: "consistency",
};

/** Try exact match first, then partial/fuzzy match against the edu library keys */
function findEduData(name: string, library: EduLibrary): EduEntry | undefined {
  if (library[name]) return library[name];
  const lower = name.toLowerCase();
  for (const key of Object.keys(library)) {
    const keyLower = key.toLowerCase();
    if (lower.includes(keyLower) || keyLower.includes(lower)) {
      return library[key];
    }
  }
  return undefined;
}

/** Lazy-loaded edu library — only fetched when the sheet opens */
let eduCache: EduLibrary | null = null;

export default function ExerciseEduSheet({ open, onClose, exerciseName, why: whyProp, feel: feelProp, context: contextProp, cues: cuesProp, conditions = [], goal, framing, heavyTopSetsAllowed }: Props) {
  const [eduLibrary, setEduLibrary] = useState<EduLibrary | null>(eduCache);

  useEffect(() => {
    if (!open || eduCache) return;
    import("@/data/exercise-edu").then((m) => {
      eduCache = m.EXERCISE_EDU_LIBRARY as EduLibrary;
      setEduLibrary(eduCache);
    });
  }, [open]);

  const lib = findExercise(exerciseName);
  const indication = EXERCISE_INDICATIONS[exerciseName];
  const muscleTags = getMuscleTags(exerciseName);
  const breathCue = getBreathingCue(exerciseName, conditions);
  const condCue = getConditionCue(exerciseName, conditions);
  const skillPath = getSkillPath(exerciseName, []);

  const eduData = eduLibrary ? findEduData(exerciseName, eduLibrary) : undefined;

  // whyForYou: prefer the caller's legacy prop, then the indication
  // profile (with {goal} substitution), then the static edu library,
  // then a generic fallback. The indication path is what the week
  // builder now populates through the pipeline.
  const goalLabel = goal ? GOAL_LABELS[goal] ?? "your goal" : "your goal";
  const indicationWhy = indication?.whyForYou?.replace(/\{goal\}/g, goalLabel);
  const why = whyProp || indicationWhy || eduData?.why || null;
  const feel = feelProp || eduData?.feel || null;
  const context = contextProp || eduData?.context || null;
  const cues = cuesProp || eduData?.cues || null;

  // Exercise-specific modifications for the user's conditions, pulled
  // from the indication profile. Much more specific than the generic
  // conditionCue sourced from the education library.
  const exerciseConditionModifications: Array<{ id: string; note: string }> = [];
  if (indication?.conditionModify) {
    for (const c of conditions) {
      const note = indication.conditionModify[c as ConditionId];
      if (note) exerciseConditionModifications.push({ id: c, note });
    }
  }

  // Cycle-aware envelope content — only render when the pipeline has
  // actually populated it (i.e. the user is in a tracked phase and
  // this exercise carries modulation).
  const showCycleSection = Boolean(framing) || (heavyTopSetsAllowed === false);

  return (
    <BottomSheet open={open} onClose={onClose} title={exerciseName}>
      <div className="flex flex-col gap-4">

        {/* Muscle tags + indication chips */}
        {(muscleTags.primary.length > 0 || muscleTags.secondary.length > 0 || indication) && (
          <div className="flex flex-wrap gap-1.5">
            {muscleTags.primary.map((m) => (
              <span key={m} className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] text-accent font-medium">{m}</span>
            ))}
            {muscleTags.secondary.map((m) => (
              <span key={m} className="rounded-full bg-surface2 px-2.5 py-0.5 text-[10px] text-muted2">{m}</span>
            ))}
            {indication?.sessionRole[0] && (
              <span className="rounded-full border border-border bg-surface2/60 px-2.5 py-0.5 text-[10px] text-muted2 capitalize">
                {indication.sessionRole[0]}
              </span>
            )}
            {indication?.stimulusProfile.slice(0, 2).map((s) => (
              <span key={s} className="rounded-full border border-border bg-surface2/60 px-2.5 py-0.5 text-[10px] text-muted2 capitalize">
                {s}
              </span>
            ))}
            {indication?.cycleModulation && (
              <span className="rounded-full border border-accent/30 bg-accent/8 px-2.5 py-0.5 text-[10px] text-accent">
                cycle-aware
              </span>
            )}
          </div>
        )}

        {/* Why this exercise — always show something */}
        <div>
          <p className="text-[10px] text-accent font-display tracking-wider mb-1">WHY THIS EXERCISE</p>
          <p className="text-xs text-muted2 font-light leading-relaxed">
            {why || (lib
              ? `A ${lib.tags.includes("Compound") ? "compound" : "isolation"} ${lib.muscle} exercise using ${lib.equip.join(" or ")}.`
              : "Exercise information loading...")}
          </p>
        </div>

        {/* Cycle-phase envelope (only when pipeline populated it).
            Plain-language only — never expose numeric caps or RPE. */}
        {showCycleSection && (
          <div className="rounded-lg border border-accent/25 bg-accent/8 p-3">
            <p className="text-[10px] text-accent font-display tracking-wider mb-1">THIS WEEK</p>
            {framing && (
              <p className="text-xs text-muted2 font-light leading-relaxed italic">{framing}</p>
            )}
          </div>
        )}

        {/* Exercise-specific modifications for user's conditions.
            Sourced from indication.conditionModify — much more
            targeted than the generic condition cue below. */}
        {exerciseConditionModifications.length > 0 && (
          <div className="rounded-lg border border-border bg-surface2/40 p-3">
            <p className="text-[10px] text-accent font-display tracking-wider mb-1.5">WORKING AROUND</p>
            <ul className="flex flex-col gap-1.5 list-none m-0 p-0">
              {exerciseConditionModifications.map(({ id, note }) => (
                <li key={id} className="flex items-start gap-2 text-xs">
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] text-accent font-medium capitalize shrink-0">{id.replace(/_/g, " ")}</span>
                  <span className="text-muted2 font-light leading-relaxed">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What you should feel — always show something */}
        <div>
          <p className="text-[10px] text-accent font-display tracking-wider mb-1">WHAT YOU SHOULD FEEL</p>
          <p className="text-xs text-muted2 font-light leading-relaxed">
            {feel || (muscleTags.primary.length > 0
              ? `You should feel your ${muscleTags.primary.join(" and ").toLowerCase()} doing the work. If you feel it elsewhere, check your form.`
              : "Focus on controlled movement through the full range of motion.")}
          </p>
        </div>

        {/* Context */}
        {context && (
          <div>
            <p className="text-[10px] text-accent font-display tracking-wider mb-1">WHY IT&apos;S HERE</p>
            <p className="text-xs text-muted2 font-light leading-relaxed">{context}</p>
          </div>
        )}

        {/* Form cues */}
        {cues && cues.length > 0 && (
          <div>
            <p className="text-[10px] text-accent font-display tracking-wider mb-1.5">FORM CUES</p>
            <ul className="flex flex-col gap-1.5 list-none m-0 p-0">
              {cues.map((cue, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-accent shrink-0 mt-0.5" aria-hidden="true">•</span>
                  <span className="text-muted2 font-light leading-relaxed">{cue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Breathing */}
        {breathCue && (
          <div>
            <p className="text-[10px] text-muted font-display tracking-wider mb-1">BREATHING</p>
            <p className="text-xs text-muted2 font-light leading-relaxed">{breathCue}</p>
          </div>
        )}

        {/* Movement pattern cues */}
        {(isSquat(exerciseName) || isHinge(exerciseName) || isCompound(exerciseName)) && (
          <div>
            <p className="text-[10px] text-muted font-display tracking-wider mb-1">MOVEMENT NOTES</p>
            <div className="flex flex-col gap-1 text-xs text-muted font-light leading-relaxed">
              {isSquat(exerciseName) && <p>{KNEE_TRACKING_CUE}</p>}
              {isSquat(exerciseName) && <p>{DEPTH_BEFORE_LOAD}</p>}
              {isHinge(exerciseName) && <p>{HIP_HINGE_FIRST}</p>}
              {isCompound(exerciseName) && <p>{NEUTRAL_SPINE_CUE}</p>}
            </div>
          </div>
        )}

        {/* Condition-specific education */}
        {condCue && (
          <div>
            <p className="text-[10px] text-accent/80 font-display tracking-wider mb-1">ℹ {condCue.tag.toUpperCase()}</p>
            <p className="text-xs text-muted2 font-light leading-relaxed">{condCue.cue}</p>
          </div>
        )}

        {/* Exercise info */}
        {lib && (
          <div className="border-t border-border pt-3">
            <div className="flex flex-wrap gap-3 text-[10px] text-muted">
              <span>{lib.tags.join(", ")}</span>
              <span>·</span>
              <span>{lib.equip.join(", ")}</span>
              <span>·</span>
              <span>{lib.logType}</span>
              {lib.minExp && <><span>·</span><span>Min: {lib.minExp}</span></>}
              {indication && (
                <>
                  <span>·</span>
                  <span>Skill {indication.technicalDemand}/5</span>
                  <span>·</span>
                  <span>Fatigue {indication.fatigueCost}/5</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Skill path */}
        {skillPath && (skillPath.easier.length > 0 || skillPath.harder.length > 0) && (
          <div className="border-t border-border pt-3">
            <p className="text-[10px] text-muted font-display tracking-wider mb-1.5">PROGRESSION</p>
            {skillPath.hint && <p className="text-[10px] text-muted2 font-light mb-1.5">{skillPath.hint}</p>}
            <div className="flex gap-4 text-[10px]">
              {skillPath.easier.length > 0 && (
                <div>
                  <span className="text-success">← Easier</span>
                  <p className="text-muted font-light mt-0.5">{skillPath.easier.slice(-2).join(", ")}</p>
                </div>
              )}
              {skillPath.harder.length > 0 && (
                <div>
                  <span className="text-accent">Harder →</span>
                  <p className="text-muted font-light mt-0.5">{skillPath.harder.slice(0, 2).join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
