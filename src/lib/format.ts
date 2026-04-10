// ── Internationalisation Utilities ──
// Centralised formatting for weights, dates, numbers, and currency.
// All stored weights are in kg — imperial is a display concern only.

export type MeasurementSystem = "metric" | "imperial";

// ── Constants ──

const KG_TO_LBS = 2.20462;

export const METRIC_PLATES = [20, 15, 10, 5, 2.5, 1.25]; // kg
export const IMPERIAL_PLATES = [45, 35, 25, 10, 5, 2.5]; // lbs

export const METRIC_KETTLEBELLS = [8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48]; // kg
export const IMPERIAL_KETTLEBELLS = [15, 20, 25, 35, 40, 45, 50, 55, 60, 70, 80]; // lbs

export const METRIC_BARBELL = 20; // kg
export const IMPERIAL_BARBELL = 45; // lbs

// Progression increments per equipment type
const METRIC_INCREMENTS: Record<string, number> = {
  barbell: 2.5,
  dumbbell: 2,
  kettlebell: 4,
  machine: 2.5,
};

const IMPERIAL_INCREMENTS: Record<string, number> = {
  barbell: 5,
  dumbbell: 5,
  kettlebell: 5, // snap-to-next handles actual sizes
  machine: 5,
};

// ── Weight conversion ──

/** Convert stored kg value to display units. */
export function kgToDisplay(kg: number, system: MeasurementSystem): number {
  if (system === "imperial") return roundToHalf(kg * KG_TO_LBS);
  return kg;
}

/** Convert user-entered display value back to kg for storage. */
export function displayToKg(display: number, system: MeasurementSystem): number {
  if (system === "imperial") return display / KG_TO_LBS;
  return display;
}

/** Format a weight (stored in kg) for display with unit suffix. */
export function formatWeight(kg: number, system: MeasurementSystem): string {
  const val = kgToDisplay(kg, system);
  return `${cleanNumber(val)}${weightUnit(system)}`;
}

/** The unit label for the current system. */
export function weightUnit(system: MeasurementSystem): string {
  return system === "imperial" ? "lbs" : "kg";
}

/** The per-side unit label (for unilateral exercises). */
export function weightUnitPerSide(system: MeasurementSystem): string {
  return system === "imperial" ? "lbs/side" : "kg/side";
}

// ── Increments ──

/** Get the weight increment for an equipment type. Returns value in display units. */
export function getIncrementForEquip(equipType: string, system: MeasurementSystem): number {
  const table = system === "imperial" ? IMPERIAL_INCREMENTS : METRIC_INCREMENTS;
  return table[equipType] ?? table.barbell;
}

/** Snap a display-unit weight to the nearest standard kettlebell size. */
export function nearestKettlebell(displayWeight: number, system: MeasurementSystem): number {
  const bells = system === "imperial" ? IMPERIAL_KETTLEBELLS : METRIC_KETTLEBELLS;
  return bells.reduce((closest, kb) =>
    Math.abs(kb - displayWeight) < Math.abs(closest - displayWeight) ? kb : closest,
    bells[0],
  );
}

// ── Plate calculator ──

/** Calculate plates per side for a target weight (in display units). */
export function calculatePlatesForSystem(
  targetWeight: number,
  system: MeasurementSystem,
  customBarWeight?: number,
): { plate: number; count: number }[] {
  const barWeight = customBarWeight ?? (system === "imperial" ? IMPERIAL_BARBELL : METRIC_BARBELL);
  const available = system === "imperial" ? IMPERIAL_PLATES : METRIC_PLATES;
  let remaining = (targetWeight - barWeight) / 2;

  if (remaining <= 0) return [];

  const plates: { plate: number; count: number }[] = [];
  for (const plate of available) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate);
      plates.push({ plate, count });
      remaining -= plate * count;
    }
  }
  return plates;
}

// ── Date formatting ──

/** Detect the user's locale from the browser, with SSR fallback. */
export function detectLocale(): string {
  if (typeof navigator !== "undefined" && navigator.language) return navigator.language;
  return "en-GB";
}

/** Short date: "29 Mar" (en-GB) or "Mar 29" (en-US). */
export function formatDateShortLocale(dateStr: string, locale?: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale ?? detectLocale(), { day: "numeric", month: "short" });
}

/** Long date: "Sunday, 29 March" or locale equivalent. */
export function formatDateLong(dateStr: string, locale?: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(locale ?? detectLocale(), { weekday: "long", day: "numeric", month: "long" });
}

/** Weekday + short date: "Sun, 29 Mar". */
export function formatWeekdayShort(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale ?? detectLocale(), { weekday: "short", day: "numeric", month: "short" });
}

/** Date with year: "29 Mar 2026" or locale equivalent. */
export function formatDateWithYear(dateStr: string, locale?: string): string {
  return new Date(dateStr).toLocaleDateString(locale ?? detectLocale(), { day: "numeric", month: "short", year: "numeric" });
}

// ── Number formatting ──

/** Format a number with locale-appropriate decimal separators. */
export function formatNumber(n: number, locale?: string): string {
  return new Intl.NumberFormat(locale ?? detectLocale()).format(n);
}

// ── Currency ──

/** Supported currencies with their Stripe env var suffixes. */
export const SUPPORTED_CURRENCIES = ["GBP", "USD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Price table — amounts in minor display (e.g. 29.99, 300). */
export const PRICE_TABLE: Record<SupportedCurrency, { monthly: number; yearly: number }> = {
  GBP: { monthly: 29.99, yearly: 300 },
  USD: { monthly: 34.99, yearly: 349 },
};

/** Format a currency amount. E.g. "£29.99" or "$34.99". */
export function formatCurrency(amount: number, currency: SupportedCurrency, locale?: string): string {
  return new Intl.NumberFormat(locale ?? detectLocale(), {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Detect currency from browser locale. */
export function detectCurrency(locale?: string): SupportedCurrency {
  const l = locale ?? detectLocale();
  if (l.startsWith("en-US") || l === "en") return "USD";
  // Default to GBP for en-GB and everything else for now
  return "GBP";
}

/** Get the equivalent monthly price for yearly plans. */
export function yearlyPerMonth(currency: SupportedCurrency): number {
  return Math.round(PRICE_TABLE[currency].yearly / 12);
}

/** Get the savings percentage for yearly vs monthly. */
export function yearlySavingsPercent(currency: SupportedCurrency): number {
  const prices = PRICE_TABLE[currency];
  return Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100);
}

// ── AI prompt helpers ──

/** Load rules string for the AI system prompt, in the user's unit system. */
export function loadRulesForSystem(system: MeasurementSystem): string {
  if (system === "imperial") {
    return "Barbells go up in 5lbs. Dumbbells go up in 5lbs (10, 15, 20, 25, 30...). Kettlebells use standard sizes (15, 20, 25, 35, 40, 45, 50, 55, 60, 70 lbs). Machines go up in 5lbs. All load suggestions must use lbs.";
  }
  return "Barbells go up in 2.5kg. Dumbbells go up in 2kg (6, 8, 10, 12, 14...). Kettlebells go up in 4kg (8, 12, 16, 20...). Machines go up in 2.5kg. All load suggestions must use kg.";
}

// ── Internal helpers ──

/** Round to nearest 0.5 for clean display. */
function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/** Remove trailing .0 for clean display. */
function cleanNumber(n: number): string {
  return n % 1 === 0 ? String(n) : String(n);
}
