// ── Schedule Evaluation — Smart feedback on training day selection ──

export interface ScheduleFeedback {
  type: "warning" | "positive" | "info";
  message: string;
}

/**
 * Evaluate a training schedule and return contextual feedback.
 */
export function evaluateSchedule(
  trainingDays: number[],
  exp: string | null
): ScheduleFeedback | null {
  const count = trainingDays.length;
  if (count === 0) return null;

  const sorted = [...trainingDays].sort();

  // Single day
  if (count === 1) {
    return { type: "info", message: "One day is a start — but growth needs more. Two or three sessions per week is where real change happens." };
  }

  // Check for consecutive days
  const maxConsecutive = getMaxConsecutive(sorted);

  if (maxConsecutive >= 4) {
    return { type: "warning", message: "4+ consecutive training days is demanding. Make sure you're recovering between sessions — fatigue accumulates faster than you think." };
  }

  if (maxConsecutive >= 3 && (exp === "new")) {
    return { type: "warning", message: "3 consecutive days is tough when you're starting out. Consider spacing your sessions with a rest day between each." };
  }

  // Check for large gaps
  const maxGap = getMaxGap(sorted);
  if (maxGap >= 4) {
    return { type: "warning", message: "Gaps longer than 3 days slow adaptation. Try to spread your sessions more evenly across the week." };
  }

  // Weekend-only
  if (count === 2 && sorted.includes(5) && sorted.includes(6)) {
    return { type: "warning", message: "Back-to-back weekend sessions limit recovery. If possible, add a midweek session." };
  }

  // Positive patterns
  if (count === 3 && maxGap <= 2 && maxConsecutive <= 2) {
    return { type: "positive", message: "Solid 3-day split. Good spacing for recovery between sessions." };
  }

  if (count === 4 && maxGap <= 2) {
    return { type: "positive", message: "Great 4-day structure. Enough volume to progress, enough rest to recover." };
  }

  if (count >= 5 && (exp === "new" || exp === "developing")) {
    return { type: "info", message: "More ≠ better, especially early on. Quality and recovery matter more than frequency." };
  }

  return null;
}

/**
 * Evaluate duration in context of other selections.
 */
export function evaluateDurationContext(
  duration: string | null,
  trainingDays: number[],
  exp: string | null,
  goal: string | null,
  equip: string[]
): ScheduleFeedback | null {
  if (!duration) return null;
  const count = trainingDays.length;

  if (duration === "short" && count === 1) {
    return { type: "warning", message: "Under 45 min won't cover a full body session with enough volume. Consider a longer session or more days." };
  }

  if (duration === "short" && equip.includes("barbell")) {
    return { type: "info", message: "Barbell sessions rarely fit under 45 min once you include warm-up sets. Plan for 45–60 min." };
  }

  if (duration === "extended" && (exp === "new")) {
    return { type: "info", message: "90+ min is a long time when you're starting out. Shorter, focused sessions build the habit faster." };
  }

  if (duration === "extended" && goal === "general") {
    return { type: "info", message: "Consistency matters more than session length. 45–60 min, done regularly, beats 90 min done occasionally." };
  }

  if (duration === "short" && goal === "strength") {
    return { type: "info", message: "Compounds only at this length. Warm-up sets and rest between heavy lifts take time." };
  }

  return null;
}

function getMaxConsecutive(sorted: number[]): number {
  if (sorted.length <= 1) return sorted.length;
  let max = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 1;
    }
  }
  // Check wrap-around (Sun→Mon)
  if (sorted.includes(6) && sorted.includes(0)) {
    let wrap = 2;
    for (let i = 1; i < sorted.length && sorted[i] === sorted[i - 1] + 1; i++) wrap++;
    max = Math.max(max, wrap);
  }
  return max;
}

function getMaxGap(sorted: number[]): number {
  if (sorted.length <= 1) return 7;
  let maxGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    maxGap = Math.max(maxGap, sorted[i] - sorted[i - 1] - 1);
  }
  // Wrap-around gap
  const wrapGap = 7 - sorted[sorted.length - 1] + sorted[0] - 1;
  maxGap = Math.max(maxGap, wrapGap);
  return maxGap;
}
