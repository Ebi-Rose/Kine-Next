"use client";

import { useState, useEffect } from "react";
import { useKineStore } from "@/store/useKineStore";
import type { TrackingMode } from "@/store/useKineStore";
import { getUser } from "@/lib/auth";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";
import { BackButton, Input } from "./_helpers";

const TRACKING_OPTIONS: { value: TrackingMode; label: string; description: string }[] = [
  { value: "lifts", label: "Lifts", description: "Track weights and reps over time" },
  { value: "photos", label: "Photos", description: "Progress pics at set intervals" },
  { value: "measurements", label: "Measurements", description: "Tape measurements (waist, hips, arms)" },
  { value: "bodyweight", label: "Bodyweight", description: "Optional weigh-ins with trend line" },
  { value: "feeling", label: "How I feel", description: "Energy, confidence, mood over time" },
];

export default function PersonalPanel({ onBack }: { onBack: () => void }) {
  const { personalProfile, setPersonalProfile, trackingModes, setTrackingModes } = useKineStore();
  const [name, setName] = useState(personalProfile.name);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    getUser().then((u) => setEmail(u?.email || null));
  }, []);

  function toggleTracking(mode: TrackingMode) {
    if (trackingModes.includes(mode)) {
      setTrackingModes(trackingModes.filter((m) => m !== mode));
    } else {
      setTrackingModes([...trackingModes, mode]);
    }
  }

  function save() {
    setPersonalProfile({ ...personalProfile, name });
    toast("Profile saved", "success");
    onBack();
  }

  return (
    <div className="mt-4">
      <BackButton onClick={onBack} />
      <h2 className="mt-4 text-xs tracking-wider text-muted uppercase">About you</h2>
      <div className="mt-4 flex flex-col gap-3">
        {email && (
          <div>
            <label className="text-xs text-muted">Email</label>
            <p className="mt-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-muted2">{email}</p>
          </div>
        )}
        <Input label="Name" value={name} onChange={setName} />
      </div>

      {/* Tracking modes */}
      <h2 className="mt-6 text-xs tracking-wider text-muted uppercase">What do you want to track?</h2>
      <p className="mt-1 text-[10px] text-muted2">This shapes what your Progress screen shows.</p>
      <div className="mt-3 flex flex-col gap-2">
        {TRACKING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleTracking(opt.value)}
            className={`text-left rounded-[var(--radius-default)] border px-4 py-3 transition-all ${
              trackingModes.includes(opt.value)
                ? "border-accent bg-accent-dim text-text"
                : "border-border bg-surface text-muted2 hover:border-border-active"
            }`}
          >
            <span className="text-sm font-medium">{opt.label}</span>
            <span className="block text-[10px] font-light mt-0.5 opacity-70">{opt.description}</span>
          </button>
        ))}
      </div>

      <Button onClick={save} className="w-full mt-6">Save</Button>
    </div>
  );
}
