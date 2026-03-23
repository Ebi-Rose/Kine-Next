// @ts-nocheck
// ── Exercise Illustrations ──
// SVG line-art + placeholder AI-generated thumbnails for prototype comparison
// Toggle style: window.__illustStyle = 'svg' | 'img' (default: 'svg')

// ── Inline SVG illustrations (36×36 viewBox, monochrome line-art) ──
// Style: minimal stick-figure showing the movement, rose-muted tones

const S = (d, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none" stroke="#9a7a80" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const EXERCISE_SVG = {
  // ── SQUAT PATTERN ──
  'Barbell Back Squat': S(`
    <line x1="8" y1="10" x2="28" y2="10" stroke-width="2"/>
    <circle cx="18" cy="12" r="2.5"/>
    <line x1="18" y1="14.5" x2="18" y2="22"/>
    <line x1="18" y1="16" x2="13" y2="12"/>
    <line x1="18" y1="16" x2="23" y2="12"/>
    <line x1="18" y1="22" x2="13" y2="28"/>
    <line x1="18" y1="22" x2="23" y2="28"/>
    <line x1="13" y1="28" x2="11" y2="32"/>
    <line x1="23" y1="28" x2="25" y2="32"/>
  `),
  'Front Squat': S(`
    <line x1="8" y1="11" x2="28" y2="11" stroke-width="2"/>
    <circle cx="18" cy="13" r="2.5"/>
    <line x1="18" y1="15.5" x2="18" y2="22"/>
    <line x1="18" y1="17" x2="14" y2="13"/>
    <line x1="18" y1="17" x2="22" y2="13"/>
    <line x1="18" y1="22" x2="13" y2="28"/>
    <line x1="18" y1="22" x2="23" y2="28"/>
    <line x1="13" y1="28" x2="11" y2="32"/>
    <line x1="23" y1="28" x2="25" y2="32"/>
  `),
  'Goblet Squat': S(`
    <circle cx="18" cy="11" r="2.5"/>
    <line x1="18" y1="13.5" x2="18" y2="22"/>
    <line x1="18" y1="17" x2="15" y2="15"/>
    <line x1="15" y1="15" x2="16" y2="18"/>
    <line x1="18" y1="17" x2="21" y2="15"/>
    <line x1="21" y1="15" x2="20" y2="18"/>
    <rect x="15" y="14" width="6" height="4" rx="1" fill="none"/>
    <line x1="18" y1="22" x2="13" y2="28"/>
    <line x1="18" y1="22" x2="23" y2="28"/>
    <line x1="13" y1="28" x2="11" y2="32"/>
    <line x1="23" y1="28" x2="25" y2="32"/>
  `),

  // ── HINGE PATTERN ──
  'Conventional Deadlift': S(`
    <circle cx="18" cy="8" r="2.5"/>
    <line x1="18" y1="10.5" x2="18" y2="20"/>
    <line x1="18" y1="14" x2="14" y2="18"/>
    <line x1="18" y1="14" x2="22" y2="18"/>
    <line x1="14" y1="18" x2="14" y2="24"/>
    <line x1="22" y1="18" x2="22" y2="24"/>
    <line x1="18" y1="20" x2="14" y2="27"/>
    <line x1="18" y1="20" x2="22" y2="27"/>
    <line x1="14" y1="27" x2="14" y2="32"/>
    <line x1="22" y1="27" x2="22" y2="32"/>
    <line x1="10" y1="24" x2="26" y2="24" stroke-width="2"/>
  `),
  'Romanian Deadlift': S(`
    <circle cx="16" cy="10" r="2.5"/>
    <path d="M16 12.5 Q16 18 20 22"/>
    <line x1="16" y1="15" x2="12" y2="20"/>
    <line x1="16" y1="15" x2="20" y2="20"/>
    <line x1="12" y1="20" x2="12" y2="25"/>
    <line x1="20" y1="20" x2="20" y2="25"/>
    <line x1="20" y1="22" x2="20" y2="32"/>
    <line x1="20" y1="22" x2="24" y2="32"/>
    <line x1="8" y1="25" x2="24" y2="25" stroke-width="2"/>
  `),
  'Hip Thrust': S(`
    <rect x="4" y="16" width="8" height="10" rx="2" fill="none" stroke-width="1"/>
    <circle cx="20" cy="14" r="2.5"/>
    <path d="M12 20 L18 16 Q20 12 20 16"/>
    <line x1="18" y1="16" x2="24" y2="20"/>
    <line x1="24" y1="20" x2="24" y2="26"/>
    <line x1="24" y1="26" x2="20" y2="32"/>
    <line x1="18" y1="16" x2="16" y2="20"/>
    <line x1="16" y1="20" x2="14" y2="26"/>
    <line x1="14" y1="26" x2="12" y2="32"/>
  `),

  // ── PUSH PATTERN ──
  'Barbell Bench Press': S(`
    <line x1="6" y1="26" x2="6" y2="14"/>
    <line x1="30" y1="26" x2="30" y2="14"/>
    <rect x="4" y="26" width="28" height="3" rx="1" fill="none" stroke-width="0.8"/>
    <circle cx="18" cy="23" r="2"/>
    <line x1="18" y1="25" x2="18" y2="21" stroke-width="0.8"/>
    <path d="M10 23 L18 21 L26 23" stroke-width="0.8"/>
    <line x1="6" y1="14" x2="30" y2="14" stroke-width="2.5"/>
    <circle cx="4" cy="14" r="2" fill="#9a7a80" stroke="none"/>
    <circle cx="32" cy="14" r="2" fill="#9a7a80" stroke="none"/>
    <line x1="10" y1="18" x2="10" y2="14"/>
    <line x1="26" y1="18" x2="26" y2="14"/>
  `),
  'Overhead Press': S(`
    <circle cx="18" cy="16" r="2.5"/>
    <line x1="18" y1="18.5" x2="18" y2="28"/>
    <line x1="18" y1="28" x2="14" y2="33"/>
    <line x1="18" y1="28" x2="22" y2="33"/>
    <line x1="18" y1="21" x2="12" y2="10"/>
    <line x1="18" y1="21" x2="24" y2="10"/>
    <line x1="8" y1="10" x2="28" y2="10" stroke-width="2.5"/>
    <circle cx="7" cy="10" r="1.5" fill="#9a7a80" stroke="none"/>
    <circle cx="29" cy="10" r="1.5" fill="#9a7a80" stroke="none"/>
  `),
  'Push-Up': S(`
    <circle cx="8" cy="20" r="2"/>
    <line x1="10" y1="20" x2="28" y2="22"/>
    <line x1="8" y1="22" x2="8" y2="28"/>
    <line x1="28" y1="22" x2="28" y2="28"/>
    <line x1="28" y1="28" x2="30" y2="32"/>
    <line x1="28" y1="28" x2="26" y2="32"/>
  `),

  // ── PULL PATTERN ──
  'Pull-Up': S(`
    <line x1="6" y1="4" x2="30" y2="4" stroke-width="2.5"/>
    <line x1="13" y1="4" x2="13" y2="8"/>
    <line x1="23" y1="4" x2="23" y2="8"/>
    <circle cx="18" cy="11" r="2.5"/>
    <line x1="18" y1="13.5" x2="18" y2="23"/>
    <line x1="18" y1="16" x2="13" y2="8"/>
    <line x1="18" y1="16" x2="23" y2="8"/>
    <line x1="18" y1="23" x2="15" y2="32"/>
    <line x1="18" y1="23" x2="21" y2="32"/>
  `),
  'Barbell Row': S(`
    <circle cx="14" cy="10" r="2.5"/>
    <path d="M14 12.5 Q16 18 22 22" stroke-width="1.4"/>
    <line x1="14" y1="15" x2="10" y2="22"/>
    <line x1="14" y1="15" x2="18" y2="22"/>
    <line x1="22" y1="22" x2="22" y2="32"/>
    <line x1="22" y1="22" x2="26" y2="32"/>
    <line x1="6" y1="26" x2="22" y2="26" stroke-width="2"/>
    <circle cx="5" cy="26" r="1.5" fill="#9a7a80" stroke="none"/>
    <circle cx="23" cy="26" r="1.5" fill="#9a7a80" stroke="none"/>
  `),
  'Lat Pulldown': S(`
    <line x1="6" y1="4" x2="30" y2="4" stroke-width="2"/>
    <line x1="18" y1="4" x2="18" y2="8"/>
    <circle cx="18" cy="14" r="2.5"/>
    <line x1="18" y1="16.5" x2="18" y2="26"/>
    <line x1="18" y1="19" x2="12" y2="10"/>
    <line x1="18" y1="19" x2="24" y2="10"/>
    <line x1="12" y1="10" x2="12" y2="6"/>
    <line x1="24" y1="10" x2="24" y2="6"/>
    <rect x="12" y="26" width="12" height="3" rx="1" fill="none" stroke-width="0.8"/>
  `),

  // ── CORE PATTERN ──
  'Plank': S(`
    <circle cx="8" cy="18" r="2"/>
    <line x1="10" y1="18" x2="28" y2="20"/>
    <line x1="8" y1="20" x2="8" y2="26"/>
    <line x1="28" y1="20" x2="28" y2="26"/>
  `),
  'Dead Bug': S(`
    <circle cx="10" cy="22" r="2"/>
    <line x1="10" y1="22" x2="26" y2="22"/>
    <line x1="12" y1="22" x2="8" y2="14"/>
    <line x1="24" y1="22" x2="28" y2="14"/>
    <line x1="16" y1="22" x2="12" y2="30"/>
    <line x1="22" y1="22" x2="26" y2="30"/>
  `),

  // ── WARMUP / MOBILITY ──
  'Cat-cow': S(`
    <path d="M8 20 Q18 12 28 20" stroke-width="1.6"/>
    <line x1="8" y1="20" x2="8" y2="28"/>
    <line x1="28" y1="20" x2="28" y2="28"/>
    <circle cx="6" cy="18" r="1.5"/>
    <path d="M8 26 Q18 34 28 26" stroke-dasharray="2 2" opacity="0.5"/>
  `),
  'Glute bridges': S(`
    <line x1="6" y1="28" x2="14" y2="28"/>
    <path d="M14 28 Q18 16 22 22"/>
    <line x1="22" y1="22" x2="28" y2="28"/>
    <line x1="28" y1="28" x2="30" y2="32"/>
    <circle cx="24" cy="20" r="2"/>
  `),
  'Glute Bridge': S(`
    <line x1="6" y1="28" x2="14" y2="28"/>
    <path d="M14 28 Q18 16 22 22"/>
    <line x1="22" y1="22" x2="28" y2="28"/>
    <line x1="28" y1="28" x2="30" y2="32"/>
    <circle cx="24" cy="20" r="2"/>
  `),
  'Hip circles': S(`
    <circle cx="18" cy="14" r="2.5"/>
    <line x1="18" y1="16.5" x2="18" y2="24"/>
    <line x1="18" y1="24" x2="14" y2="32"/>
    <line x1="18" y1="24" x2="22" y2="32"/>
    <ellipse cx="18" cy="24" rx="5" ry="3" stroke-dasharray="2 2" opacity="0.5"/>
  `),
  'Leg swings': S(`
    <circle cx="14" cy="10" r="2.5"/>
    <line x1="14" y1="12.5" x2="14" y2="22"/>
    <line x1="14" y1="22" x2="14" y2="32"/>
    <line x1="14" y1="22" x2="22" y2="28"/>
    <path d="M22 28 Q26 24 22 18" stroke-dasharray="2 2" opacity="0.5"/>
    <line x1="14" y1="16" x2="10" y2="20"/>
    <line x1="14" y1="16" x2="18" y2="20"/>
  `),
  'Band pull-aparts': S(`
    <circle cx="18" cy="10" r="2.5"/>
    <line x1="18" y1="12.5" x2="18" y2="24"/>
    <line x1="18" y1="24" x2="14" y2="32"/>
    <line x1="18" y1="24" x2="22" y2="32"/>
    <line x1="18" y1="16" x2="8" y2="16"/>
    <line x1="18" y1="16" x2="28" y2="16"/>
    <line x1="8" y1="16" x2="28" y2="16" stroke-dasharray="2 2" stroke="#c49098" opacity="0.6"/>
  `),
  'Dead hangs': S(`
    <line x1="8" y1="4" x2="28" y2="4" stroke-width="2.5"/>
    <line x1="14" y1="4" x2="14" y2="10"/>
    <line x1="22" y1="4" x2="22" y2="10"/>
    <circle cx="18" cy="13" r="2.5"/>
    <line x1="18" y1="15.5" x2="18" y2="25"/>
    <line x1="18" y1="18" x2="14" y2="10"/>
    <line x1="18" y1="18" x2="22" y2="10"/>
    <line x1="18" y1="25" x2="16" y2="33"/>
    <line x1="18" y1="25" x2="20" y2="33"/>
  `),
  'Bodyweight squats': S(`
    <circle cx="18" cy="10" r="2.5"/>
    <line x1="18" y1="12.5" x2="18" y2="22"/>
    <line x1="18" y1="16" x2="14" y2="20"/>
    <line x1="18" y1="16" x2="22" y2="20"/>
    <line x1="18" y1="22" x2="13" y2="28"/>
    <line x1="18" y1="22" x2="23" y2="28"/>
    <line x1="13" y1="28" x2="11" y2="32"/>
    <line x1="23" y1="28" x2="25" y2="32"/>
  `),
  'Bird dog': S(`
    <circle cx="10" cy="16" r="2"/>
    <line x1="10" y1="18" x2="26" y2="18"/>
    <line x1="10" y1="18" x2="10" y2="26"/>
    <line x1="26" y1="18" x2="26" y2="26"/>
    <line x1="10" y1="18" x2="4" y2="12" stroke="#c49098"/>
    <line x1="26" y1="18" x2="32" y2="24" stroke="#c49098"/>
  `),
  'Dead bug': S(`
    <circle cx="10" cy="22" r="2"/>
    <line x1="10" y1="22" x2="26" y2="22"/>
    <line x1="12" y1="22" x2="8" y2="14"/>
    <line x1="24" y1="22" x2="28" y2="14"/>
    <line x1="16" y1="22" x2="12" y2="30"/>
    <line x1="22" y1="22" x2="26" y2="30"/>
  `),
};

