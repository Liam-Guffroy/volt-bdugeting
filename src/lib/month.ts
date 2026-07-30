/**
 * Month keys — "YYYY-MM" strings used to file one-time expenses and to drive
 * the ?month= URL param.
 *
 * Deliberately a plain string rather than a Date: month arithmetic here is
 * integer math, so nothing can drift across a timezone boundary and land in
 * the wrong month.
 */

export type MonthKey = string;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && MONTH_RE.test(value);
}

export function currentMonth(now: Date = new Date()): MonthKey {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Coerce untrusted input (a URL param) to a valid month, falling back to now. */
export function toMonth(value: unknown): MonthKey {
  return isMonthKey(value) ? value : currentMonth();
}

/** Shift by whole months, rolling the year over as needed. */
export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const [year, mon] = month.split("-").map(Number);
  const total = year * 12 + (mon - 1) + delta;
  const y = Math.floor(total / 12);
  const m = total - y * 12 + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

// timeZone: "UTC" pairs with the Date.UTC below — without it a negative local
// offset would render the previous month.
const monthFormat = new Intl.DateTimeFormat("nl-BE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-07" -> "Juli 2026" */
export function formatMonth(month: MonthKey): string {
  const [year, mon] = month.split("-").map(Number);
  const label = monthFormat.format(new Date(Date.UTC(year, mon - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
