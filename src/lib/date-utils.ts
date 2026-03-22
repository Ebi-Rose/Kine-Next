// ── Date Utilities ──

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMondayOfWeek(date: Date = new Date()): Date {
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
  const today = new Date();
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
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
