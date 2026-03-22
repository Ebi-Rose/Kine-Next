"use client";

import { useState, useEffect, useRef } from "react";
import { getMuscleInfo } from "@/data/education";
import BottomSheet from "@/components/BottomSheet";

// SVG ID → muscle group mapping
const MMAP: Record<string, string> = {
  "sd-f-trap":"traps","sd-f-shl":"shoulders","sd-f-shr":"shoulders",
  "sd-f-pecl":"chest","sd-f-pecr":"chest",
  "sd-f-serl":"serratus","sd-f-serl2":"serratus","sd-f-serl3":"serratus",
  "sd-f-serr":"serratus","sd-f-serr2":"serratus","sd-f-serr3":"serratus",
  "sd-f-bicl":"biceps","sd-f-bicr":"biceps",
  "sd-f-tril":"triceps","sd-f-trir":"triceps",
  "sd-f-ab1l":"abs","sd-f-ab1r":"abs","sd-f-ab2l":"abs","sd-f-ab2r":"abs",
  "sd-f-ab3l":"abs","sd-f-ab3r":"abs",
  "sd-f-obll":"core","sd-f-oblr":"core",
  "sd-f-hipl":"hips","sd-f-hipr":"hips",
  "sd-f-rfl":"quads","sd-f-rfr":"quads",
  "sd-f-vll":"quads","sd-f-vlr":"quads",
  "sd-f-vml":"quads","sd-f-vmr":"quads",
  "sd-b-trapu":"traps","sd-b-trapm":"traps",
  "sd-b-dell":"rear-delt","sd-b-delr":"rear-delt",
  "sd-b-infl":"rotator","sd-b-infr":"rotator",
  "sd-b-latl":"lats","sd-b-latr":"lats",
  "sd-b-tril":"triceps","sd-b-trir":"triceps",
  "sd-b-erecl":"erectors","sd-b-erecr":"erectors",
  "sd-b-gmedl":"glutes","sd-b-gmedr":"glutes",
  "sd-b-glutl":"glutes","sd-b-glutr":"glutes",
  "sd-b-hambl":"hamstrings","sd-b-hamml":"hamstrings",
  "sd-b-hambr":"hamstrings","sd-b-hammr":"hamstrings",
  "sd-b-calfl":"calves","sd-b-caflm":"calves",
  "sd-b-calfr":"calves","sd-b-cafrm":"calves",
};

const SESSION_HIGHLIGHT: Record<string, { pri: string[]; sec: string[] }> = {
  push:  { pri:["chest","shoulders"],          sec:["triceps","serratus","rear-delt"] },
  pull:  { pri:["lats","traps","rear-delt"],   sec:["biceps","rotator","erectors"] },
  legs:  { pri:["quads","glutes"],             sec:["hamstrings","hips","calves","core"] },
  hinge: { pri:["hamstrings","glutes","erectors"], sec:["lats","traps","calves"] },
  core:  { pri:["abs","core"],                 sec:["hips","erectors"] },
};

const MUSCLE_LABELS: Record<string, string> = {
  chest:"Chest", shoulders:"Shoulders", "rear-delt":"Rear Deltoid", triceps:"Triceps",
  biceps:"Biceps", lats:"Lats", traps:"Trapezius", quads:"Quads", hamstrings:"Hamstrings",
  glutes:"Glutes", calves:"Calves", abs:"Abs", core:"Obliques", hips:"Hip Flexors",
  erectors:"Erector Spinae", serratus:"Serratus", rotator:"Rotator Cuff",
};

interface Props {
  sessionMuscleGroups: string[];
  collapsed?: boolean;
}

