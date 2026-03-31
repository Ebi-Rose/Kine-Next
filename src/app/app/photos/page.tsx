"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAllPhotos, savePhoto, deletePhoto, fileToDataUrl } from "@/lib/photo-store";
import { appTodayISO } from "@/lib/dev-time";
import type { ProgressPhoto } from "@/lib/photo-store";
import Button from "@/components/Button";
import { toast } from "@/components/Toast";

export default function PhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllPhotos().then((p) => {
      setPhotos(p.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      toast("Please select an image file", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast("Image must be under 10MB", "error");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const photo: ProgressPhoto = {
        id: `photo_${Date.now()}`,
        date: appTodayISO(),
        dataUrl,
        note: "",
      };
      await savePhoto(photo);
      setPhotos((prev) => [photo, ...prev]);
      toast("Photo saved", "success");
    } catch {
      toast("Failed to save photo", "error");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this photo?")) return;
    await deletePhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelectedPhoto(null);
    toast("Photo deleted", "success");
  }

  return (
    <div>
      <button onClick={() => router.back()} className="text-xs text-muted2 hover:text-text transition-colors">
        ← Back
      </button>
      <h1 className="mt-2 font-display text-2xl tracking-wide text-accent">Progress Photos</h1>
      <p className="mt-1 text-xs text-muted2">Track your visual progress over time.</p>

      {/* Add photo */}
      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Add photo
        </Button>
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : photos.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-default)] border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted2">No photos yet. Take your first progress photo to start tracking visually.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square overflow-hidden rounded-lg border border-border hover:border-accent transition-all"
            >
              <img
                src={photo.dataUrl}
                alt={`Progress ${photo.date}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Photo detail overlay */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-bg">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSelectedPhoto(null)} className="text-xs text-muted2 hover:text-text">
              ← Back
            </button>
            <span className="text-xs text-muted2">{selectedPhoto.date}</span>
            <button onClick={() => handleDelete(selectedPhoto.id)} className="text-xs text-red-400 hover:text-red-300">
              Delete
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={selectedPhoto.dataUrl}
              alt={`Progress ${selectedPhoto.date}`}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
