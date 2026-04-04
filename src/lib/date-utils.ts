// ── Date Utilities ──

import { appNow } from "./dev-time";

export function todayISO(): string {
  return appNow().toISOString().split("T")[0];
}

export function getMondayOfWeek(date: Date = appNow()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getCurrentWeekNum(programStartDate: string | null): number {
  if (!programStartDate) return 1;
  const start = getMondayOfWeek(new Date(programStartDate));
  const now = getMondayOfWeek();
  const diff = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, diff + 1);
}

export function getDaysSinceDate(dateStr: string): number {
  const date = new Date(dateStr);
  const today = appNow();
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatRelativeDate(dateStr: string): string {
  const days = getDaysSinceDate(dateStr);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  return `${Math.floor(days / 7)} weeks ago`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const locale = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-GB";
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/** Returns true if the programme start date is today or in the past */
export function isProgrammeStarted(programStartDate: string | null): boolean {
  if (!programStartDate) return true; // no date set = treat as started
  const start = new Date(programStartDate);
  start.setHours(0, 0, 0, 0);
  const now = appNow();
  now.setHours(0, 0, 0, 0);
  return now >= start;
}

/** Returns true if a given day index (0=Mon..6=Sun) is in the past for the current calendar week */
export function isDayInPast(dayIdx: number): boolean {
  const now = appNow();
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon..6=Sun
  return dayIdx < todayIdx;
}