// ── Placeholder AI-generated illustrations (data-URI silhouettes) ──
// Replace these with real Cloudinary URLs from AI generation later
// For now, using simple canvas-generated silhouettes as placeholders

function placeholderImg(label) {
  // Returns a tiny data-uri SVG that mimics an AI-generated illustration style
  // (rounded, filled silhouette instead of line-art)
  const fills = {
    squat:  '#3d2830',
    hinge:  '#2d3028',
    push:   '#302830',
    pull:   '#283038',
    core:   '#2d2830',
    warmup: '#282d30',
  };
  const bg = fills[label] || '#2d2830';
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect width="36" height="36" rx="8" fill="${bg}"/><text x="18" y="21" text-anchor="middle" font-size="8" fill="#9a7a80" font-family="sans-serif">${label}</text></svg>`)}`;
}

export const EXERCISE_IMG = {
  'Barbell Back Squat':   placeholderImg('squat'),
  'Front Squat':          placeholderImg('squat'),
  'Goblet Squat':         placeholderImg('squat'),
  'Conventional Deadlift': placeholderImg('hinge'),
  'Romanian Deadlift':    placeholderImg('hinge'),
  'Hip Thrust':           placeholderImg('hinge'),
  'Barbell Bench Press':  placeholderImg('push'),
  'Overhead Press':       placeholderImg('push'),
  'Push-Up':              placeholderImg('push'),
  'Pull-Up':              placeholderImg('pull'),
  'Barbell Row':          placeholderImg('pull'),
  'Lat Pulldown':         placeholderImg('pull'),
  'Plank':                placeholderImg('core'),
  'Dead Bug':             placeholderImg('core'),
};

