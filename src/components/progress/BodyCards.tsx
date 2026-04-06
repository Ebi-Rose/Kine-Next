// ── Body tab cards ──
//
// Photos-first, principle-aligned. Photos lead with "Your strongest record
// of change", framed explicitly as optional and private. Body weight is
// demoted; measurements is a no-op opt-in stub until the feature exists.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@/components/Toast";
import { getAllCheckIns, type CheckIn } from "@/lib/photo-store";
import { Card, Eyebrow, GhostCard, Tiny } from "./shared";

/**
 * Hero copy for the Body tab. Spec §4.7 — exact copy locked in
 * docs/specs/progress-personalization-engine.md.
 */
export function BodyPhotosHero() {
  return (
    <Card accent>
      <Eyebrow>Progress photos</Eyebrow>
      <p className="font-display italic text-xl text-text leading-tight mt-1">
        Your strongest record of change
      </p>
      <p className="text-xs text-muted2 font-light mt-2 leading-relaxed">
        Strength shows up in your body before it shows up on the scale. A photo every few weeks captures what numbers miss — posture, shape, the small changes you stop noticing in the mirror.
      </p>
      <p className="text-[10px] text-muted font-light mt-3">
        Private to you · never shared · never required.
      </p>
    </Card>
  );
}

/**
 * Side-by-side compare card. Loads check-ins from IndexedDB on mount.
 * Empty state is its own card (BodyPhotosEmpty).
 */
export function PhotoCompareCard() {
  const [checkins, setCheckins] = useState<CheckIn[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    getAllCheckIns()
      .then((items) => {
        if (cancelled) return;
        const sorted = items
          .filter((c) => c.photos && c.photos.length > 0)
          .sort((a, b) => a.date.localeCompare(b.date));
        setCheckins(sorted);
      })
      .catch(() => setCheckins([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (checkins === null) return null; // loading
  if (checkins.length === 0) return <BodyPhotosEmpty />;

  const first = checkins[0];
  const latest = checkins[checkins.length - 1];

  return (
    <>
      <Eyebrow>Compare</Eyebrow>
      <Card>
        <div className="flex gap-2">
          <PhotoFrame src={first.photos[0]} label={first.date} />
          <PhotoFrame src={latest.photos[0]} label={latest.date} />
        </div>
        <p className="text-[10px] text-muted text-center mt-2">
          <Link href="/app/photos" className="text-accent hover:underline">
            Tap to swipe through all photos →
          </Link>
        </p>
      </Card>
    </>
  );
}

function PhotoFrame({ src, label }: { src?: string; label: string }) {
  return (
    <div className="flex-1 aspect-[3/4] rounded-lg overflow-hidden bg-[linear-gradient(135deg,#2a2520,#1a1815)] relative">
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Progress photo from ${label}`} className="w-full h-full object-cover" />
      )}
      <div className="absolute bottom-1.5 left-1.5 text-[10px] text-muted bg-bg/60 backdrop-blur px-1.5 py-0.5 rounded">
        {label}
      </div>
    </div>
  );
}

/** Empty-state card — invites the first photo, never demands one. */
export function BodyPhotosEmpty() {
  return (
    <GhostCard className="text-left py-5 px-4">
      <p className="font-display italic text-base text-accent">Take your first photo</p>
      <p className="text-[10px] text-muted mt-1 leading-relaxed">
        Front, side, back — same lighting, same time of day if you can. We&apos;ll remind you in 4 weeks.
      </p>
      <div className="mt-3">
        <Link
          href="/app/photos"
          className="inline-block px-4 py-2 rounded-full bg-accent text-[11px] font-medium text-[#1a1310]"
        >
          + Add photo
        </Link>
      </div>
    </GhostCard>
  );
}

/** Body weight: optional, never the headline. Hidden entirely for PCOS/pregnancy/postpartum. */
export function BodyWeightDemoteCard({ variant }: { variant: string }) {
  if (variant === "hidden") return null;
  return (
    <>
      <Eyebrow>Body weight</Eyebrow>
      <Card>
        <Tiny>Optional · not the headline. Strength and how you feel matter more.</Tiny>
        <Link
          href="/app/photos"
          className="block mt-2 text-[10px] text-accent hover:underline"
        >
          Log a body weight check-in →
        </Link>
      </Card>
    </>
  );
}

/** Measurements opt-in stub — not implemented yet. */
export function MeasurementsOptInTile() {
  return (
    <>
      <Eyebrow>Other tracking</Eyebrow>
      <button
        type="button"
        onClick={() => toast("Measurements coming later — let us know if you want this", "info")}
        className="w-full flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-3 text-left mb-2"
      >
        <span className="text-xs text-text">
          Turn on measurements <span className="text-[10px] text-muted">· optional</span>
        </span>
        <span className="text-muted">→</span>
      </button>
    </>
  );
}
