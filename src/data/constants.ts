import type { Goal, Experience, CycleType, Duration } from "@/store/useKineStore";

export const GOAL_OPTIONS: { value: Goal & string; label: string; description: string }[] = [
  {
    value: "muscle",
    label: "A body I feel good in",
    description:
      "Strength, shape, how you look and carry yourself. The training and the result, together.",
  },
  {
    value: "strength",
    label: "Serious strength",
    description:
      "Performance is the measure. Feeling physically capable, and seeing the bar get heavier.",
  },
  {
    value: "general",
    label: "A habit that actually lasts",
    description:
      "Consistency over intensity. Training that fits your life and stays there.",
  },
];

export const EXP_OPTIONS: { value: Experience & string; label: string }[] = [
  { value: "new", label: "Still learning the basics" },
  { value: "developing", label: "Comfortable with the main lifts" },
  { value: "intermediate", label: "Confident programming my own training" },
];

export const EXP_DESCRIPTIONS: Record<string, Record<string, string>> = {
  muscle: {
    new: "Building foundational movement and gym confidence. Every exercise is chosen so you can actually feel what's working — that's where body change starts.",
    developing:
      "You know the movements. Now it's about structuring sessions that create real change — progressive overload, volume management, and smarter exercise selection.",
    intermediate:
      "You've been doing this a while. Kinē brings periodisation, autoregulation, and the nuance that separates training from just working out.",
  },
  strength: {
    new: "Building foundational movement and gym confidence. Movement quality and technique come before heavy loads — the bar gets heavier once the foundations are solid.",
    developing:
      "You know the movements. Now it's about structured progression — building toward heavier loads with intelligent programming.",
    intermediate:
      "You've been doing this a while. Kinē brings periodisation, peaking cycles, and the programming precision that drives continued strength gains.",
  },
  general: {
    new: "Building foundational movement and gym confidence. We'll build the habit first — sessions that feel achievable and leave you wanting to come back.",
    developing:
      "You know the movements. Now it's about keeping things fresh, balanced, and sustainable — training that evolves with you.",
    intermediate:
      "You've been doing this a while. Kinē brings structure and variety to keep you progressing without overcomplicating things.",
  },
};

export const ALL_EQUIPMENT = [
  "barbell",
  "dumbbells",
  "kettlebell",
  "machines",
  "bands",
  "bodyweight",
] as const;

export const EQUIP_LABELS: Record<string, string> = {
  barbell: "Barbell + rack",
  dumbbells: "Dumbbells",
  kettlebell: "Kettlebell",
  machines: "Machines",
  bands: "Resistance bands",
  bodyweight: "Bodyweight only",
};

export const DURATION_OPTIONS: { value: Duration & string; label: string }[] = [
  { value: "short", label: "Under 45 min" },
  { value: "medium", label: "45–60 min" },
  { value: "long", label: "60–90 min" },
  { value: "extended", label: "90+ min" },
];

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const CYCLE_OPTIONS: { value: CycleType & string; label: string; description: string }[] = [
  {
    value: "regular",
    label: "I have a regular cycle",
    description:
      "I can roughly track where I am. Kinē will adapt intensity and recovery across your month.",
  },
  {
    value: "irregular",
    label: "Mine varies",
    description:
      "Irregular or unpredictable. Kinē adapts based on how you feel after each session instead.",
  },
  {
    value: "hormonal",
    label: "I'm on hormonal contraception",
    description:
      "Pill, implant, IUD, injection. Hormonal variation is reduced — Kinē programs consistently throughout the month.",
  },
  {
    value: "perimenopause",
    label: "Perimenopause or post-menopause",
    description:
      "Cycles changing or stopped. Kinē adjusts for recovery, joint care, and the training that matters most right now.",
  },
  {
    value: "na",
    label: "Not relevant for me",
    description:
      "Kinē adapts on effort, soreness, and session feedback instead.",
  },
];

export const INJURY_OPTIONS: { value: string; label: string }[] = [
  { value: "knees", label: "Bad knees" },
  { value: "lower_back", label: "Lower back" },
  { value: "shoulder", label: "Shoulder issues" },
  { value: "wrist", label: "Wrist pain" },
  { value: "hip", label: "Hip problems" },
  { value: "neck", label: "Neck / upper back" },
  { value: "ankle", label: "Ankle / foot" },
  { value: "postpartum", label: "Postpartum" },
  { value: "chronic_pain", label: "Chronic pain" },
  { value: "limited_mobility", label: "Limited mobility" },
];

export const PROGRAM_MAP: Record<string, Record<string, string>> = {
  strength: {
    new: "Starting Strength LP",
    developing: "4-Day Upper/Lower",
    intermediate: "5/3/1 Variant",
  },
  muscle: {
    new: "Full Body 3×/week",
    developing: "Push Pull Legs",
    intermediate: "Advanced Push Pull Legs",
  },
  general: {
    new: "Full Body Beginner",
    developing: "Full Body Intermediate",
    intermediate: "Athletic Performance",
  },
};
