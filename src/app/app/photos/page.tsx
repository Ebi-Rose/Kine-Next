"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAllCheckIns, saveCheckIn, deleteCheckIn, fileToDataUrl } from "@/lib/photo-store";
import type { CheckIn } from "@/lib/photo-store";
import { useKineStore } from "@/store/useKineStore";
import { appTodayISO } from "@/lib/dev-time";
import { kgToDisplay, weightUnit, formatDateShortLocale } from "@/lib/format";
import Button from "@/components/Button";
import BottomSheet from "@/components/BottomSheet";
import { toast } from "@/components/Toast";

const MOODS = [
  { value: "great" as const, label: "Great", icon: "✦" },
  { value: "good" as const, label: "Good", icon: "●" },
  { value: "okay" as const, label: "Okay", icon: "◐" },
  { value: "low" as const, label: "Low", icon: "○" },
];

export default function CheckInsPage() {
  const router = useRouter();
  const { measurementSystem, checkinFields } = useKineStore();
  const system = measurementSystem || "metric";
  const unit = weightUnit(system);
  const fields = checkinFields ?? ["photos", "weight", "mood", "notes"];
  const showPhotos = fields.includes("photos");
  const showWeight = fields.includes("weight");
  const showMood = fields.includes("mood");
  const showNotes = fields.includes("notes");

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [detail, setDetail] = useState<CheckIn | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);

  // New check-in form state
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newMood, setNewMood] = useState<CheckIn["mood"]>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllCheckIns().then((items) => {
      setCheckIns(items.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
  }, []);

  function resetForm() {
    setNewPhotos([]);
    setNewNote("");
    setNewWeight("");
    setNewMood(null);
    setShowNew(false);
  }

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) {
        toast("Image must be under 10MB", "error");
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        setNewPhotos((prev) => [...prev, dataUrl]);
      } catch {
        toast("Failed to load image", "error");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    if (newPhotos.length === 0 && !newNote && !newWeight && !newMood) {
      toast("Add something to your check-in first", "error");
      return;
    }

    const checkin: CheckIn = {
      id: `checkin_${Date.now()}`,
      date: appTodayISO(),
      photos: newPhotos,
      note: newNote.trim(),
      weight: newWeight ? parseFloat(newWeight) : null,
      mood: newMood,
    };

    try {
      await saveCheckIn(checkin);
      setCheckIns((prev) => [checkin, ...prev]);
      resetForm();
      toast("Check-in saved", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this check-in?")) return;
    await deleteCheckIn(id);
    setCheckIns((prev) => prev.filter((c) => c.id !== id));
    setDetail(null);
    toast("Deleted", "success");
  }

  // Weight trend (latest vs first with weight)
  const withWeight = checkIns.filter((c) => c.weight !== null);
  const weightTrend = withWeight.length >= 2
    ? (withWeight[0].weight! - withWeight[withWeight.length - 1].weight!).toFixed(1)
    : null;

  return (
    <div>
      <button onClick={() => router.back()} className="text-[13px] text-muted hover:text-text transition-colors">
        ← Back
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Check-ins</h1>
      <p className="mt-1 text-xs text-muted2">Track how you look, feel, and change over time.</p>

      {/* Quick stats */}
      {checkIns.length > 0 && (
        <div className="mt-4 flex gap-2">
          <div className="flex-1 rounded-[var(--radius-default)] border border-border bg-surface p-3 text-center">
            <p className="font-display text-xl text-accent">{checkIns.length}</p>
            <p className="text-[9px] tracking-wider text-muted uppercase">Check-ins</p>
          </div>
          {withWeight.length > 0 && (
            <div className="flex-1 rounded-[var(--radius-default)] border border-border bg-surface p-3 text-center">
              <p className="font-display text-xl text-accent">
                {kgToDisplay(withWeight[0].weight!, system)}<span className="text-xs text-muted2">{unit}</span>
              </p>
              <p className="text-[9px] tracking-wider text-muted uppercase">Latest</p>
            </div>
          )}
          {weightTrend !== null && (
            <div className="flex-1 rounded-[var(--radius-default)] border border-border bg-surface p-3 text-center">
              <p className="font-display text-xl text-accent">
                {parseFloat(weightTrend) > 0 ? "+" : ""}{kgToDisplay(parseFloat(weightTrend), system)}<span className="text-xs text-muted2">{unit}</span>
              </p>
              <p className="text-[9px] tracking-wider text-muted uppercase">Change</p>
            </div>
          )}
        </div>
      )}

      {/* New check-in button */}
      <div className="mt-5">
        <Button variant="primary" size="md" onClick={() => setShowNew(true)}>
          New check-in
        </Button>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : checkIns.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-default)] border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted2">No check-ins yet.</p>
          <p className="text-xs text-muted mt-1">Add photos, weight, or notes to track your journey.</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {checkIns.map((checkin) => (
            <button
              key={checkin.id}
              onClick={() => { setDetail(checkin); setPhotoIdx(0); }}
              className="rounded-[var(--radius-default)] border border-border bg-surface p-4 text-left hover:border-border-active transition-all"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                {checkin.photos.length > 0 && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border">
                    <img
                      src={checkin.photos[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {checkin.photos.length > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 bg-bg/80 text-[8px] text-text px-1 rounded">
                        +{checkin.photos.length - 1}
                      </span>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted2">{formatDateShortLocale(checkin.date)}</span>
                    <div className="flex items-center gap-2">
                      {checkin.mood && (
                        <span className="text-[10px] text-muted2">
                          {MOODS.find((m) => m.value === checkin.mood)?.icon}
                        </span>
                      )}
                      {checkin.weight !== null && (
                        <span className="text-[10px] text-muted2">
                          {kgToDisplay(checkin.weight, system)}{unit}
                        </span>
                      )}
                    </div>
                  </div>
                  {checkin.note && (
                    <p className="mt-1 text-xs text-text line-clamp-2">{checkin.note}</p>
                  )}
                  {!checkin.note && checkin.photos.length === 0 && checkin.weight !== null && (
                    <p className="mt-1 text-xs text-muted2">Weight logged</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New check-in sheet */}
      <BottomSheet open={showNew} onClose={resetForm} title="New check-in">
        <div className="flex flex-col gap-5">
          {/* Photos */}
          {showPhotos && (
            <div>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Photos</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleAddPhotos}
              className="hidden"
            />
            <div className="flex gap-2 flex-wrap">
              {newPhotos.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setNewPhotos((p) => p.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 bg-bg/80 text-text text-[10px] w-5 h-5 rounded-full flex items-center justify-center"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {newPhotos.length < 6 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border border-dashed border-border text-muted2 hover:border-accent hover:text-accent transition-all flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-lg">+</span>
                  <span className="text-[8px]">Add</span>
                </button>
              )}
            </div>
          </div>
          )}

          {/* Weight */}
          {showWeight && (
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Weight <span className="normal-case tracking-normal text-muted2">· optional · {unit}</span></p>
              <input
                type="number"
                inputMode="decimal"
                placeholder={`e.g. ${system === "imperial" ? "135" : "61"}`}
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                aria-label={`Bodyweight in ${unit}`}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
              />
            </div>
          )}

          {/* Mood */}
          {showMood && (
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-2">How are you feeling?</p>
              <div className="flex gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setNewMood(newMood === m.value ? null : m.value)}
                    className={`flex-1 rounded-lg border py-2.5 text-center transition-all ${
                      newMood === m.value
                        ? "border-accent bg-accent-dim text-text"
                        : "border-border text-muted2 hover:border-border-active"
                    }`}
                  >
                    <span className="block text-sm">{m.icon}</span>
                    <span className="block text-[9px] mt-0.5">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {showNotes && (
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Notes</p>
              <textarea
                placeholder="How do you feel? What do you notice?"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                aria-label="Check-in notes"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors resize-none"
              />
            </div>
          )}

          <Button variant="primary" size="lg" onClick={handleSave}>
            Save check-in
          </Button>
        </div>
      </BottomSheet>

      {/* Detail view */}
      {detail && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-bg overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 shrink-0">
            <button onClick={() => setDetail(null)} className="text-xs text-muted2 hover:text-text transition-colors">
              ← Back
            </button>
            <span className="text-xs text-muted2">{formatDateShortLocale(detail.date)}</span>
            <button
              onClick={() => handleDelete(detail.id)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Delete
            </button>
          </div>

          {/* Photos carousel */}
          {detail.photos.length > 0 && (
            <div className="relative">
              <div className="flex items-center justify-center px-4 pb-4">
                <img
                  src={detail.photos[photoIdx]}
                  alt={`Check-in photo ${photoIdx + 1}`}
                  className="max-h-[50vh] rounded-xl object-contain"
                />
              </div>
              {detail.photos.length > 1 && (
                <div className="flex justify-center gap-1.5 pb-3">
                  {detail.photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === photoIdx ? "bg-accent" : "bg-border"
                      }`}
                      aria-label={`View photo ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div className="px-4 pb-8 flex flex-col gap-4">
            {/* Weight & Mood row */}
            {(detail.weight !== null || detail.mood) && (
              <div className="flex gap-3">
                {detail.weight !== null && (
                  <div className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3">
                    <p className="text-[9px] text-muted uppercase tracking-wider">Weight</p>
                    <p className="font-display text-xl text-accent">
                      {kgToDisplay(detail.weight, system)}<span className="text-xs text-muted2">{unit}</span>
                    </p>
                  </div>
                )}
                {detail.mood && (
                  <div className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3">
                    <p className="text-[9px] text-muted uppercase tracking-wider">Feeling</p>
                    <p className="font-display text-xl text-accent">
                      {MOODS.find((m) => m.value === detail.mood)?.icon}{" "}
                      <span className="text-sm text-text">{MOODS.find((m) => m.value === detail.mood)?.label}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            {detail.note && (
              <div className="rounded-[var(--radius-default)] border border-border bg-surface p-4">
                <p className="text-[9px] text-muted uppercase tracking-wider mb-2">Notes</p>
                <p className="text-sm text-text whitespace-pre-wrap">{detail.note}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
