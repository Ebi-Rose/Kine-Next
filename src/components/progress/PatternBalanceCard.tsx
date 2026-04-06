// ── Pattern balance card ──
//
// Push / Pull / Legs bars. Variants:
//   delta    — show ↑/↓ % vs. baseline (build_strength, perform)
//   coverage — show absolute volume bars only (build_muscle, maintain)

import { Card, Eyebrow } from "./shared";
import type { PatternBalance } from "@/lib/progress-engine";

export type PatternBalanceVariant = "delta" | "coverage";

export default function PatternBalanceCard({
  variant,
  balance,
}: {
  variant: PatternBalanceVariant;
  balance: PatternBalance | null;
}) {
  if (!balance) return null;
  const total = balance.push.volume + balance.pull.volume + balance.legs.volume;
  if (total === 0) return null;
  const max = Math.max(balance.push.volume, balance.pull.volume, balance.legs.volume) || 1;

  const rows: { lbl: string; volume: number; deltaPct: number }[] = [
    { lbl: "Push", volume: balance.push.volume, deltaPct: balance.push.deltaPct },
    { lbl: "Pull", volume: balance.pull.volume, deltaPct: balance.pull.deltaPct },
    { lbl: "Legs", volume: balance.legs.volume, deltaPct: balance.legs.deltaPct },
  ];

  return (
    <>
      <Eyebrow>Pattern balance</Eyebrow>
      <Card>
        {rows.map((row, i) => {
          const pct = (row.volume / max) * 100;
          const display =
            variant === "delta"
              ? row.deltaPct === 0
                ? "even"
                : row.deltaPct > 0
                  ? `↑${row.deltaPct}%`
                  : `↓${Math.abs(row.deltaPct)}%`
              : `${row.volume}`;
          return (
            <div key={row.lbl} className={`flex items-center gap-2.5 ${i === rows.length - 1 ? "" : "mb-1.5"}`}>
              <div className="w-9 text-[9px] tracking-[1.2px] uppercase text-muted">{row.lbl}</div>
              <div className="flex-1 h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-12 text-right font-display italic text-xs text-text">{display}</div>
            </div>
          );
        })}
      </Card>
    </>
  );
}
