import type { Goal, Experience, CycleType, Duration, LifeStage } from "@/store/useKineStore";
import type { MuscleGroup } from "@/data/exercise-library";

/**
 * Colour token per exercise muscle-group category.
 * Used by home, rest-day, pre-session, swap sheet, and session card.
 */
export const CATEGORY_COLORS: Record<MuscleGroup, string> = {
  push: "var(--color-cat-push)",
  pull: "var(--color-cat-pull)",
  legs: "var(--color-cat-legs)",
  hinge: "var(--color-cat-hinge)",
  core: "var(--color-cat-core)",
  cardio: "var(--color-cat-cardio)",
  calisthenics: "var(--color-cat-core)",
};

/**
 * Life stage drives the Progress page personalization engine.
 * Optional — undefined means "general" (no special framing).
 * Spec: docs/specs/progress-personalization-engine.md §4.2
 */
export const LIFE_STAGE_OPTIONS: { value: NonNullable<LifeStage>; label: string; description: string }[] = [
  { value: "general", label: "General", description: "No specific life-stage adjustments" },
  { value: "postpartum", label: "Postpartum", description: "Returning to training framing; rehab work and reintroduced exercises lead" },
  { value: "perimenopause", label: "Perimenopause", description: "12-week trend window; week-over-week dips contextualised, never punitive" },
  { value: "post_menopause", label: "Post-menopause", description: "Mobility and pattern balance promoted alongside strength" },
];


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
    new: "We'll start with the foundations — movements you can feel working.",
    developing: "Smarter structure, progressive overload, real change.",
    intermediate: "Periodisation, autoregulation, and nuance.",
  },
  strength: {
    new: "Technique first — the bar gets heavier once the foundations are solid.",
    developing: "Structured progression toward heavier loads.",
    intermediate: "Periodisation, peaking cycles, and precision.",
  },
  general: {
    new: "Achievable sessions that build the habit.",
    developing: "Fresh, balanced, and sustainable.",
    intermediate: "Structure and variety without overcomplicating things.",
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
  bodyweight: "Bodyweight",
};

/** Quick-select presets for equipment step */
export const EQUIP_PRESETS: { label: string; description: string; equip: string[] }[] = [
  { label: "Home / yoga mat", description: "Bodyweight + bands — no equipment needed", equip: ["bodyweight", "bands"] },
  { label: "Home gym", description: "Dumbbells, kettlebell, bands", equip: ["bodyweight", "dumbbells", "kettlebell", "bands"] },
  { label: "Full gym", description: "Everything available", equip: ["barbell", "dumbbells", "kettlebell", "machines", "bands", "bodyweight"] },
];

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

export const CONDITION_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: "pcos", label: "PCOS", description: "We frame programming around compound movement patterns and steady, sustainable progression." },
  { value: "fibroids", label: "Fibroids", description: "We manage intra-abdominal pressure, moderate high-impact movements, and adapt around flare days." },
  { value: "endometriosis", label: "Endometriosis", description: "We pace volume across the month, reduce load on high-pain days, and avoid aggravating movements." },
  { value: "pelvic_floor", label: "Pelvic floor", description: "We modify bracing cues, swap high-pressure exercises, and progress loading gradually." },
  { value: "hypermobility", label: "Hypermobility", description: "We cap deep range of motion, prioritise tempo and isometric work, avoid ballistic movements, and emphasise joint stability." },
];

export const OUTSIDE_ACTIVITY_OPTIONS: { value: string; label: string }[] = [
  { value: "running", label: "Running" },
  { value: "swimming", label: "Swimming" },
  { value: "cycling", label: "Cycling" },
  { value: "team_sport", label: "Team sport" },
  { value: "climbing", label: "Climbing" },
  { value: "martial_arts", label: "Martial arts" },
  { value: "yoga_pilates", label: "Yoga / Pilates" },
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
