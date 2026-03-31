"use client";

import Button from "@/components/Button";

export default function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="max-w-xs text-xl font-medium leading-snug text-text">
        Most programmes weren&apos;t built for your body.
      </h1>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted2">
        Showing up is the hard part. Kinē handles everything else.
      </p>
      <Button className="mt-10" size="lg" onClick={onNext}>
        Build my programme →
      </Button>
    </div>
  );
}
