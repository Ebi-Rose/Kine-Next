"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useKineStore } from "@/store/useKineStore";
import type { Goal, Experience, CycleType, Duration } from "@/store/useKineStore";
import Button from "@/components/Button";
import Tile from "@/components/Tile";
import {
  GOAL_OPTIONS,
  EXP_OPTIONS,
  EXP_DESCRIPTIONS,
  ALL_EQUIPMENT,
  EQUIP_LABELS,
  DURATION_OPTIONS,
  DAY_LABELS,
  CYCLE_OPTIONS,
  INJURY_OPTIONS,
  PROGRAM_MAP,
} from "@/data/constants";

type Step = "welcome" | "goal" | "experience" | "equipment" | "schedule" | "cycle" | "injuries" | "summary";

const STEP_ORDER: Step[] = [
  "welcome",
  "goal",
  "experience",
  "equipment",
  "schedule",
  "cycle",
  "injuries",
  "summary",
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("welcome");
  const router = useRouter();
  const store = useKineStore();

  const stepIndex = STEP_ORDER.indexOf(step);
  // Steps 1-4 shown as "STEP X OF 4" (goal, experience, equipment, schedule)
  const numberedStep = ["goal", "experience", "equipment", "schedule"].indexOf(step) + 1;

  function next() {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEP_ORDER.length) {
      setStep(STEP_ORDER[nextIdx]);
    }
  }

  function goToStep(s: Step) {
    setStep(s);
  }

  function finishOnboarding() {
    const today = new Date().toISOString().split("T")[0];
    store.setProgressDB({
      ...store.progressDB,
      programStartDate: today,
      currentWeek: 1,
    });
    router.push("/app");
  }

  return (
    <div className="min-h-screen bg-bg px-5 py-8">
      <div className="mx-auto max-w-[var(--container-max)]">
        {step === "welcome" && <WelcomeStep onNext={next} />}
        {step === "goal" && <GoalStep onNext={next} numberedStep={numberedStep} />}
        {step === "experience" && <ExperienceStep onNext={next} numberedStep={numberedStep} />}
        {step === "equipment" && <EquipmentStep onNext={next} numberedStep={numberedStep} />}
        {step === "schedule" && (
          <ScheduleStep
            onNext={() => goToStep("cycle")}
            numberedStep={numberedStep}
          />
        )}
        {step === "cycle" && <CycleStep onNext={() => goToStep("injuries")} />}
        {step === "injuries" && <InjuriesStep onNext={() => goToStep("summary")} />}
        {step === "summary" && <SummaryStep onFinish={finishOnboarding} />}
      </div>
    </div>
  );
}

// ── Step 0: Welcome ──

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-5xl tracking-widest text-accent">KINĒ</h1>
      <p className="mt-2 text-xs tracking-[0.3em] text-muted2 uppercase">
        Train with intention
      </p>
      <p className="mt-8 max-w-xs text-sm leading-relaxed text-muted2">
        Built for where you are. Designed for where you&apos;re going.
      </p>
      <div className="mt-6 flex gap-3 text-[10px] tracking-wider text-muted uppercase">
        <span>Strength</span>
        <span className="text-border">·</span>
        <span>Physique</span>
        <span className="text-border">·</span>
        <span>Consistency</span>
      </div>
      <Button className="mt-10" size="lg" onClick={onNext}>
        Build my program →
      </Button>
    </div>
  );
}

// ── Step 1: Goal ──

function GoalStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { goal, setGoal } = useKineStore();

  return (
    <div>
      <StepLabel step={numberedStep} />
      <h2 className="font-display text-2xl tracking-wide text-text">
        What do you want training to give you?
      </h2>
      <p className="mt-1 text-xs text-muted2">
        No wrong answer — all three build strength and change your body. This shapes the emphasis.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {GOAL_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={goal === opt.value}
            onClick={() => setGoal(opt.value as Goal)}
          >
            <div className="font-medium text-text">{opt.label}</div>
            <div className="mt-1 text-xs text-muted2">{opt.description}</div>
          </Tile>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={onNext} disabled={!goal} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step 2: Experience ──

function ExperienceStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { goal, exp, setExp } = useKineStore();
  const goalKey = goal || "general";

  return (
    <div>
      <StepLabel step={numberedStep} />
      <h2 className="font-display text-2xl tracking-wide text-text">
        Where are you right now?
      </h2>
      <div className="mt-6 flex flex-col gap-3">
        {EXP_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={exp === opt.value}
            onClick={() => setExp(opt.value as Experience)}
          >
            <div className="font-medium text-text">{opt.label}</div>
            <div className="mt-1 text-xs text-muted2">
              {EXP_DESCRIPTIONS[goalKey]?.[opt.value] || ""}
            </div>
          </Tile>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={onNext} disabled={!exp} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Equipment ──

function EquipmentStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { equip, setEquip } = useKineStore();

  function toggleEquip(val: string) {
    if (equip.includes(val)) {
      setEquip(equip.filter((e) => e !== val));
    } else {
      setEquip([...equip, val]);
    }
  }

  return (
    <div>
      <StepLabel step={numberedStep} />
      <h2 className="font-display text-2xl tracking-wide text-text">
        What equipment do you have?
      </h2>
      <p className="mt-1 text-xs text-muted2">
        Select all that apply. We&apos;ll only program what you can actually do.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {ALL_EQUIPMENT.map((val) => (
          <Tile
            key={val}
            selected={equip.includes(val)}
            onClick={() => toggleEquip(val)}
          >
            {EQUIP_LABELS[val]}
          </Tile>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={onNext} disabled={equip.length === 0} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step 4: Schedule ──

function ScheduleStep({
  onNext,
  numberedStep,
}: {
  onNext: () => void;
  numberedStep: number;
}) {
  const { trainingDays, setTrainingDays, setDays, duration, setDuration } =
    useKineStore();

  function toggleDay(dow: number) {
    let newDays: number[];
    if (trainingDays.includes(dow)) {
      newDays = trainingDays.filter((d) => d !== dow);
    } else {
      newDays = [...trainingDays, dow].sort();
    }
    setTrainingDays(newDays);
    setDays(String(newDays.length));
  }

  const canContinue = trainingDays.length > 0 && duration !== null;

  return (
    <div>
      <StepLabel step={numberedStep} />
      <h2 className="font-display text-2xl tracking-wide text-text">
        When can you train?
      </h2>

      <p className="mt-4 text-xs text-muted2 uppercase tracking-wider">
        Training days
      </p>
      <div className="mt-2 flex gap-2">
        {DAY_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => toggleDay(i)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium transition-all ${
              trainingDays.includes(i)
                ? "bg-accent text-bg"
                : "bg-surface2 text-muted2 hover:text-text"
            }`}
          >
            {label.slice(0, 2)}
          </button>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted2 uppercase tracking-wider">
        Session length
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {DURATION_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={duration === opt.value}
            onClick={() => setDuration(opt.value as Duration)}
          >
            {opt.label}
          </Tile>
        ))}
      </div>

      <div className="mt-8">
        <Button onClick={onNext} disabled={!canContinue} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}

// ── Step 5c: Cycle ──

function CycleStep({ onNext }: { onNext: () => void }) {
  const { cycleType, setCycleType, setCycle } = useKineStore();
  const [periodDate, setPeriodDate] = useState("");

  function handleContinue() {
    if (cycleType === "regular" && periodDate) {
      setCycle({
        periodLog: [{ date: periodDate, type: "start" }],
        avgLength: null,
      });
    }
    onNext();
  }

  function skip() {
    setCycleType("na");
    onNext();
  }

  return (
    <div>
      <p className="text-[10px] tracking-[0.3em] text-accent uppercase">
        Your cycle
      </p>
      <h2 className="mt-2 font-display text-2xl tracking-wide text-text">
        How does your body work across the month?
      </h2>
      <p className="mt-1 text-xs text-muted2">
        Hormones affect how you recover, how strong you feel, and when to push
        hard. Kinē uses this quietly — it shapes your program, not your identity.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {CYCLE_OPTIONS.map((opt) => (
          <Tile
            key={opt.value}
            selected={cycleType === opt.value}
            onClick={() => setCycleType(opt.value as CycleType)}
          >
            <div className="font-medium text-text">{opt.label}</div>
            <div className="mt-1 text-xs text-muted2">{opt.description}</div>
          </Tile>
        ))}
      </div>

      {cycleType === "regular" && (
        <div className="mt-4">
          <label className="text-xs text-muted2">
            When did your last period start?
          </label>
          <input
            type="date"
            value={periodDate}
            onChange={(e) => setPeriodDate(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
          <p className="mt-1 text-[10px] text-muted">
            Approximate is fine — you can update it any time.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Button onClick={handleContinue} disabled={!cycleType} className="w-full">
          Continue
        </Button>
        <button
          onClick={skip}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}

// ── Step 5: Injuries ──

function InjuriesStep({ onNext }: { onNext: () => void }) {
  const { injuries, setInjuries, injuryNotes, setInjuryNotes } = useKineStore();

  function toggleInjury(val: string) {
    if (injuries.includes(val)) {
      setInjuries(injuries.filter((i) => i !== val));
    } else {
      setInjuries([...injuries, val]);
    }
  }

  return (
    <div>
      <p className="text-[10px] tracking-[0.3em] text-accent uppercase">
        Limitations
      </p>
      <h2 className="mt-2 font-display text-2xl tracking-wide text-text">
        Anything to work around?
      </h2>
      <p className="mt-1 text-xs text-muted2">
        Kinē programs around limitations, not through them. Select anything
        relevant — or skip if you&apos;re good to go.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {INJURY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleInjury(opt.value)}
            className={`rounded-full border px-4 py-2 text-xs transition-all ${
              injuries.includes(opt.value)
                ? "border-accent bg-accent-dim text-text"
                : "border-border bg-surface text-muted2 hover:border-border-active"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <textarea
          value={injuryNotes}
          onChange={(e) => setInjuryNotes(e.target.value)}
          placeholder="Anything else? E.g. 'recovering from surgery', 'can't do overhead pressing'…"
          rows={3}
          className="w-full rounded-[var(--radius-default)] border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent resize-none"
        />
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button onClick={onNext} className="w-full">
          Build my program →
        </Button>
        <button
          onClick={onNext}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          No limitations — build my program
        </button>
      </div>
    </div>
  );
}

// ── Step 6: Summary ──

function SummaryStep({ onFinish }: { onFinish: () => void }) {
  const { goal, exp, equip, trainingDays, duration, injuries, cycleType } =
    useKineStore();

  const programName =
    PROGRAM_MAP[goal || "general"]?.[exp || "new"] || "Custom Program";

  return (
    <div>
      <p className="text-[10px] tracking-[0.3em] text-accent uppercase">
        Your program
      </p>
      <h2 className="mt-2 font-display text-2xl tracking-wide text-text">
        Here&apos;s what we&apos;ve built.
      </h2>

      <div className="mt-6 rounded-[var(--radius-default)] border border-border bg-surface p-5">
        <h3 className="font-display text-xl tracking-wide text-accent">
          {programName}
        </h3>

        <div className="mt-4 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2 text-muted2">
            <span>📅</span>
            <span>
              {trainingDays.length} days/week —{" "}
              {trainingDays.map((d) => DAY_LABELS[d]).join(", ")}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted2">
            <span>⏱</span>
            <span>
              {DURATION_OPTIONS.find((d) => d.value === duration)?.label || duration}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted2">
            <span>↗</span>
            <span>{equip.map((e) => EQUIP_LABELS[e]).join(", ")}</span>
          </div>

          {injuries.length > 0 && (
            <div className="flex items-center gap-2 text-muted2">
              <span>⚠</span>
              <span>Modified for {injuries.join(", ")}</span>
            </div>
          )}

          {cycleType && cycleType !== "na" && (
            <div className="flex items-center gap-2 text-muted2">
              <span>◐</span>
              <span>Cycle-aware loading</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Button onClick={onFinish} className="w-full" size="lg">
          Start Week 1 →
        </Button>
      </div>
    </div>
  );
}

// ── Shared: Step label ──

function StepLabel({ step }: { step: number }) {
  if (step <= 0) return null;
  return (
    <p className="mb-4 text-[10px] tracking-[0.3em] text-accent uppercase">
      Step {step} of 4
    </p>
  );
}