export default function MuscleDiagram({ sessionMuscleGroups, collapsed = true }: Props) {
  const [open, setOpen] = useState(!collapsed);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  // Derive primary/secondary
  const pri = new Set<string>();
  const sec = new Set<string>();
  sessionMuscleGroups.forEach((g) => {
    const h = SESSION_HIGHLIGHT[g];
    if (!h) return;
    h.pri.forEach((m) => pri.add(m));
    h.sec.forEach((m) => { if (!pri.has(m)) sec.add(m); });
  });

  // Highlight SVG paths after render
  useEffect(() => {
    if (!open || !svgRef.current) return;
    Object.entries(MMAP).forEach(([id, grp]) => {
      const el = svgRef.current?.querySelector(`#${id}`);
      if (!el) return;
      if (pri.has(grp)) {
        (el as SVGElement).style.fill = "#c49098";
        (el as SVGElement).style.opacity = "1";
      } else if (sec.has(grp)) {
        (el as SVGElement).style.fill = "#8a6870";
        (el as SVGElement).style.opacity = "0.8";
      } else {
        (el as SVGElement).style.fill = "#182230";
        (el as SVGElement).style.opacity = "0.4";
      }
    });
  }, [open, pri, sec]);

  const muscleInfo = selectedMuscle ? getMuscleInfo(selectedMuscle.replace("-", "_")) : null;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-3 text-left">
        <div>
          <span className="text-xs font-medium text-text">Muscles trained</span>
          <span className="text-[10px] text-muted ml-2">{pri.size} primary, {sec.size} secondary</span>
        </div>
        <span className={`text-[9px] text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div ref={svgRef} className="border-t border-border px-3 pb-3 pt-2">
          <div className="flex justify-center gap-2">
            {/* FRONT */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-muted uppercase tracking-wider mb-1">Front</span>
              <svg width="120" height="230" viewBox="0 0 100 240">
                <ellipse className="fill-[#0a1420]" cx="50" cy="11" rx="9" ry="11"/>
                <path className="fill-[#0a1420]" d="M46,21 C46,26 47,28 50,29 C53,28 54,26 54,21 Z"/>
                <path id="sd-f-trap" d="M46,29 C42,30 36,34 30,39 C32,41 36,41 40,40 L50,35 L60,40 C64,41 68,41 70,39 C64,34 58,30 54,29 Z"/>
                <path id="sd-f-shl" d="M27,37 C22,35 18,38 17,44 C16,49 18,54 22,56 C25,54 27,49 28,44 C29,40 28,37 27,37 Z"/>
                <path id="sd-f-shr" d="M73,37 C78,35 82,38 83,44 C84,49 82,54 78,56 C75,54 73,49 72,44 C71,40 72,37 73,37 Z"/>
                <path id="sd-f-pecl" d="M28,44 C25,49 24,57 26,64 C28,68 34,70 40,69 C45,68 49,64 49,58 L49,48 C43,44 35,42 30,43 Z"/>
                <path id="sd-f-pecr" d="M72,44 C75,49 76,57 74,64 C72,68 66,70 60,69 C55,68 51,64 51,58 L51,48 C57,44 65,42 70,43 Z"/>
                <path id="sd-f-bicl" d="M18,55 C15,61 14,71 15,79 C17,82 21,82 23,80 C22,72 21,62 20,56 Z"/>
                <path id="sd-f-bicr" d="M82,55 C85,61 86,71 85,79 C83,82 79,82 77,80 C78,72 79,62 80,56 Z"/>
                <path id="sd-f-tril" d="M16,56 C13,63 13,74 15,82 C16,85 19,85 20,83 C18,74 17,64 17,58 Z"/>
                <path id="sd-f-trir" d="M84,56 C87,63 87,74 85,82 C84,85 81,85 80,83 C82,74 83,64 83,58 Z"/>
                <path className="fill-[#0a1420]" d="M15,80 C12,90 12,101 14,109 C16,111 20,111 22,109 C21,99 19,88 18,81 Z"/>
                <path className="fill-[#0a1420]" d="M85,80 C88,90 88,101 86,109 C84,111 80,111 78,109 C79,99 81,88 82,81 Z"/>
                <rect id="sd-f-ab1l" x="42" y="72" width="7" height="7" rx="2.5"/>
                <rect id="sd-f-ab1r" x="51" y="72" width="7" height="7" rx="2.5"/>
                <rect id="sd-f-ab2l" x="42" y="81" width="7" height="7" rx="2.5"/>
                <rect id="sd-f-ab2r" x="51" y="81" width="7" height="7" rx="2.5"/>
                <rect id="sd-f-ab3l" x="42" y="90" width="7" height="7" rx="2.5"/>
                <rect id="sd-f-ab3r" x="51" y="90" width="7" height="7" rx="2.5"/>
                <path id="sd-f-obll" d="M28,67 C25,76 25,87 28,95 C32,97 37,94 39,89 C38,81 34,72 31,67 Z"/>
                <path id="sd-f-oblr" d="M72,67 C75,76 75,87 72,95 C68,97 63,94 61,89 C62,81 66,72 69,67 Z"/>
                <path id="sd-f-hipl" d="M37,98 C34,104 34,111 36,116 C39,117 43,115 44,112 C44,106 42,100 39,98 Z"/>
                <path id="sd-f-hipr" d="M63,98 C66,104 66,111 64,116 C61,117 57,115 56,112 C56,106 58,100 61,98 Z"/>
                <path className="fill-[#0a1420]" d="M36,116 C36,121 43,125 50,125 C57,125 64,121 64,116 C59,114 54,113 50,113 C46,113 41,114 36,116 Z"/>
                <path id="sd-f-rfl" d="M37,125 C33,133 32,147 34,158 C37,162 41,162 43,159 C43,148 42,134 40,125 Z"/>
                <path id="sd-f-vll" d="M31,129 C27,140 26,154 28,165 C31,168 36,168 38,164 C36,153 34,140 33,130 Z"/>
                <path id="sd-f-vml" d="M34,156 C31,163 31,170 35,174 C39,175 43,172 44,168 C44,162 41,157 37,155 Z"/>
                <path id="sd-f-rfr" d="M63,125 C67,133 68,147 66,158 C63,162 59,162 57,159 C57,148 58,134 60,125 Z"/>
                <path id="sd-f-vlr" d="M69,129 C73,140 74,154 72,165 C69,168 64,168 62,164 C64,153 66,140 67,130 Z"/>
                <path id="sd-f-vmr" d="M66,156 C69,163 69,170 65,174 C61,175 57,172 56,168 C56,162 59,157 63,155 Z"/>
                <ellipse className="fill-[#0a1420]" cx="35" cy="178" rx="8" ry="5.5"/>
                <ellipse className="fill-[#0a1420]" cx="65" cy="178" rx="8" ry="5.5"/>
                <path className="fill-[#0a1420]" d="M29,184 C27,195 27,207 30,215 C32,217 36,217 37,215 C35,206 33,193 31,185 Z"/>
                <path className="fill-[#0a1420]" d="M71,184 C73,195 73,207 70,215 C68,217 64,217 63,215 C65,206 67,193 69,185 Z"/>
              </svg>
            </div>
            {/* BACK */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-muted uppercase tracking-wider mb-1">Back</span>
              <svg width="120" height="230" viewBox="0 0 100 240">
                <ellipse className="fill-[#0a1420]" cx="50" cy="11" rx="9" ry="11"/>
                <path className="fill-[#0a1420]" d="M46,21 C46,26 47,28 50,29 C53,28 54,26 54,21 Z"/>
                <path id="sd-b-trapu" d="M46,29 C41,32 35,36 29,41 C31,45 36,47 41,45 L50,39 L59,45 C64,47 69,45 71,41 C65,36 59,32 54,29 Z"/>
                <path id="sd-b-trapm" d="M41,45 C36,52 34,60 36,68 L50,62 L64,68 C66,60 64,52 59,45 L50,39 Z"/>
                <path id="sd-b-dell" d="M27,37 C22,39 18,44 17,50 C20,54 25,55 28,52 C29,47 29,41 27,37 Z"/>
                <path id="sd-b-delr" d="M73,37 C78,39 82,44 83,50 C80,54 75,55 72,52 C71,47 71,41 73,37 Z"/>
                <path id="sd-b-infl" d="M28,52 C24,59 23,67 26,74 C31,74 37,69 38,63 C37,57 33,52 28,52 Z"/>
                <path id="sd-b-infr" d="M72,52 C76,59 77,67 74,74 C69,74 63,69 62,63 C63,57 67,52 72,52 Z"/>
                <path id="sd-b-latl" d="M22,47 C17,57 15,74 18,88 C22,94 30,95 34,90 C34,78 33,61 28,49 Z"/>
                <path id="sd-b-latr" d="M78,47 C83,57 85,74 82,88 C78,94 70,95 66,90 C66,78 67,61 72,49 Z"/>
                <path id="sd-b-tril" d="M16,52 C13,60 13,73 15,81 C17,84 21,85 23,83 C21,73 19,61 18,54 Z"/>
                <path id="sd-b-trir" d="M84,52 C87,60 87,73 85,81 C83,84 79,85 77,83 C79,73 81,61 82,54 Z"/>
                <path className="fill-[#0a1420]" d="M15,81 C12,92 12,103 14,111 C16,113 20,113 22,111 C21,100 19,89 18,82 Z"/>
                <path className="fill-[#0a1420]" d="M85,81 C88,92 88,103 86,111 C84,113 80,113 78,111 C79,100 81,89 82,82 Z"/>
                <path id="sd-b-erecl" d="M44,64 C42,76 42,93 44,106 C46,108 49,108 50,107 L50,64 C48,62 45,62 44,64 Z"/>
                <path id="sd-b-erecr" d="M56,64 C58,76 58,93 56,106 C54,108 51,108 50,107 L50,64 C52,62 55,62 56,64 Z"/>
                <path id="sd-b-gmedl" d="M34,101 C29,107 27,115 30,122 C35,124 42,122 44,117 C44,111 40,103 35,101 Z"/>
                <path id="sd-b-gmedr" d="M66,101 C71,107 73,115 70,122 C65,124 58,122 56,117 C56,111 60,103 65,101 Z"/>
                <path id="sd-b-glutl" d="M30,113 C24,122 22,135 24,146 C28,152 38,153 46,148 C50,142 50,132 48,122 C44,114 36,110 30,113 Z"/>
                <path id="sd-b-glutr" d="M70,113 C76,122 78,135 76,146 C72,152 62,153 54,148 C50,142 50,132 52,122 C56,114 64,110 70,113 Z"/>
                <path id="sd-b-hambl" d="M24,145 C21,156 21,170 24,181 C27,184 33,184 35,180 C35,168 33,154 30,145 Z"/>
                <path id="sd-b-hamml" d="M34,145 C33,158 35,172 38,181 C41,183 46,182 48,179 C47,167 44,153 40,145 Z"/>
                <path id="sd-b-hambr" d="M76,145 C79,156 79,170 76,181 C73,184 67,184 65,180 C65,168 67,154 70,145 Z"/>
                <path id="sd-b-hammr" d="M66,145 C67,158 65,172 62,181 C59,183 54,182 52,179 C53,167 56,153 60,145 Z"/>
                <path id="sd-b-calfl" d="M25,190 C22,201 22,215 25,224 C28,227 34,227 36,223 C35,211 33,197 30,191 Z"/>
                <path id="sd-b-caflm" d="M34,190 C34,203 36,218 39,225 C42,227 47,225 48,222 C47,210 44,196 40,190 Z"/>
                <path id="sd-b-calfr" d="M75,190 C78,201 78,215 75,224 C72,227 66,227 64,223 C65,211 67,197 70,191 Z"/>
                <path id="sd-b-cafrm" d="M66,190 C66,203 64,218 61,225 C58,227 53,225 52,222 C53,210 56,196 60,190 Z"/>
                <ellipse className="fill-[#0a1420]" cx="35" cy="185" rx="8" ry="5.5"/>
                <ellipse className="fill-[#0a1420]" cx="65" cy="185" rx="8" ry="5.5"/>
              </svg>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-2 mb-2">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ background: "#c49098" }} /><span className="text-[9px] text-muted2">Primary</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ background: "#8a6870" }} /><span className="text-[9px] text-muted2">Secondary</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full border border-border" style={{ background: "#182230" }} /><span className="text-[9px] text-muted2">Rest</span></div>
          </div>

          {/* Breakdown */}
          <div className="flex flex-col gap-0.5">
            {[...pri].map((m) => (
              <button key={m} onClick={() => setSelectedMuscle(m)} className="flex items-center justify-between text-[11px] py-1 hover:bg-surface2 rounded px-1 -mx-1 transition-colors">
                <span className="text-text">{MUSCLE_LABELS[m] || m}</span>
                <span className="text-[9px] tracking-wider uppercase text-accent">Primary</span>
              </button>
            ))}
            {[...sec].map((m) => (
              <button key={m} onClick={() => setSelectedMuscle(m)} className="flex items-center justify-between text-[11px] py-1 hover:bg-surface2 rounded px-1 -mx-1 transition-colors">
                <span className="text-muted2">{MUSCLE_LABELS[m] || m}</span>
                <span className="text-[9px] tracking-wider uppercase text-muted">Secondary</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomSheet open={!!selectedMuscle && !!muscleInfo} onClose={() => setSelectedMuscle(null)} title={muscleInfo?.muscleName || ""}>
        {muscleInfo && (
          <div>
            <p className="text-[10px] text-accent uppercase tracking-wider mb-2">{muscleInfo.region}</p>
            <p className="text-xs text-muted2 font-light leading-relaxed mb-3">{muscleInfo.text}</p>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Worth knowing</p>
            <p className="text-xs text-muted2 font-light leading-relaxed mb-3">{muscleInfo.trainingNote}</p>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Trained by</p>
            <div className="flex flex-wrap gap-1">
              {muscleInfo.trainedBy.map((ex) => (
                <span key={ex} className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] text-muted2">{ex}</span>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
