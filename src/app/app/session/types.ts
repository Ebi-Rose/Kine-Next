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
}

export type SessionStep = "workout" | "feedback" | "analysing" | "results";
