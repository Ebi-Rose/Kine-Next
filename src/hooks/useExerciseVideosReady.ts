"use client";

import { useSyncExternalStore } from "react";
import { subscribeVideos, getVideosSnapshot } from "@/data/exercise-videos";

/**
 * Returns true once the Supabase exercise_videos cache has finished loading.
 * Any component that calls hasVideo / getVideoUrl / getVideoThumb should
 * read this hook too so it re-renders when the cache lands.
 */
export function useExerciseVideosReady(): boolean {
  return useSyncExternalStore(
    subscribeVideos,
    getVideosSnapshot,
    () => false, // server snapshot
  );
}
