"use client";

import { getVideoUrl, getVideoThumb, hasVideo } from "@/data/exercise-videos";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
}

export default function VideoSheet({ open, onClose, exerciseName }: Props) {
  const videoUrl = getVideoUrl(exerciseName);

  if (!videoUrl) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title={exerciseName}>
      <div className="rounded-lg overflow-hidden bg-bg">
        <video
          src={videoUrl}
          controls
          autoPlay
          loop
          muted
          playsInline
          aria-label={`${exerciseName} demonstration video`}
          className="w-full rounded-lg"
          style={{ maxHeight: "50vh" }}
        />
      </div>
      <p className="mt-3 text-xs text-muted2 text-center">
        Watch the movement pattern. Focus on controlled tempo.
      </p>
    </BottomSheet>
  );
}

/**
 * Thumbnail component for exercise cards.
 */
export function VideoThumbnail({
  exerciseName,
  onClick,
}: {
  exerciseName: string;
  onClick: () => void;
}) {
  if (!hasVideo(exerciseName)) return null;

  const thumb = getVideoThumb(exerciseName);
  if (!thumb) return null;

  return (
    <button
      onClick={onClick}
      className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border hover:border-accent transition-all"
    >
      <img src={thumb} alt={exerciseName} className="h-full w-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <span className="text-white text-xs">▶</span>
      </div>
    </button>
  );
}
