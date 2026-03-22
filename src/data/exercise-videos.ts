// ── Exercise Video Data ──
// Cloudinary-hosted exercise demo clips.
// Videos stored as H.264 MP4 URLs for universal browser playback.

export const CLOUD_NAME = "dp0hnc7cu";

export const EXERCISE_VIDEOS: Record<string, string> = {
  "Pull-Up": "https://res.cloudinary.com/dp0hnc7cu/video/upload/f_mp4,vc_h264/8257C4FE-956E-4098-BA4A-CCB0CA087076_hcb5jy.mp4",
};

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
