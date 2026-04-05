/**
 * Dev time override — lets the dev panel fast-forward the app's notion of "now".
 *
 * Every piece of business logic that needs the current date/time should call
 * `appNow()` or `appTimestamp()` instead of `new Date()` or `Date.now()`.
 *
 * Technical plumbing (sync conflict timestamps, animation timers, unique IDs)
 * should keep using native Date/Date.now since those must reflect real time.
 */

const STORAGE_KEY = "kine_dev_date";

let _override: Date | null = null;
let _hydrated = false;

/** Restore override from localStorage on first access */
function hydrate() {
  if (_hydrated) return;
  _hydrated = true;
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const d = new Date(stored);
      if (!isNaN(d.getTime())) _override = d;
    }
  } catch {}
}

/** Set (or clear) the dev date override. Pass null to return to real time. */
export function setDevDateOverride(date: Date | null) {
  _override = date ? new Date(date.getTime()) : null;
  if (typeof window !== "undefined") {
    try {
      if (date) {
        localStorage.setItem(STORAGE_KEY, date.toISOString());
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }
}

/** Read the current override (null = real time). */
export function getDevDateOverride(): Date | null {
  hydrate();
  return _override ? new Date(_override.getTime()) : null;
}

/** Current date/time, respecting the dev override. Use instead of `new Date()`. */
export function appNow(): Date {
  hydrate();
  return _override ? new Date(_override.getTime()) : new Date();
}

/** Current epoch ms, respecting the dev override. Use instead of `Date.now()`. */
export function appTimestamp(): number {
  return _override ? _override.getTime() : Date.now();
}

/** Today's date as YYYY-MM-DD, respecting the dev override. */
export function appTodayISO(): string {
  return appNow().toISOString().split("T")[0];
}