// ── Fallback icons by muscle/movement group ──
export const EXERCISE_FALLBACK_SVG = {
  legs: S(`
    <circle cx="18" cy="8" r="2.5"/>
    <line x1="18" y1="10.5" x2="18" y2="20"/>
    <line x1="18" y1="20" x2="13" y2="28"/>
    <line x1="18" y1="20" x2="23" y2="28"/>
    <line x1="13" y1="28" x2="11" y2="33"/>
    <line x1="23" y1="28" x2="25" y2="33"/>
  `),
  hinge: S(`
    <circle cx="14" cy="8" r="2.5"/>
    <path d="M14 10.5 Q16 16 22 20"/>
    <line x1="22" y1="20" x2="22" y2="32"/>
    <line x1="22" y1="20" x2="26" y2="32"/>
    <line x1="8" y1="24" x2="24" y2="24" stroke-width="1.8"/>
  `),
  push: S(`
    <circle cx="18" cy="12" r="2.5"/>
    <line x1="18" y1="14.5" x2="18" y2="24"/>
    <line x1="18" y1="18" x2="12" y2="10"/>
    <line x1="18" y1="18" x2="24" y2="10"/>
    <line x1="18" y1="24" x2="14" y2="32"/>
    <line x1="18" y1="24" x2="22" y2="32"/>
  `),
  pull: S(`
    <line x1="8" y1="4" x2="28" y2="4" stroke-width="2"/>
    <circle cx="18" cy="10" r="2.5"/>
    <line x1="18" y1="12.5" x2="18" y2="22"/>
    <line x1="18" y1="16" x2="13" y2="6"/>
    <line x1="18" y1="16" x2="23" y2="6"/>
    <line x1="18" y1="22" x2="15" y2="30"/>
    <line x1="18" y1="22" x2="21" y2="30"/>
  `),
  core: S(`
    <circle cx="8" cy="18" r="2"/>
    <line x1="10" y1="18" x2="28" y2="20"/>
    <line x1="8" y1="20" x2="8" y2="26"/>
    <line x1="28" y1="20" x2="28" y2="26"/>
  `),
  cardio: S(`
    <circle cx="16" cy="8" r="2.5"/>
    <line x1="16" y1="10.5" x2="16" y2="20"/>
    <line x1="16" y1="14" x2="12" y2="18"/>
    <line x1="16" y1="14" x2="22" y2="12"/>
    <line x1="16" y1="20" x2="10" y2="30"/>
    <line x1="16" y1="20" x2="22" y2="28"/>
    <line x1="22" y1="28" x2="22" y2="32"/>
  `),
};

// ── Lookup function ──
// Returns { svg, img } for a given exercise name, falling back to muscle group icon
import { EXERCISE_LIBRARY } from './exercise-library';

export function getExerciseIllustration(name) {
  const style = window.__illustStyle || 'svg';

  if (style === 'img' && EXERCISE_IMG[name]) {
    return { type: 'img', src: EXERCISE_IMG[name] };
  }

  if (EXERCISE_SVG[name]) {
    return { type: 'svg', src: EXERCISE_SVG[name] };
  }

  // Fallback: look up muscle group from library
  const entry = EXERCISE_LIBRARY.find(e => e.name === name);
  const muscle = entry?.muscle || 'core';
  const fallback = EXERCISE_FALLBACK_SVG[muscle] || EXERCISE_FALLBACK_SVG.core;
  return { type: 'svg', src: fallback };
}

// Render helper - returns an HTML string for the thumbnail
export function renderExerciseIllustration(name) {
  const illust = getExerciseIllustration(name);
  if (illust.type === 'img') {
    return `<img class="exercise-illus" src="${illust.src}" alt="" />`;
  }
  return `<div class="exercise-illus">${illust.src}</div>`;
}
