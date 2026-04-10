"use client";

// ── Education feed page ──────────────────────────────────────────────────
//
// Full feed at /app/education. Reachable from the "For you" strip on Home
// via "Browse all →". Not currently in the bottom nav — earns its tab if
// engagement justifies it (spec §8).
//
// Spec: docs/specs/education-personalization.md

import { useMemo } from "react";
import Link from "next/link";
import { useKineStore } from "@/store/useKineStore";
import {
  deriveEngineHistory,
  type EngineProfile,
  type LifeStage,
} from "@/lib/progress-engine";
import {
  computeEducationFeed,
  defaultEducationPreferences,
} from "@/lib/education-engine";
import { educationLibrary } from "@/data/education-library";
import { hapticLight } from "@/lib/haptics";

function buildEngineProfile(state: ReturnType<typeof useKineStore.getState>): EngineProfile {
  const lifeStage: LifeStage =
    (state.personalProfile?.lifeStage as LifeStage | undefined) ?? "general";
  return {
    rawGoal: state.goal,
    experience: state.exp,
    lifeStage,
    age: state.personalProfile?.age ?? null,
    conditions: state.conditions ?? [],
    injuries: state.injuries ?? [],
    cycleTrackingEnabled: state.cycleType !== null && state.cycleType !== "na",
    cycleType: state.cycleType,
    equipment: state.equip ?? [],
    trackingModes: state.trackingModes,
  };
}

function readMinutes(length: "short" | "medium" | "long"): string {
  return length === "short" ? "3 min" : length === "medium" ? "5 min" : "8 min";
}

export default function EducationFeedPage() {
  const store = useKineStore();
  const profile = useMemo(() => buildEngineProfile(store), [store]);
  const history = useMemo(
    () => deriveEngineHistory(store.progressDB, { injuries: profile.injuries }),
    [store.progressDB, profile.injuries]
  );
  const preferences = useMemo(() => defaultEducationPreferences(), []);
  const { headerLabel, feed, isEmpty } = useMemo(
    () => computeEducationFeed(profile, history, educationLibrary, preferences),
    [profile, history, preferences]
  );

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-accent">Education</h1>
      <p className="mt-0.5 text-[11px] text-muted2 font-light">{headerLabel}</p>

      {isEmpty ? (
        <p className="mt-10 text-center text-sm text-muted">
          Nothing new for you right now. Come back as the library grows.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {feed.map((article) => (
            <li key={article.id}>
              <Link
                href={`/app/education/${article.id}`}
                onClick={() => hapticLight()}
                className="block rounded-2xl border border-border/60 bg-surface/60 p-5 transition-colors hover:border-accent/40"
              >
                <p className="text-[10px] uppercase tracking-[1.6px] text-accent">
                  {article.topic.replace("_", " ")}
                </p>
                <h2 className="mt-2 font-display text-xl italic leading-snug text-text">
                  {article.title}
                </h2>
                <p className="mt-2 text-[12px] font-light leading-relaxed text-muted2">
                  {article.description}
                </p>
                <p className="mt-3 text-[10px] uppercase tracking-[1.2px] text-muted">
                  {readMinutes(article.length)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
