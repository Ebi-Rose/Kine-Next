"use client";

import { useState } from "react";
import { useKineStore } from "@/store/useKineStore";
import Button from "@/components/Button";

export default function NameStep({ onNext }: { onNext: () => void }) {
  const { personalProfile, setPersonalProfile } = useKineStore();
  const [name, setName] = useState(personalProfile.name);

  function handleContinue() {
    setPersonalProfile({ ...personalProfile, name: name.trim() });
    onNext();
  }

  return (
    <div className="animate-fade-up flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h2 className="font-display text-xl tracking-wide text-text">
        What should we call you?
      </h2>
      <p className="mt-2 text-xs text-muted2">
        First name is fine.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        aria-label="Your name"
        autoFocus
        className="mt-6 w-full max-w-xs rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-center text-sm text-text placeholder:text-muted outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
      <Button className="mt-6 w-full max-w-xs" size="lg" onClick={handleContinue} disabled={!name.trim()}>
        Continue
      </Button>
    </div>
  );
}
