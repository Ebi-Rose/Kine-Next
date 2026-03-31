"use client";

import { useState, useEffect } from "react";
import { useKineStore } from "@/store/useKineStore";
import { getUser } from "@/lib/auth";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";
import { BackButton, Input } from "./_helpers";

export default function PersonalPanel({ onBack }: { onBack: () => void }) {
  const { personalProfile, setPersonalProfile } = useKineStore();
  const [name, setName] = useState(personalProfile.name);
  const [weight, setWeight] = useState(personalProfile.weight);
  const [height, setHeight] = useState(personalProfile.height);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    getUser().then((u) => setEmail(u?.email || null));
  }, []);

  function save() {
    setPersonalProfile({ ...personalProfile, name, weight, height });
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
        <Input label="Weight (kg)" value={weight} onChange={setWeight} type="number" />
        <Input label="Height (cm)" value={height} onChange={setHeight} type="number" />
        <Button onClick={save} className="w-full">Save</Button>
      </div>
    </div>
  );
}
