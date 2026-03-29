"use client";

import { useKineStore } from "@/store/useKineStore";
import type { AnalysisResult } from "@/lib/session-analysis";
import Button from "@/components/Button";
import { sharePR } from "@/lib/share-card";

export default function AnalysisScreen({ analysis, prs = [], onDone }: { analysis: AnalysisResult | null; prs?: { name: string; weight: number; reps: number }[]; onDone: () => void }) {
  const { progressDB } = useKineStore();
  const verdictColors: Record<string, string> = {
    strong: "text-green-400",
    solid: "text-muted2",
    building: "text-yellow-400",
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
      weekNum: progressDB.currentWeek || 1,
      totalSessions: progressDB.sessions.length,
    });
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide text-accent">Session review</h2>

      {/* PR cards with share */}
      {prs.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {prs.map((pr, i) => (
            <div key={i} className="rounded-[14px] border border-accent/30 bg-accent-dim p-4 flex items-center justify-between">
              <div>
                <p className="font-display text-[11px] tracking-[3px] text-accent uppercase mb-0.5">New PR</p>
                <p className="text-sm font-medium text-text">{pr.name}</p>
                <p className="text-xs text-muted2">{pr.weight}kg x {pr.reps} reps</p>
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

      {analysis ? (
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
