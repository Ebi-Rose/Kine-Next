export interface SetLog {
  reps: string;
  weight: string;
  timestamp?: string;
}

export interface ExerciseLog {
  name: string;
  planned: { sets: string; reps: string };
  actual: SetLog[];
  note: string;
  saved: boolean;
  /** True if weight was auto-filled from last session history */
  prefilled?: boolean;
}

export type SessionStep = "workout" | "feedback" | "analysing" | "results";
