"use client";

import { useState } from "react";
import FullWarmupItem from "./FullWarmupItem";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";

interface WarmupData {
  totalMin: number;
  general: import("@/data/warmup-data").WarmupItem[];
  activation: import("@/data/warmup-data").WarmupItem[];
  stabiliserExtra?: import("@/data/warmup-data").WarmupItem | null;
  injuryItems: import("@/data/warmup-data").WarmupItem[];
  conditionItems: import("@/data/warmup-data").WarmupItem[];
  rampSets: { label: string; spec: string }[];
  firstExName: string | null;
}

export default function WarmupSection({ warmup }: { warmup: WarmupData }) {
  const [showWarmup, setShowWarmup] = useState(true);
  const [showWarmupWarning, setShowWarmupWarning] = useState(false);

  if (!showWarmup) {
    return (
      <button onClick={() => setShowWarmup(true)} className="mb-6 w-full rounded-xl border border-border bg-surface px-4 py-3 text-[10px] text-muted2 hover:text-text transition-colors">
        Show warm up · ~{warmup.totalMin} min
      </button>
    );
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs tracking-wider text-muted uppercase">Warm up</p>
            <p className="text-[10px] text-muted2 mt-0.5">~{warmup.totalMin} min</p>
          </div>
          <button onClick={() => setShowWarmupWarning(true)} className="text-[10px] text-muted2 hover:text-text">
            Skip
          </button>
        </div>

        {/* General prep */}
        {warmup.general.length > 0 && (
          <div className="mb-2">
            <p className="text-[8px] tracking-widest text-muted uppercase mb-1">General prep</p>
            <div className="flex flex-col gap-1">
              {warmup.general.map((wu, i) => (
                <FullWarmupItem key={`g-${i}`} item={wu} />
              ))}
            </div>
          </div>
        )}

        {/* Activation */}
        {warmup.activation.length > 0 && (
          <div className="mb-2">
            <p className="text-[8px] tracking-widest text-muted uppercase mb-1">Activation</p>
            <div className="flex flex-col gap-1">
              {warmup.activation.map((wu, i) => (
                <FullWarmupItem key={`a-${i}`} item={wu} />
              ))}
            </div>
          </div>
        )}

        {/* Stabiliser prep */}
        {warmup.stabiliserExtra && (
          <div className="mb-2">
            <p className="text-[8px] tracking-widest text-muted uppercase mb-1">Stabiliser prep</p>
            <FullWarmupItem item={warmup.stabiliserExtra} />
          </div>
        )}

        {/* Injury mods */}
        {warmup.injuryItems.length > 0 && (
          <div className="mb-2">
            <p className="text-[8px] tracking-widest text-accent/60 uppercase mb-1">For your injuries</p>
            <div className="flex flex-col gap-1">
              {warmup.injuryItems.map((wu, i) => (
                <FullWarmupItem key={`inj-${i}`} item={wu} />
              ))}
            </div>
          </div>
        )}

        {/* Condition mods */}
        {warmup.conditionItems.length > 0 && (
          <div className="mb-2">
            <p className="text-[8px] tracking-widest text-accent/60 uppercase mb-1">For your body</p>
            <div className="flex flex-col gap-1">
              {warmup.conditionItems.map((wu, i) => (
                <FullWarmupItem key={`cond-${i}`} item={wu} />
              ))}
            </div>
          </div>
        )}

        {/* Ramp-up sets */}
        {warmup.rampSets.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/[0.04]">
            <p className="text-[8px] tracking-widest text-muted uppercase mb-1.5">Ramp-up sets · {warmup.firstExName}</p>
            <div className="flex flex-wrap gap-1.5">
              {warmup.rampSets.map((rs, i) => (
                <div key={i} className="rounded-lg bg-surface2/50 px-2.5 py-1.5 text-[10px]">
                  <span className="font-medium text-accent">{rs.label}</span>
                  <span className="text-muted2 ml-1">{rs.spec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Warmup skip warning */}
      {showWarmupWarning && (
        <BottomSheet open={true} onClose={() => setShowWarmupWarning(false)}>
          <div className="px-1 pb-4">
            <h3 className="font-display text-lg tracking-wide text-text mb-2">Skip warm up?</h3>
            <p className="text-xs text-muted2 leading-relaxed mb-4">
              Warming up reduces injury risk and improves performance. Cold muscles are more prone to strain, especially on compound lifts.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowWarmupWarning(false)}>
                Keep warm up
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-muted" onClick={() => { setShowWarmup(false); setShowWarmupWarning(false); }}>
                Skip anyway
              </Button>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
