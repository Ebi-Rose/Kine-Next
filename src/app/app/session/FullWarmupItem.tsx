"use client";

import { useState } from "react";
import type { WarmupItem } from "@/data/warmup-data";

export default function FullWarmupItem({ item }: { item: WarmupItem }) {
  const [checked, setChecked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAlts, setShowAlts] = useState(false);
  const [current, setCurrent] = useState(item);

  return (
    <div className={`rounded-lg transition-all ${checked ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-2 px-2 py-1.5">
        {/* Checkbox */}
        <button
          onClick={() => setChecked(!checked)}
          className={`shrink-0 mt-0.5 w-4 h-4 rounded border transition-all flex items-center justify-center ${
            checked ? "bg-accent border-accent" : "border-border hover:border-accent/50"
          }`}
        >
          {checked && <span className="text-[8px] text-bg">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between text-left">
            <span className={`text-xs truncate ${checked ? "line-through text-muted" : "text-text"}`}>{current.name}</span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {current._injuryProtective && (
                <span className="text-[7px] bg-accent/10 text-accent px-1 py-0.5 rounded">protective</span>
              )}
              <span className="text-[10px] text-muted">{current.duration}</span>
              <span className="text-[9px] text-muted2">{expanded ? "▾" : "▸"}</span>
            </div>
          </button>

          {/* Expanded detail */}
          {expanded && (
            <div className="mt-1.5 animate-fade-up">
              <p className="text-[10px] text-muted2 font-light leading-relaxed">{current.detail}</p>
              {current._why && (
                <p className="mt-1 text-[9px] text-accent/70 font-light italic leading-relaxed">{current._why}</p>
              )}

              {/* Alternatives */}
              {current.alts && current.alts.length > 0 && (
                <div className="mt-1.5">
                  <button onClick={() => setShowAlts(!showAlts)} className="text-[9px] text-muted hover:text-accent transition-colors">
                    {showAlts ? "Hide options" : `${current.alts.length} alternatives`}
                  </button>
                  {showAlts && (
                    <div className="mt-1 flex flex-col gap-1">
                      {current.alts.map((alt, i) => (
                        <button
                          key={i}
                          onClick={() => { setCurrent({ ...alt, alts: current.alts }); setShowAlts(false); }}
                          className="text-left rounded-lg bg-surface2/30 px-2 py-1.5 text-[10px] hover:bg-surface2/50 transition-all"
                        >
                          <span className="text-text">{alt.name}</span>
                          <span className="text-muted2 ml-1">· {alt.duration}</span>
                          <p className="text-muted2 font-light mt-0.5 text-[9px] leading-relaxed">{alt.detail}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
