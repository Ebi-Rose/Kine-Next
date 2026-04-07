"use client";

// ── For-you Education strip ─────────────────────────────────────────────
//
// Option A surface from docs/design-mockups/education-tab.html: a small
// section on Home that shows up to 3 personalized articles + a link to
// the full feed at /app/education.
//
// Personalization is silent (principle #6). The header line is the only
// explicit tell — same pattern as the Progress page label.
//
// Spec: docs/specs/education-personalization.md

import { useMemo } from "react";
import Link from "next/link";
import { useKineStore } from "@/store/useKineStore";
import { deriveEngineHistory, type EngineProfile, type LifeStage } from "@/lib/progress-engine";
import {
  computeEducationFeed,
  defaultEducationPreferences,
} from "@/lib/education-engine";
import { educationLibrary } from "@/data/education-library";
import { hapticLight } from "@/lib/haptics";

const STRIP_LIMIT = 3;

/** Mirror of ProgressPage.buildEngineProfile so both surfaces stay aligned. */
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
  };
}

export default function ForYouEducationStrip() {
  const store = useKineStore();
  const { progressDB } = store;

  const profile = useMemo(() => buildEngineProfile(store), [store]);
  const history = useMemo(
    () => deriveEngineHistory(progressDB, { injuries: profile.injuries }),
    [progressDB, profile.injuries]
  );

  // v1 doesn't persist preferences yet — use defaults. When the override
  // panel ships, swap this for store.educationPreferences.
  const preferences = useMemo(() => defaultEducationPreferences(), []);

  const { headerLabel, feed } = useMemo(
    () =>
      computeEducationFeed(profile, history, educationLibrary, preferences, {
        limit: STRIP_LIMIT,
      }),
    [profile, history, preferences]
  );

  if (feed.length === 0) return null;

  return (
    <section aria-labelledby="education-strip-heading" className="mt-6">
      <div className="flex items-baseline justify-between mb-3">
        <h2
          id="education-strip-heading"
          className="font-display text-xl tracking-wide text-text"
        >
          For you
        </h2>
        <span className="text-[10px] tracking-[1.5px] uppercase text-muted font-light">
          {headerLabel.replace(/^For you · /, "")}
        </span>
      </div>

      <ul className="space-y-2">
        {feed.map((article) => (
          <li key={article.id}>
            <Link
              href={`/app/education/${article.id}`}
              onClick={() => hapticLight()}
              className="block rounded-2xl border border-border/60 bg-surface/60 p-4 transition-colors hover:border-accent/40"
            >
              <p className="font-display text-[15px] italic leading-tight text-text">
                {article.title}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[1.2px] text-muted">
                {article.topic.replace("_", " ")} ·{" "}
                {article.length === "short"
                  ? "3 min"
                  : article.length === "medium"
                    ? "5 min"
                    : "8 min"}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/app/education"
        onClick={() => hapticLight()}
        className="mt-3 block text-right text-[11px] text-accent hover:underline"
      >
        Browse all →
      </Link>
    </section>
  );
}
