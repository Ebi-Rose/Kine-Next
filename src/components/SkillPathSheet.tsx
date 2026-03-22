"use client";

import { useKineStore } from "@/store/useKineStore";
import { getSkillPath, SKILL_HINTS } from "@/data/skill-paths";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  onSelect: (newExerciseName: string) => void;
}

export default function SkillPathSheet({ open, onClose, exerciseName, onSelect }: Props) {
  const { equip } = useKineStore();
  const path = getSkillPath(exerciseName, equip);

  if (!path) return null;

  const hint = SKILL_HINTS[exerciseName];

  function handleSelect(name: string) {
    onSelect(name);
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Adjust Difficulty">
      {/* Current exercise */}
      <div className="rounded-[var(--radius-default)] border border-accent bg-accent-dim p-3 mb-4">
        <p className="text-sm font-medium text-text">{exerciseName}</p>
        {hint && <p className="text-[10px] text-muted2 mt-1">{hint}</p>}
        <span className="mt-1 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent">
          Current
        </span>
      </div>

      {/* Easier options */}
      {path.easier.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] tracking-wider text-muted uppercase">Make easier</p>
          <div className="flex flex-col gap-1">
            {path.easier.slice(-3).map((name) => (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-left hover:border-border-active transition-all"
              >
                <div>
                  <span className="text-xs font-medium text-text">{name}</span>
                  {SKILL_HINTS[name] && (
                    <p className="text-[10px] text-muted">{SKILL_HINTS[name]}</p>
                  )}
                </div>
                <span className="text-[10px] text-green-400">easier</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Harder options */}
      {path.harder.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] tracking-wider text-muted uppercase">Make harder</p>
          <div className="flex flex-col gap-1">
            {path.harder.slice(0, 3).map((name) => (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 text-left hover:border-border-active transition-all"
              >
                <div>
                  <span className="text-xs font-medium text-text">{name}</span>
                  {SKILL_HINTS[name] && (
                    <p className="text-[10px] text-muted">{SKILL_HINTS[name]}</p>
                  )}
                </div>
                <span className="text-[10px] text-accent">harder</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {path.easier.length === 0 && (
        <p className="text-xs text-muted2 mb-4">This is the easiest variation in this chain.</p>
      )}
      {path.harder.length === 0 && (
        <p className="text-xs text-muted2">This is the most advanced variation in this chain.</p>
      )}
    </BottomSheet>
  );
}
