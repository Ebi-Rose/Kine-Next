/**
 * Test personas for the Dev Panel.
 *
 * Each persona is a partial slice of the onboarding/profile state that can be
 * applied to `useKineStore` to quickly reproduce a scenario from
 * `docs/testing/test-personas.md` without walking through onboarding.
 *
 * Keep these focused on the onboarding-shaped state. Sessions and lift history
 * are deliberately left empty — use the existing "Seed 8 weeks of lift data"
 * and "Simulate" actions in the Dev Panel to layer history on top.
 */

import type {
  Goal,
  Experience,
  CycleType,
  Duration,
  PersonalProfile,
} from "@/store/useKineStore";

export interface TestPersona {
  id: string;
  name: string;
  tagline: string;
  /** Short hint about what this persona is useful for testing */
  tests: string;
  goal: Goal;
  exp: Experience;
  equip: string[];
  days: string;
  duration: Duration;
  injuries: string[];
  injuryNotes: string;
  conditions: string[];
  cycleType: CycleType;
  profile: Pick<PersonalProfile, "name" | "height" | "weight" | "trainingAge">;
}

export const TEST_PERSONAS: TestPersona[] = [
  {
    id: "toni",
    name: "Toni",
    tagline: "Machine-only gym, wrist tendinitis",
    tests: "Wrist swap · grip-heavy filtering · machines-only selection",
    goal: "general",
    exp: "new",
    equip: ["machines"],
    days: "3",
    duration: "medium",
    injuries: ["wrist"],
    injuryNotes: "Chronic wrist tendinitis — avoid heavy gripping and wrist extension under load",
    conditions: [],
    cycleType: "na",
    profile: { name: "Toni", height: "163", weight: "72", trainingAge: "0" },
  },
  {
    id: "suki",
    name: "Suki",
    tagline: "Strength goal, machines only, wrist pain",
    tests: "Wrist swap intersected with strength programming on machines",
    goal: "strength",
    exp: "developing",
    equip: ["machines"],
    days: "4",
    duration: "long",
    injuries: ["wrist"],
    injuryNotes: "Chronic wrist tendinitis — no barbell pressing or front rack",
    conditions: [],
    cycleType: "na",
    profile: { name: "Suki", height: "168", weight: "65", trainingAge: "2" },
  },
  {
    id: "sarah",
    name: "Sarah",
    tagline: "Beginner, full gym, no issues",
    tests: "Baseline: clean onboarding, no conditions, no injuries",
    goal: "general",
    exp: "new",
    equip: ["barbell", "dumbbells", "machines", "bodyweight"],
    days: "3",
    duration: "medium",
    injuries: [],
    injuryNotes: "",
    conditions: [],
    cycleType: "regular",
    profile: { name: "Sarah", height: "165", weight: "68", trainingAge: "0" },
  },
  {
    id: "emma",
    name: "Emma",
    tagline: "Cautious returner, lower back",
    tests: "Lower-back injury filtering · returner framing",
    goal: "general",
    exp: "developing",
    equip: ["dumbbells", "bodyweight", "bands"],
    days: "3",
    duration: "medium",
    injuries: ["lower_back"],
    injuryNotes: "History of lumbar strain — avoid loaded spinal flexion",
    conditions: [],
    cycleType: "regular",
    profile: { name: "Emma", height: "170", weight: "70", trainingAge: "1" },
  },
  {
    id: "fatima",
    name: "Fatima",
    tagline: "PCOS, strength-focused",
    tests: "PCOS condition · compound-priority programming · condition education",
    goal: "strength",
    exp: "developing",
    equip: ["barbell", "dumbbells", "machines", "bodyweight"],
    days: "4",
    duration: "long",
    injuries: [],
    injuryNotes: "",
    conditions: ["pcos"],
    cycleType: "irregular",
    profile: { name: "Fatima", height: "162", weight: "78", trainingAge: "1" },
  },
  {
    id: "nkechi",
    name: "Nkechi",
    tagline: "Fibroids, building a habit",
    tests: "Fibroids · impact-sensitive comfort flag · symptom-aware scaling",
    goal: "general",
    exp: "new",
    equip: ["dumbbells", "bodyweight"],
    days: "3",
    duration: "short",
    injuries: [],
    injuryNotes: "",
    conditions: ["fibroids"],
    cycleType: "regular",
    profile: { name: "Nkechi", height: "167", weight: "74", trainingAge: "0" },
  },
  {
    id: "leila",
    name: "Leila",
    tagline: "Endometriosis, managing flares",
    tests: "Endometriosis · low-impact default · flare-day scaling",
    goal: "muscle",
    exp: "developing",
    equip: ["dumbbells", "machines", "bodyweight"],
    days: "3",
    duration: "medium",
    injuries: [],
    injuryNotes: "",
    conditions: ["endometriosis"],
    cycleType: "regular",
    profile: { name: "Leila", height: "164", weight: "63", trainingAge: "1" },
  },
  {
    id: "grace",
    name: "Grace",
    tagline: "Pelvic floor, new to training",
    tests: "Pelvic floor condition · prone-sensitive flag · bracing cue modifications",
    goal: "general",
    exp: "new",
    equip: ["dumbbells", "bodyweight", "bands"],
    days: "3",
    duration: "short",
    injuries: [],
    injuryNotes: "",
    conditions: ["pelvic_floor"],
    cycleType: "regular",
    profile: { name: "Grace", height: "166", weight: "69", trainingAge: "0" },
  },
];
