"use client";

import { useKineStore } from "@/store/useKineStore";
import type { AnalysisResult } from "@/lib/session-analysis";
import { weightUnit } from "@/lib/format";
import Button from "@/components/Button";
import { sharePR } from "@/lib/share-card";
import { getEffectiveWeek } from "@/lib/date-utils";

export default function AnalysisScreen({ analysis, prs = [], onDone }: { analysis: AnalysisResult | null; prs?: { name: string; weight: number; reps: number }[]; onDone: () => void }) {
  const { progressDB, measurementSystem } = useKineStore();
  const unit = weightUnit(measurementSystem || "metric");
  const verdictColors: Record<string, string> = {
    strong: "text-success",
    solid: "text-muted2",
    building: "text-warning",
    adjust: "text-accent",
  };

  function handleSharePR(pr: { name: string; weight: number; reps: number }) {
    const history = progressDB.lifts[pr.name] || [];
    const prevBest = history.length > 1
      ? history.slice(0, -1).reduce((best: number, entry: { weight: number }) => Math.max(best, entry.weight), 0)
      : undefined;

    sharePR({
      name: pr.name,
      weight: pr.weight,
      reps: pr.reps,
      prev: prevBest,
      weekNum: getEffectiveWeek(progressDB.sessions as { weekNum?: number }[], progressDB.currentWeek || 1),
      totalSessions: progressDB.sessions.length,
    });
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-accent">Session review</h2>

      {/* Safety alert — deterministic red-flag surfacing. Rendered
          above PRs and analysis so it's the first thing the user
          sees. Never LLM-authored; see src/lib/red-flag-scan.ts. */}
      {analysis?.safetyAlert && (
        <div
          role="alert"
          className="mt-4 rounded-[var(--radius-default)] border border-warning/40 bg-warning/10 p-4"
        >
          <p className="font-display text-[11px] tracking-[3px] text-warning uppercase mb-2">
            Worth a check-in
          </p>
          <p className="text-sm leading-relaxed text-text">
            {analysis.safetyAlert.cta}
          </p>
          <ul className="mt-3 flex flex-col gap-1">
            {analysis.safetyAlert.triggered.map((phrase, i) => (
              <li key={i} className="text-xs text-muted2">
                • {phrase}
              </li>
            ))}
          </ul>
          {analysis.safetyAlert.sources.length > 0 && (
            <p className="mt-2 text-[11px] text-muted">
              From your notes on: {analysis.safetyAlert.sources.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* PR cards with share */}
      {prs.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {prs.map((pr, i) => (
            <div key={i} className="rounded-[14px] border border-accent/30 bg-accent-dim p-4 flex items-center justify-between">
              <div>
                <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-0.5">New PR</p>
                <p className="text-sm font-medium text-text">{pr.name}</p>
                <p className="text-xs text-muted2">{pr.weight}{unit} x {pr.reps} reps</p>
              </div>
              <button
                onClick={() => handleSharePR(pr)}
                className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-[10px] text-accent hover:bg-accent/20 transition-colors"
              >
                Share
              </button>
            </div>
          ))}
        </div>
      )}

      {analysis && analysis.overallAssessment ? (
        <>
          <div className="mt-4 rounded-[var(--radius-default)] border border-border bg-surface p-4">
            <p className="text-sm leading-relaxed text-text">{analysis.overallAssessment}</p>
          </div>

          {analysis.exerciseFeedback?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs tracking-wider text-muted uppercase">Exercise breakdown</p>
              <div className="flex flex-col gap-2">
                {analysis.exerciseFeedback.map((ef, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-[var(--radius-default)] border border-border bg-surface p-3">
                    <span className={`mt-0.5 text-xs font-medium uppercase ${verdictColors[ef.verdict] || "text-muted2"}`}>
                      {ef.verdict}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{ef.name}</p>
                      <p className="text-xs text-muted2">{ef.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.changes?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs tracking-wider text-muted uppercase">Changes for next time</p>
              <div className="flex flex-col gap-2">
                {analysis.changes.map((c, i) => (
                  <div key={i} className="rounded-[var(--radius-default)] border border-border bg-surface p-3">
                    <p className="text-sm font-medium text-text">{c.icon} {c.title}</p>
                    <p className="text-xs text-muted2">{c.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-[var(--radius-default)] border border-border bg-surface p-4">
          <p className="text-sm text-muted2">
            AI analysis unavailable. Your session has been saved — great work.
          </p>
        </div>
      )}

      <div className="mt-8">
        <Button className="w-full" size="lg" onClick={onDone}>
          Back to week →
        </Button>
      </div>
    </div>
  );
}
