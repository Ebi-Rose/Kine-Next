"use client";

import { useState } from "react";
import type { ExerciseLog } from "./types";
import { findExercise } from "@/data/exercise-library";
import { getBreathingCue, getMuscleTags, getConditionCue, KNEE_TRACKING_CUE, NEUTRAL_SPINE_CUE, HIP_HINGE_FIRST, isSquat, isHinge, isCompound } from "@/data/education";
import { getSkillPath, hasSkillPath } from "@/data/skill-paths";
import { getVideoThumb, hasVideo, getVideoUrl } from "@/data/exercise-videos";
import { useExerciseVideosReady } from "@/hooks/useExerciseVideosReady";
import { getProgressionSuggestion, getIncrement } from "@/lib/progression";
import { getExerciseStallWeeks } from "@/lib/programme-age";
import { useKineStore } from "@/store/useKineStore";
import { weightUnit, weightUnitPerSide } from "@/lib/format";
import Button from "@/components/Button";

export default function ExerciseCard({
  index, exercise, log, expanded, onToggle, onUpdateSet, onUpdateNote, onSave, onSkip, onUnskip, onSwap, onQuickSwap, swapLoading, onVideoPlay, onVideoSheet, onSkillPath, onEduSheet, onClearPrefill, eduMode = "full", conditions = [], lastFeedback,
}: {
  index: number;
  exercise: {
    name: string;
    sets: string;
    reps: string;
    rest: string;
    swappedFrom?: string;
    swappedReason?: string;
    useOriginal?: boolean;
    // Populated by the indication pipeline (v1.0)
    whyForYou?: string;
    scoringFactors?: string[];
    workingLoadCap?: number;
    heavyTopSetsAllowed?: boolean;
    framing?: string;
    droppable?: boolean;
    droppableReason?: string;
  };
  log: ExerciseLog | undefined;
  expanded: boolean;
  onToggle: () => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: "reps" | "weight", val: string) => void;
  onUpdateNote: (exIdx: number, note: string) => void;
  onSave: (exIdx: number) => void;
  onSkip: (exIdx: number) => void;
  onUnskip: (exIdx: number) => void;
  onSwap: (exIdx: number) => void;
  onQuickSwap?: (exIdx: number, newName: string) => void;
  swapLoading: boolean;
  onVideoPlay?: (url: string) => void;
  onVideoSheet?: (name: string) => void;
  onSkillPath?: (name: string) => void;
  onEduSheet?: (exIdx: number) => void;
  onClearPrefill?: (exIdx: number) => void;
  eduMode?: string;
  conditions?: string[];
  lastFeedback?: { verdict: string; note: string };
}) {
  const system = useKineStore((s) => s.measurementSystem) || "metric";
  const unit = weightUnit(system);
  const unitPerSide = weightUnitPerSide(system);
  // Subscribe so this card re-renders when the Supabase video cache lands.
  useExerciseVideosReady();
  const [showVideoInline, setShowVideoInline] = useState(false);
  const [showRationale, setShowRationale] = useState(false);

  if (!log) return null;
  const skipped = log.saved && log.actual.length === 0;
  const exInfo = findExercise(exercise.name);
  const muscleTags = getMuscleTags(exercise.name);
  const videoThumb = getVideoThumb(exercise.name);
  const vidUrl = getVideoUrl(exercise.name);

  // Category color for left border accent
  const catColor = exInfo?.muscle
    ? { push: "var(--color-cat-push)", pull: "var(--color-cat-pull)", legs: "var(--color-cat-legs)", hinge: "var(--color-cat-hinge)", core: "var(--color-cat-core)", cardio: "var(--color-cat-cardio)", calisthenics: "var(--color-cat-core)" }[exInfo.muscle] || "var(--color-border)"
    : "var(--color-border)";

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        skipped ? "border-border/50 bg-surface/50 opacity-50"
          : log.saved ? "border-accent/30 bg-accent-dim/50"
          : expanded ? "border-border-active bg-surface"
          : "border-border bg-surface"
      }`}
      style={{ borderLeftWidth: "3px", borderLeftColor: skipped ? "var(--color-border)" : catColor }}
    >
      {/* Unskip row (when expanded and skipped) */}
      {expanded && skipped && (
        <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-0">
          <button onClick={(e) => { e.stopPropagation(); onUnskip(index); }}
            className="text-[10px] text-accent hover:text-text transition-colors px-2 py-1">Undo skip</button>
        </div>
      )}

      {/* Skip/Swap row at top (when expanded and not saved) */}
      {expanded && !log.saved && !skipped && (
        <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-0">
          <button onClick={(e) => { e.stopPropagation(); onSkip(index); }}
            className="text-[10px] text-muted hover:text-text transition-colors px-2 py-1">Skip</button>
          <button onClick={(e) => { e.stopPropagation(); onSwap(index); }}
            className="text-[10px] text-muted border border-border rounded px-2 py-1 hover:border-border-active transition-all">Swap</button>
          {hasSkillPath(exercise.name) && onSkillPath && (
            <button onClick={(e) => { e.stopPropagation(); onSkillPath(exercise.name); }}
              className="text-[10px] text-muted border border-border rounded px-2 py-1 hover:border-border-active transition-all">Easier/Harder</button>
          )}
        </div>
      )}

      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        className="flex w-full items-center gap-3 p-4 pt-2 text-left cursor-pointer"
      >
        {/* Thumbnail placeholder */}
        {videoThumb ? (
          <button
            type="button"
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setShowVideoInline((v) => !v); }}
            aria-label={showVideoInline ? `Hide ${exercise.name} video` : `Play ${exercise.name} video inline`}
          >
            <img src={videoThumb} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="text-white text-[10px]">{showVideoInline ? "✕" : "▶"}</span>
            </span>
          </button>
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-lg border border-border flex items-center justify-center"
            style={{ background: `${catColor}10` }}>
            <div className="h-3 w-3 rounded-full" style={{ background: catColor }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-medium truncate ${skipped ? "line-through text-muted" : "text-text"}`}>
              {exercise.useOriginal && exercise.swappedFrom ? exercise.swappedFrom : exercise.name}
            </span>
            {log.saved && !skipped && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] text-accent shrink-0">✓ saved</span>
            )}
            {skipped && (
              <span className="rounded-full bg-border px-2 py-0.5 text-[9px] text-muted shrink-0">skipped</span>
            )}
            {exercise.swappedFrom && !skipped && exercise.swappedReason && exercise.swappedReason !== "user" && (
              <span className="rounded-full border border-accent/30 bg-accent-dim px-2 py-0.5 text-[9px] text-accent shrink-0">↻ adapted</span>
            )}
            {exercise.swappedFrom && !skipped && (!exercise.swappedReason || exercise.swappedReason === "user") && (
              <span className="rounded-full border border-border bg-surface2 px-2 py-0.5 text-[9px] text-muted shrink-0">↻ swapped</span>
            )}
            {exercise.droppable && !skipped && (
              <span className="rounded-full border border-muted/30 bg-surface2 px-2 py-0.5 text-[9px] text-muted shrink-0">ok to skip</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-muted2 font-light">
              {exercise.sets}×{exercise.reps}
              {exercise.rest !== "-" && ` · ${exercise.rest}`}
            </span>
            {exInfo && (
              <span className="text-[10px] text-muted font-light">
                · {exInfo.tags.includes("Compound") ? "Compound" : "Isolation"}
              </span>
            )}
          </div>
          {(muscleTags.primary.length > 0 || muscleTags.secondary.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {[...muscleTags.primary, ...muscleTags.secondary].slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-surface2/60 px-1.5 py-0.5 text-[9px] text-muted2 font-light">{tag}</span>
              ))}
              {exercise.framing && (
                <span className="rounded-full border border-accent/25 bg-accent/8 px-1.5 py-0.5 text-[9px] text-accent font-light">
                  cycle-aware
                </span>
              )}
            </div>
          )}
          {/* Rationale strip: whyForYou + expandable top factors. Only
              renders when the indication pipeline has populated it. */}
          {expanded && exercise.whyForYou && (
            <div className="mt-2 rounded-lg border border-border/60 bg-surface2/40 px-3 py-2">
              <p className="text-[11px] leading-snug text-muted font-light">
                {exercise.whyForYou}
              </p>
              {exercise.framing && (
                <p className="mt-1 text-[11px] leading-snug text-accent/90 font-light italic">
                  {exercise.framing}
                </p>
              )}
              {exercise.scoringFactors && exercise.scoringFactors.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowRationale((v) => !v); }}
                    className="mt-1 text-[10px] text-accent/80 hover:text-accent transition-colors"
                  >
                    {showRationale ? "Hide reasoning" : "Why this?"}
                  </button>
                  {showRationale && (
                    <ul className="mt-1 space-y-0.5">
                      {exercise.scoringFactors.map((f) => (
                        <li key={f} className="text-[10px] text-muted2 font-light">· {f}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
          {expanded && exercise.droppable && exercise.droppableReason && (
            <p className="mt-1.5 text-[11px] leading-snug text-muted font-light italic">
              {exercise.droppableReason}
            </p>
          )}
        </div>
        {/* Education "?" button */}
        {onEduSheet && (
          <button
            onClick={(e) => { e.stopPropagation(); onEduSheet(index); }}
            className="shrink-0 w-6 h-6 rounded-full bg-accent/8 border border-accent/25 text-accent text-[11px] flex items-center justify-center hover:bg-accent/15 transition-all"
          >
            ?
          </button>
        )}
        <span className="text-muted text-[10px] shrink-0">{expanded ? "▾" : "▸"}</span>
      </div>

      {showVideoInline && vidUrl && (
        <div className="mx-auto mb-3 w-full max-w-[240px] aspect-[9/16] rounded-lg overflow-hidden border border-border bg-black relative">
          <button
            type="button"
            onClick={() => setShowVideoInline(false)}
            aria-label="Close video"
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80"
          >
            ✕
          </button>
          <video
            src={vidUrl}
            autoPlay
            loop
            muted
            playsInline
            controls
            aria-label={`${exercise.name} demonstration video`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {expanded && !log.saved && (() => {
        const exInfo = findExercise(exercise.name);
        const logType = exInfo?.logType || "weighted";
        const breathCue = getBreathingCue(exercise.name, conditions);
        const condCue = getConditionCue(exercise.name, conditions);
        const progression = getProgressionSuggestion(exercise.name);
        const skillPath = hasSkillPath(exercise.name) ? getSkillPath(exercise.name, []) : null;

        return (
          <div className="border-t border-border/50 px-4 pb-4 pt-3">
            {/* Education — respects coaching mode */}
            {eduMode === "silent" ? null : (<>
            {/* Breathing cue */}
            {breathCue && (
              <p className="mb-3 text-[10px] text-accent italic">{breathCue}</p>
            )}

            {/* Per-exercise coach feedback from last time */}
            {lastFeedback && (
              <p className="mb-3 text-[10px] text-accent/80 font-light italic">
                Last time: {lastFeedback.note}
              </p>
            )}

            {/* Progression suggestion — user always has final say */}
            {progression && logType.startsWith("weighted") && (
              <div className={`mb-3 rounded-lg border px-3 py-2 ${
                progression.confidence === "ready" ? "border-accent/30 bg-accent-dim/20"
                : progression.confidence === "deload" ? "border-warning/30 bg-warning/5"
                : "border-border/50 bg-surface2/30"
              }`}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted2">
                    Last: {progression.lastSession.weight}{progression.unit} × {progression.lastSession.reps} reps
                  </p>
                  {progression.volume.previous !== null && (
                    <p className="text-[9px] text-muted">
                      Vol: {progression.volume.current}
                      {progression.volume.current > progression.volume.previous ? " ↑" : progression.volume.current < progression.volume.previous ? " ↓" : ""}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-text mt-1">{progression.reason}</p>
                {progression.confidence === "ready" && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => {
                        log.actual.forEach((_, setIdx) => {
                          onUpdateSet(index, setIdx, "weight", String(progression.suggestedWeight));
                        });
                      }}
                      className="rounded bg-accent/15 px-2 py-0.5 text-[10px] text-accent hover:bg-accent/25 transition-colors"
                    >
                      Use {progression.suggestedWeight}{progression.unit}
                    </button>
                    <button
                      onClick={() => {
                        log.actual.forEach((_, setIdx) => {
                          onUpdateSet(index, setIdx, "weight", String(progression.currentWeight));
                        });
                      }}
                      className="text-[10px] text-muted hover:text-text transition-colors"
                    >
                      Stay at {progression.currentWeight}{progression.unit}
                    </button>
                  </div>
                )}
                {progression.confidence === "deload" && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => {
                        log.actual.forEach((_, setIdx) => {
                          onUpdateSet(index, setIdx, "weight", String(progression.suggestedWeight));
                        });
                      }}
                      className="rounded bg-warning/15 px-2 py-0.5 text-[10px] text-warning hover:bg-warning/25 transition-colors"
                    >
                      Start at {progression.suggestedWeight}{progression.unit}
                    </button>
                    <button
                      onClick={() => {
                        log.actual.forEach((_, setIdx) => {
                          onUpdateSet(index, setIdx, "weight", String(progression.currentWeight));
                        });
                      }}
                      className="text-[10px] text-muted hover:text-text transition-colors"
                    >
                      Resume at {progression.currentWeight}{progression.unit}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pre-fill indicator — body trust: explain, don't dictate */}
            {log.prefilled && (
              <div className="mb-3 rounded-lg border border-accent/20 bg-accent-dim/15 px-3 py-2 flex items-center justify-between" role="status" aria-live="polite">
                <p className="text-[10px] text-muted2 font-light">
                  Pre-filled from your last session
                </p>
                {onClearPrefill && (
                  <button
                    onClick={() => onClearPrefill(index)}
                    className="text-[10px] text-accent hover:text-text transition-colors ml-2 shrink-0"
                  >
                    Start fresh
                  </button>
                )}
              </div>
            )}

            <p className="mb-3 text-[10px] tracking-wider text-muted uppercase">Log your sets</p>
            <div className="flex flex-col gap-2">
              {log.actual.map((set, setIdx) => (
                <div key={setIdx} className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-xs text-muted">Set {setIdx + 1}</span>

                  {/* Weighted: reps × weight */}
                  {(logType === "weighted" || logType === "weighted_unilateral") && (() => {
                    const inc = getIncrement(exercise.name);
                    return (
                    <>
                      <div className="flex items-center gap-1">
                        <button aria-label={`Decrease reps for ${exercise.name} set ${setIdx + 1}`} onClick={() => {
                          const cur = parseInt(set.reps) || 0;
                          if (cur > 0) onUpdateSet(index, setIdx, "reps", String(cur - 1));
                        }} className="rounded bg-surface2 min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-muted2 hover:text-text flex items-center justify-center">−</button>
                        <input type="number" inputMode="numeric" placeholder="reps" value={set.reps}
                          aria-label={`Set ${setIdx + 1} reps for ${exercise.name}`}
                          onChange={(e) => onUpdateSet(index, setIdx, "reps", e.target.value)}
                          className="w-14 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                        <button aria-label={`Increase reps for ${exercise.name} set ${setIdx + 1}`} onClick={() => {
                          const cur = parseInt(set.reps) || 0;
                          onUpdateSet(index, setIdx, "reps", String(cur + 1));
                        }} className="rounded bg-surface2 min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-muted2 hover:text-text flex items-center justify-center">+</button>
                      </div>
                      <span className="text-muted">×</span>
                      <div className="flex items-center gap-1">
                        <button aria-label={`Decrease weight for ${exercise.name} set ${setIdx + 1}`} onClick={() => {
                          const cur = parseFloat(set.weight) || 0;
                          if (cur >= inc) onUpdateSet(index, setIdx, "weight", String(cur - inc));
                        }} className="rounded bg-surface2 min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-muted2 hover:text-text flex items-center justify-center">−</button>
                        <input type="number" inputMode="decimal" placeholder={unit} value={set.weight}
                          aria-label={`Set ${setIdx + 1} weight for ${exercise.name}`}
                          onChange={(e) => onUpdateSet(index, setIdx, "weight", e.target.value)}
                          className="w-14 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                        <button aria-label={`Increase weight for ${exercise.name} set ${setIdx + 1}`} onClick={() => {
                          const cur = parseFloat(set.weight) || 0;
                          onUpdateSet(index, setIdx, "weight", String(cur + inc));
                        }} className="rounded bg-surface2 min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-muted2 hover:text-text flex items-center justify-center">+</button>
                      </div>
                      <span className="text-[10px] text-muted">{logType === "weighted_unilateral" ? unitPerSide : unit}</span>
                    </>
                    );
                  })()}

                  {/* Bodyweight: reps only */}
                  {(logType === "bodyweight" || logType === "bodyweight_unilateral") && (
                    <>
                      <div className="flex items-center gap-1">
                        <button aria-label={`Decrease reps for ${exercise.name} set ${setIdx + 1}`} onClick={() => {
                          const cur = parseInt(set.reps) || 0;
                          if (cur > 0) onUpdateSet(index, setIdx, "reps", String(cur - 1));
                        }} className="rounded bg-surface2 min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-muted2 hover:text-text flex items-center justify-center">−</button>
                        <input type="number" inputMode="numeric" placeholder="reps" value={set.reps}
                          aria-label={`Set ${setIdx + 1} reps for ${exercise.name}`}
                          onChange={(e) => onUpdateSet(index, setIdx, "reps", e.target.value)}
                          className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                        <button aria-label={`Increase reps for ${exercise.name} set ${setIdx + 1}`} onClick={() => {
                          const cur = parseInt(set.reps) || 0;
                          onUpdateSet(index, setIdx, "reps", String(cur + 1));
                        }} className="rounded bg-surface2 min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-muted2 hover:text-text flex items-center justify-center">+</button>
                      </div>
                      <span className="text-xs text-muted">{logType === "bodyweight_unilateral" ? "reps/side" : "reps"}</span>
                    </>
                  )}

                  {/* Timed: seconds */}
                  {logType === "timed" && (
                    <>
                      <input type="number" inputMode="numeric" placeholder="sec" value={set.reps}
                        aria-label={`Set ${setIdx + 1} seconds for ${exercise.name}`}
                        onChange={(e) => onUpdateSet(index, setIdx, "reps", e.target.value)}
                        className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                      <span className="text-xs text-muted">sec</span>
                    </>
                  )}

                  {/* Cardio: minutes + distance */}
                  {logType === "cardio" && setIdx === 0 && (
                    <>
                      <input type="number" inputMode="numeric" placeholder="min" value={set.reps}
                        aria-label={`Minutes for ${exercise.name}`}
                        onChange={(e) => onUpdateSet(index, setIdx, "reps", e.target.value)}
                        className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                      <span className="text-xs text-muted">min</span>
                      <input type="number" inputMode="numeric" placeholder="m" value={set.weight}
                        aria-label={`Distance in metres for ${exercise.name}`}
                        onChange={(e) => onUpdateSet(index, setIdx, "weight", e.target.value)}
                        className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-center text-sm text-text outline-none focus:border-accent" />
                      <span className="text-xs text-muted">m</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            <textarea placeholder="Notes (optional)" aria-label={`Notes for ${exercise.name}`} value={log.note}
              onChange={(e) => onUpdateNote(index, e.target.value)} rows={2}
              className="mt-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent resize-none" />

            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => onSave(index)}>Save</Button>
            </div>

            {/* Skill path action — video is already playable from the header thumbnail */}
            {skillPath && (skillPath.easier.length > 0 || skillPath.harder.length > 0) && onSkillPath && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onSkillPath(exercise.name)}
                  className="flex items-center gap-1.5 rounded-lg bg-surface2/50 px-2.5 py-1.5 text-[10px] text-muted2 hover:text-accent transition-colors"
                >
                  ↕ Adjust difficulty
                </button>
              </div>
            )}

            {/* #17: Exercise stall detection */}
            {(() => {
              const stallWeeks = getExerciseStallWeeks(exercise.name);
              if (stallWeeks >= 3) {
                return (
                  <div className="mt-3 rounded-lg border border-accent/20 bg-accent-dim/30 px-3 py-2">
                    <p className="text-[10px] text-accent font-medium">
                      Weight hasn&apos;t increased in {stallWeeks} sessions
                    </p>
                    <p className="text-[10px] text-muted2 font-light mt-0.5">
                      {stallWeeks >= 5
                        ? "Consider swapping to a variation, adjusting rep range, or taking a deload."
                        : "This is normal — focus on form and rep quality. The weight will follow."}
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Muscle tags */}
            {(muscleTags.primary.length > 0 || muscleTags.secondary.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1">
                {muscleTags.primary.map((m) => (
                  <span key={m} className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] text-accent">{m}</span>
                ))}
                {muscleTags.secondary.map((m) => (
                  <span key={m} className="rounded-full bg-surface2 px-2 py-0.5 text-[9px] text-muted2">{m}</span>
                ))}
              </div>
            )}

            {/* Education cues — full mode only */}
            {eduMode === "full" && isSquat(exercise.name) && (
              <p className="mt-2 text-[10px] text-muted font-light">{KNEE_TRACKING_CUE}</p>
            )}
            {eduMode === "full" && isHinge(exercise.name) && (
              <p className="mt-2 text-[10px] text-muted font-light">{HIP_HINGE_FIRST}</p>
            )}
            {eduMode === "full" && isCompound(exercise.name) && (
              <p className="mt-2 text-[10px] text-muted font-light">{NEUTRAL_SPINE_CUE}</p>
            )}
            {/* Condition-specific education cue — full mode only, 1 max */}
            {eduMode === "full" && condCue && (
              <p className="mt-2 text-[10px] text-accent/80 font-light">ℹ {condCue.tag}: {condCue.cue}</p>
            )}
            </>)}

            {/* Skill path hint (inline preview) — tap to auto-swap */}
            {skillPath && (skillPath.easier.length > 0 || skillPath.harder.length > 0) && (
              <div className="mt-3 rounded-lg bg-surface2/50 px-3 py-2">
                <p className="text-[9px] tracking-wider text-muted uppercase mb-1">Difficulty</p>
                {skillPath.hint && <p className="text-[10px] text-muted2 mb-1.5">{skillPath.hint}</p>}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {skillPath.easier.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onQuickSwap?.(index, skillPath.easier.slice(-1)[0])}
                      disabled={!onQuickSwap}
                      className="text-success underline underline-offset-2 decoration-success/30 hover:decoration-success transition-colors disabled:no-underline disabled:cursor-default"
                    >
                      ← Easier: {skillPath.easier.slice(-1)[0]}
                    </button>
                  )}
                  {skillPath.harder.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onQuickSwap?.(index, skillPath.harder[0])}
                      disabled={!onQuickSwap}
                      className="text-accent underline underline-offset-2 decoration-accent/30 hover:decoration-accent transition-colors disabled:no-underline disabled:cursor-default"
                    >
                      Harder: {skillPath.harder[0]} →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {expanded && log.saved && !skipped && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="flex flex-col gap-1 text-xs text-muted2">
            {log.actual.filter((s) => s.reps || s.weight).map((s, i) => (
              <span key={i}>Set {i + 1}: {s.reps} reps × {s.weight || "BW"} {unit}</span>
            ))}
          </div>
          {log.note && <p className="mt-2 text-xs text-muted italic">{log.note}</p>}
        </div>
      )}
    </div>
  );
}
