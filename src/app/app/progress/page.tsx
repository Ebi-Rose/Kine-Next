"use client";

// ── Progress page — A+B Combined layout, driven by personalization engine ──
//
// Architecture:
//   1. The store is projected into an EngineProfile + EngineHistory.
//   2. computeProgressLayout() returns the card list, hero, tabs, and window.
//   3. This page maps cards by id to the components in @/components/progress.
//
// All personalization logic lives in @/lib/progress-engine. This file is
// purely a renderer — no business rules here.
//
// Spec: docs/specs/progress-personalization-engine.md
// Visual: docs/design-mockups/progress-page-ab-combined.html

import { useMemo, useState } from "react";
import { useKineStore, type SessionRecord } from "@/store/useKineStore";
import {
  computeProgressLayout,
  deriveEngineHistory,
  type EngineProfile,
  type LayoutCard,
  type LifeStage,
  type ProgressLayout,
} from "@/lib/progress-engine";
import { calculateORM } from "@/lib/progression";
import { formatRelativeDate } from "@/lib/date-utils";
import { kgToDisplay, weightUnit } from "@/lib/format";
import BottomSheet from "@/components/BottomSheet";
import {
  ProgressHero,
  ProgressTabs,
  StatGrid,
  TopLiftsCard,
  ProgressOverridePanel,
  RecentPRsStrip,
  PatternBalanceCard,
  RehabWorkCard,
  EffortObservationCard,
  EffortControlCard,
  MobilityLogCard,
  ExercisesLearnedCard,
  SymptomContextCard,
  PhasePositionCard,
  EmptyStateCard,
  BodyPhotosHero,
  PhotoCompareCard,
  BodyWeightDemoteCard,
  MeasurementsOptInTile,
  type StatTileId,
  type TopLiftsVariant,
  type RecentPRsVariant,
  type PatternBalanceVariant,
} from "@/components/progress";

type TabId = "strength" | "body" | "history";

