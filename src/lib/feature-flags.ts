// ── Feature Flags ──
// Toggle features on/off per release. Set a release level to unlock
// everything up to and including that release, or override individual flags.

export type Release = 1 | 2 | 3 | 4 | 5 | 6;

// Current release — change this single value to unlock a whole tier
const CURRENT_RELEASE: Release = 6;

// ── Flag definitions by release ──

const FLAG_RELEASE_MAP = {
  // R1 — Core Loop (MVP)
  auth: 1,
  onboardingCore: 1,           // goal, experience, equipment, schedule
  weekGeneration: 1,           // AI week generation (basic)
  sessionLogging: 1,           // weight/reps, rest timer
  weekView: 1,                 // session cards, begin session
  preSession: 1,               // exercise list, muscle diagram
  warmupBasic: 1,              // basic warmup/cooldown
  statePersistence: 1,         // Zustand + Supabase sync
  pwa: 1,                      // offline, service worker
  fallbackWeeks: 1,            // hardcoded graceful degradation

  // R2 — Women's Intelligence
  cycleTracking: 2,            // period logging, phase detection
  cycleAwareProgramming: 2,    // volume/intensity per phase
  healthConditions: 2,         // PCOS, fibroids, endo, pelvic floor
  conditionAdaptations: 2,     // breathing cues, impact flags
  injurySwaps: 2,              // deterministic low-impact alternatives
  onboardingHealth: 2,         // cycle, conditions, injuries steps

  // R3 — Education Layer
  exerciseEducation: 3,        // WHY / WHAT TO FEEL / SESSION LOGIC
  techniqueCues: 3,            // bracing, breathing, depth
  muscleGlossary: 3,           // tap tag → explainer
  sessionRationales: 3,        // programme reasoning cards
  educationThinning: 3,        // progressive autonomy decay
  reframingMessages: 3,        // DOMS, stall, return-after-gap

  // R4 — Progress & Feedback
  postSessionFeedback: 4,      // effort/soreness
  sessionAnalysis: 4,          // AI analysis + recommendations
  progressDashboard: 4,        // stats grid, lift history, 1RM
  calendarView: 4,
  prDetection: 4,              // PR detection + share cards
  photoGallery: 4,
  sessionReplay: 4,
  journeySummary: 4,

  // R5 — Flexibility & Control
  exerciseSwap: 5,             // AI-powered swap with reasoning
  customBuilder: 5,            // custom session + AI assessment
  timeBudget: 5,               // per-day duration control
  sessionRearrange: 5,         // move sessions between days
  profileRebuild: 5,           // profile update → auto week rebuild
  nextWeekPreview: 5,          // progression preview + confirm

  // R6 — Retention & Polish
  weekCheckin: 6,              // cycle-aware insights, correlations
  exitSurvey: 6,               // churn intercept + pause offer
  investmentVisibility: 6,     // accumulated stats in profile
  skillPaths: 6,               // complexity unlock gates
  periodisationUI: 6,          // block messaging, deload rationales
  exerciseVideos: 6,           // video playback integration
  devPanel: 6,                 // hidden system prompt override
} as const;

export type FeatureFlag = keyof typeof FLAG_RELEASE_MAP;

// ── Per-flag overrides ──
// Force a flag on/off regardless of release level.
// Useful for testing or early access to specific features.
const OVERRIDES: Partial<Record<FeatureFlag, boolean>> = {
  // Example: exerciseVideos: true,  ← force on before R6
  // Example: photoGallery: false,   ← force off even after R4
};

// ── Public API ──

export function isEnabled(flag: FeatureFlag): boolean {
  if (flag in OVERRIDES) return OVERRIDES[flag]!;
  return FLAG_RELEASE_MAP[flag] <= CURRENT_RELEASE;
}

export function getRelease(flag: FeatureFlag): Release {
  return FLAG_RELEASE_MAP[flag] as Release;
}

export function getCurrentRelease(): Release {
  return CURRENT_RELEASE;
}

// Convenience: get all flags and their current state
export function getAllFlags(): Record<FeatureFlag, boolean> {
  const flags = {} as Record<FeatureFlag, boolean>;
  for (const key of Object.keys(FLAG_RELEASE_MAP) as FeatureFlag[]) {
    flags[key] = isEnabled(key);
  }
  return flags;
}

// Get all flags for a specific release tier
export function getFlagsForRelease(release: Release): FeatureFlag[] {
  return (Object.keys(FLAG_RELEASE_MAP) as FeatureFlag[]).filter(
    (key) => FLAG_RELEASE_MAP[key] === release
  );
}
