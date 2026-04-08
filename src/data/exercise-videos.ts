// ── Exercise Video Data ──
// Cloudinary-hosted exercise demo clips.
// Source of truth: Supabase `exercise_videos` table, managed via Kine Tools.
// We keep a synchronous in-memory cache so call sites don't need to be async.
// Call `loadExerciseVideos()` once on app mount (see AppLayout) to populate it.

import { supabase } from "@/lib/supabase";

export const CLOUD_NAME = "dp0hnc7cu";

// Module-level cache. Mutated after Supabase load completes.
let EXERCISE_VIDEOS: Record<string, string> = {};
let loaded = false;
let loadingPromise: Promise<void> | null = null;

// ── Subscribers (so React components re-render when the cache lands) ──
const subscribers = new Set<() => void>();
function notify() { subscribers.forEach((fn) => fn()); }

export function subscribeVideos(fn: () => void): () => void {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}

export function getVideosSnapshot(): boolean {
  return loaded;
}

/**
 * Fetch all video rows from Supabase and populate the in-memory cache.
 * Safe to call multiple times — will only hit the network once per session.
 */
export function loadExerciseVideos(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("exercise_videos")
        .select("exercise_name, cloudinary_url")
        .not("cloudinary_url", "is", null);
      if (error) throw error;
      const next: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.cloudinary_url) next[row.exercise_name] = row.cloudinary_url;
      }
      EXERCISE_VIDEOS = next;
      loaded = true;
      notify();
    } catch (e) {
      console.warn("[exercise-videos] load failed", e);
    } finally {
      loadingPromise = null;
    }
  })();
  return loadingPromise;
}

/**
 * Get a 200×200 still-frame thumbnail from a Cloudinary video URL.
 */
export function getVideoThumb(exerciseName: string): string | null {
  const url = EXERCISE_VIDEOS[exerciseName];
  if (!url) return null;
  return url
    .replace(/\/upload\/[^/]*\//, "/upload/so_3,w_200,h_200,c_fill,q_auto/")
    .replace(/\.\w+$/, ".jpg");
}

/**
 * Get the full video URL for an exercise.
 */
export function getVideoUrl(exerciseName: string): string | null {
  return EXERCISE_VIDEOS[exerciseName] || null;
}

/**
 * Check if an exercise has a video.
 */
export function hasVideo(exerciseName: string): boolean {
  return exerciseName in EXERCISE_VIDEOS;
}
