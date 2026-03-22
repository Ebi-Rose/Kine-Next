"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import { signOut } from "@/lib/auth";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";
import {
  GOAL_OPTIONS,
  EXP_OPTIONS,
  EQUIP_LABELS,
  DURATION_OPTIONS,
  DAY_LABELS,
} from "@/data/constants";

export default function ProfilePage() {
  const store = useKineStore();
  const { personalProfile, setPersonalProfile, goal, exp, equip, trainingDays, duration, units, setUnits } = store;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(personalProfile.name);
  const [weight, setWeight] = useState(personalProfile.weight);
  const [height, setHeight] = useState(personalProfile.height);

  function saveProfile() {
    setPersonalProfile({
      ...personalProfile,
      name,
      weight,
      height,
    });
    setEditing(false);
    toast("Profile saved", "success");
  }

  const goalLabel = GOAL_OPTIONS.find((g) => g.value === goal)?.label || goal;
  const expLabel = EXP_OPTIONS.find((e) => e.value === exp)?.label || exp;
  const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label || duration;

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-accent">
        Profile
      </h1>

      {/* Personal info */}
      <Section title="About you">
        {editing ? (
          <div className="flex flex-col gap-3">
            <Input label="Name" value={name} onChange={setName} />
            <Input label="Weight (kg)" value={weight} onChange={setWeight} />
            <Input label="Height (cm)" value={height} onChange={setHeight} />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveProfile}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-sm text-muted2">
            <p>{personalProfile.name || "No name set"}</p>
            {personalProfile.weight && <p>{personalProfile.weight} kg</p>}
            {personalProfile.height && <p>{personalProfile.height} cm</p>}
            <button
              onClick={() => setEditing(true)}
              className="mt-2 text-xs text-accent hover:underline self-start"
            >
              Edit
            </button>
          </div>
        )}
      </Section>

      {/* Training preferences */}
      <Section title="Training">
        <div className="flex flex-col gap-2 text-sm text-muted2">
          <Row label="Goal" value={goalLabel || "—"} />
          <Row label="Experience" value={expLabel || "—"} />
          <Row label="Equipment" value={equip.map((e) => EQUIP_LABELS[e] || e).join(", ") || "—"} />
          <Row label="Training days" value={trainingDays.map((d) => DAY_LABELS[d]).join(", ") || "—"} />
          <Row label="Session length" value={durationLabel || "—"} />
        </div>
      </Section>

      {/* Settings */}
      <Section title="Settings">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted2">Units</span>
          <div className="flex gap-1">
            {(["kg", "lbs"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnits(u)}
                className={`rounded-lg px-3 py-1 text-xs transition-all ${
                  units === u
                    ? "bg-accent text-bg"
                    : "bg-surface2 text-muted2 hover:text-text"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Sign out */}
      <div className="mt-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="text-muted2"
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-xs tracking-wider text-muted uppercase">{title}</h2>
      <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />
    </div>
  );
}