/** Project the Zustand store into the engine's narrow profile shape. */
function buildEngineProfile(state: ReturnType<typeof useKineStore.getState>): EngineProfile {
  const lifeStage: LifeStage = (state.personalProfile?.lifeStage as LifeStage | undefined) ?? "general";
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

export default function ProgressPage() {
  const store = useKineStore();
  const { progressDB, measurementSystem, progressPreferences } = store;
  const system = measurementSystem || "metric";

  const [activeTab, setActiveTab] = useState<TabId>("strength");
  const [showORM, setShowORM] = useState(false);
  const [ormWeight, setOrmWeight] = useState("");
  const [ormReps, setOrmReps] = useState("");
  const [replaySession, setReplaySession] = useState<SessionRecord | null>(null);
  const [showOverridePanel, setShowOverridePanel] = useState(false);

  const profile = useMemo(() => buildEngineProfile(store), [store]);
  const history = useMemo(
    () => deriveEngineHistory(progressDB, { injuries: profile.injuries }),
    [progressDB, profile.injuries]
  );
  const layout = useMemo(
    () => computeProgressLayout(profile, history, progressPreferences),
    [profile, history, progressPreferences]
  );

  // Sparkline points for the strength delta hero — normalized to 0..1.
  const sparklinePoints = useMemo(() => {
    const lifts = Object.values(progressDB.lifts ?? {});
    if (lifts.length === 0) return [];
    // Take the densest lift (most entries) and normalize last 10 weights.
    const dense = lifts.reduce((a, b) => (b.length > a.length ? b : a), lifts[0]);
    const slice = dense.slice(-10);
    const weights = slice.map((e) => e.weight).filter((w) => w > 0);
    if (weights.length < 2) return [];
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;
    return weights.map((w) => (w - min) / range);
  }, [progressDB.lifts]);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-accent">Progress</h1>
      <button
        onClick={() => setShowOverridePanel(true)}
        className="text-[11px] text-muted2 font-light mt-0.5 hover:text-accent transition-colors text-left"
        aria-label="Customize what you see"
      >
        {layout.headerLabel} <span className="text-muted">·</span> <span className="text-muted">customize ▸</span>
      </button>

      <div className="mt-4">
        <HeroRenderer layout={layout} sparklinePoints={sparklinePoints} historyData={history} />

        <ProgressTabs tabs={layout.tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === "strength" && (
          <StrengthTabBody
            layout={layout}
            history={history}
            system={system}
            onOpenORM={() => setShowORM(true)}
          />
        )}

        {activeTab === "body" && <BodyTabBody layout={layout} />}

        {activeTab === "history" && (
          <HistoryTabBody
            sessions={(progressDB.sessions ?? []) as SessionRecord[]}
            onReplay={setReplaySession}
            system={system}
          />
        )}
      </div>

      {/* ORM Calculator */}
      <BottomSheet open={showORM} onClose={() => setShowORM(false)} title="1RM Calculator">
        <p className="text-xs text-muted2 mb-4">
          Enter a weight and reps to estimate your one-rep max (Brzycki formula).
        </p>
        <div className="flex gap-3 mb-4">
          <input
            type="number"
            placeholder={`Weight (${weightUnit(system)})`}
            aria-label={`Weight in ${weightUnit(system)}`}
            value={ormWeight}
            onChange={(e) => setOrmWeight(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
          <input
            type="number"
            placeholder="Reps"
            aria-label="Number of reps"
            value={ormReps}
            onChange={(e) => setOrmReps(e.target.value)}
            className="w-20 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </div>
        {ormWeight && ormReps && (
          <div className="rounded-lg border border-accent bg-accent-dim p-4 text-center">
            <p className="text-xs text-muted2">Estimated 1RM</p>
            <p className="font-display text-3xl text-accent">
              {calculateORM(parseFloat(ormWeight), parseInt(ormReps))}
              {weightUnit(system)}
            </p>
          </div>
        )}
      </BottomSheet>

      {/* Session Replay */}
      <BottomSheet
        open={!!replaySession}
        onClose={() => setReplaySession(null)}
        title={replaySession?.title || "Session"}
      >
        {replaySession && <SessionReplay session={replaySession} system={system} />}
      </BottomSheet>

      {/* Override panel — principle #20 */}
      <ProgressOverridePanel
        open={showOverridePanel}
        onClose={() => setShowOverridePanel(false)}
        layout={layout}
      />
    </div>
  );
}

// ── Hero renderer ────────────────────────────────────────────────────────

function HeroRenderer({
  layout,
  sparklinePoints,
  historyData,
}: {
  layout: ProgressLayout;
  sparklinePoints: number[];
  historyData: ReturnType<typeof deriveEngineHistory>;
}) {
  return (
    <ProgressHero
      variant={layout.hero.variant as never}
      combinedDeltaPct={historyData.combinedStrengthDeltaPct}
      sparklinePoints={sparklinePoints}
      totalSessions={historyData.sessionCountTotal}
      weeks={historyData.weeksSinceReturn ?? historyData.weeksTraining}
      phaseShort={historyData.currentPhaseShort}
    />
  );
}

// ── Strength tab ─────────────────────────────────────────────────────────

function StrengthTabBody({
  layout,
  history,
  system,
  onOpenORM,
}: {
  layout: ProgressLayout;
  history: ReturnType<typeof deriveEngineHistory>;
  system: ReturnType<typeof useKineStore.getState>["measurementSystem"];
  onOpenORM: () => void;
}) {
  const tileIds = layout.gridTiles.map((t) => t.id) as StatTileId[];
  return (
    <div>
      <StatGrid tiles={tileIds} history={history} />

      <div className="mt-4">
        {layout.strengthCards.map((card) => (
          <StrengthCardRenderer key={card.id + card.reason} card={card} history={history} system={system!} />
        ))}
      </div>

      {layout.isEmptyState && <EmptyStateCard />}

      <div className="mt-4">
        <button
          onClick={onOpenORM}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left flex items-center justify-between hover:border-border-active transition-colors"
        >
          <span className="text-xs text-text">1RM calculator</span>
          <span className="text-muted">→</span>
        </button>
      </div>
    </div>
  );
}

function StrengthCardRenderer({
  card,
  history,
  system,
}: {
  card: LayoutCard;
  history: ReturnType<typeof deriveEngineHistory>;
  system: NonNullable<ReturnType<typeof useKineStore.getState>["measurementSystem"]>;
}) {
  switch (card.id) {
    case "top_lifts":
      return (
        <TopLiftsCard
          variant={card.variant as TopLiftsVariant}
          lifts={history.topLifts}
          hiddenLifts={history.injuryHiddenLifts}
          system={system}
        />
      );
    case "pr_feed":
      return (
        <RecentPRsStrip
          variant={card.variant as RecentPRsVariant}
          prs={history.recentPRs}
          system={system}
        />
      );
    case "pattern_balance":
      return (
        <PatternBalanceCard
          variant={card.variant as PatternBalanceVariant}
          balance={history.patternBalance}
        />
      );
    case "rehab_work":
      return <RehabWorkCard history={history} />;
    case "effort_observation":
      return <EffortObservationCard history={history} />;
    case "effort_control":
      return <EffortControlCard history={history} />;
    case "mobility_log":
      return <MobilityLogCard history={history} />;
    case "exercises_learned":
      return <ExercisesLearnedCard history={history} variant={card.variant} />;
    case "symptom_context":
      return <SymptomContextCard history={history} />;
    case "phase_position":
      return <PhasePositionCard history={history} />;
    default:
      return null;
  }
}

// ── Body tab ─────────────────────────────────────────────────────────────

function BodyTabBody({ layout }: { layout: ProgressLayout }) {
  return (
    <div>
      <BodyPhotosHero />
      {layout.bodyCards.map((card) => {
        if (card.id === "photos") {
          // The hero already explains photos; this is the compare/empty card.
          return <PhotoCompareCard key={card.reason} />;
        }
        if (card.id === "bodyweight") {
          return <BodyWeightDemoteCard key={card.reason} variant={card.variant} />;
        }
        if (card.id === "measurements_optin") {
          return <MeasurementsOptInTile key={card.reason} />;
        }
        return null;
      })}
    </div>
  );
}

// ── History tab ──────────────────────────────────────────────────────────

function HistoryTabBody({
  sessions,
  onReplay,
  system,
}: {
  sessions: SessionRecord[];
  onReplay: (s: SessionRecord) => void;
  system: NonNullable<ReturnType<typeof useKineStore.getState>["measurementSystem"]>;
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-[var(--radius-default)] border border-border bg-surface p-6 text-center mt-2">
        <p className="text-sm text-muted2">Complete your first session to see history here.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 mt-2">
      {sessions
        .slice(-10)
        .reverse()
        .map((session, i) => (
          <button
            key={i}
            onClick={() => onReplay(session)}
            className="rounded-[var(--radius-default)] border border-border bg-surface p-4 text-left hover:border-border-active transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">{session.title || "Session"}</p>
                <p className="text-xs text-muted2">
                  Week {session.weekNum} · {session.date ? formatRelativeDate(session.date) : ""}
                </p>
              </div>
              <div className="flex gap-3 text-xs text-muted2">
                {session.effort && <span>Effort {session.effort}/4</span>}
                {session.prs && session.prs.length > 0 && (
                  <span className="text-accent">
                    {session.prs.length} PR{session.prs.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
    </div>
  );
}

// ── Session replay (extracted from old page) ─────────────────────────────

function SessionReplay({
  session,
  system,
}: {
  session: SessionRecord;
  system: NonNullable<ReturnType<typeof useKineStore.getState>["measurementSystem"]>;
}) {
  const unit = weightUnit(system);
  return (
    <div>
      <p className="text-xs text-muted2 mb-4">
        {session.date} · Week {session.weekNum} · Effort: {session.effort}/4
      </p>
      {session.logs &&
        Object.values(session.logs).map((ex: unknown, i) => {
          const e = ex as {
            name: string;
            actual: { reps: string; weight: string }[];
            note?: string;
          };
          if (!e.name) return null;
          return (
            <div key={i} className="mb-3 rounded-lg border border-border bg-bg p-3">
              <p className="text-sm font-medium text-text">{e.name}</p>
              {e.actual
                ?.filter((s) => s.reps || s.weight)
                .map((s, j) => (
                  <p key={j} className="text-xs text-muted2">
                    Set {j + 1}: {s.reps} × {s.weight ? `${kgToDisplay(parseFloat(s.weight), system)}${unit}` : "BW"}
                  </p>
                ))}
              {e.note && <p className="mt-1 text-xs text-muted italic">{e.note}</p>}
            </div>
          );
        })}
    </div>
  );
}
