"use client";

import { findExercise } from "@/data/exercise-library";
import { getMuscleTags, getBreathingCue, getConditionCue, isSquat, isHinge, isCompound, KNEE_TRACKING_CUE, NEUTRAL_SPINE_CUE, HIP_HINGE_FIRST, DEPTH_BEFORE_LOAD } from "@/data/education";
// @ts-ignore
import { EXERCISE_EDU_LIBRARY } from "@/data/exercise-edu";
import { getSkillPath } from "@/data/skill-paths";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  /** AI-generated fields from the week builder */
  why?: string;
  feel?: string;
  context?: string;
  cues?: string[];
  conditions?: string[];
}

/** Try exact match first, then partial/fuzzy match against the edu library keys */
function findEduData(name: string, library: Record<string, unknown>): unknown {
  if (library[name]) return library[name];
  const lower = name.toLowerCase();
  // Try matching by removing common prefixes/suffixes
  for (const key of Object.keys(library)) {
    const keyLower = key.toLowerCase();
    if (lower.includes(keyLower) || keyLower.includes(lower)) {
      return library[key];
    }
  }
  return undefined;
}

export default function ExerciseEduSheet({ open, onClose, exerciseName, why: whyProp, feel: feelProp, context: contextProp, cues: cuesProp, conditions = [] }: Props) {
  const lib = findExercise(exerciseName);
  const muscleTags = getMuscleTags(exerciseName);
  const breathCue = getBreathingCue(exerciseName, conditions);
  const condCue = getConditionCue(exerciseName, conditions);
  const skillPath = getSkillPath(exerciseName, []);

  // Fall back to EXERCISE_EDU_LIBRARY when AI fields aren't provided
  const eduLibrary = EXERCISE_EDU_LIBRARY as Record<string, { why?: string; feel?: string; context?: string; cues?: string[] }>;
  const eduData = findEduData(exerciseName, eduLibrary) as typeof eduLibrary[string] | undefined;
  const why = whyProp || eduData?.why || null;
  const feel = feelProp || eduData?.feel || null;
  const context = contextProp || eduData?.context || null;
  const cues = cuesProp || eduData?.cues || null;

  return (
    <BottomSheet open={open} onClose={onClose} title={exerciseName}>
      <div className="flex flex-col gap-4">

        {/* Muscle tags */}
        {(muscleTags.primary.length > 0 || muscleTags.secondary.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {muscleTags.primary.map((m) => (
              <span key={m} className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] text-accent font-medium">{m}</span>
            ))}
            {muscleTags.secondary.map((m) => (
              <span key={m} className="rounded-full bg-surface2 px-2.5 py-0.5 text-[10px] text-muted2">{m}</span>
            ))}
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
                  <span className="text-green-400">← Easier</span>
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
