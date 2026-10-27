/**
 * ELI5: Calendar math: today in New Mexico, adding days, skipping weekends and holidays.
 * What: ISO-date parsing/formatting, US federal holiday calendar, business-day rolling.
 * Owns: all pure date helpers (no hub state).
 * Depends on: types.ts, constants.ts.
 */
import { OFFICE_TIME_ZONE } from "@/lib/constants";
import type { HolidayCalendar } from "@/lib/types";

const MS_PER_DAY = 1440 * 60 * 1000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DISPLAY_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Today's date (YYYY-MM-DD) in the brokerage's time zone (original `wn`). */
export function todayInDenver(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: OFFICE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Seed-data helper: shift an ISO date by whole days via noon UTC (original `Ho`). */
export function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Strict ISO date parser; throws RangeError on bad input (original `ls`). */
export function parseIsoDate(isoDate: string): Date {
  if (!ISO_DATE_PATTERN.test(isoDate)) {
    throw new RangeError(
      `Expected an ISO calendar date (YYYY-MM-DD); received ${JSON.stringify(isoDate)}.`,
    );
  }
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) {
    throw new RangeError(
      `Expected a valid ISO calendar date; received ${JSON.stringify(isoDate)}.`,
    );
  }
  return date;
}

/** "Mar 4, 2026", or an em dash for null (original `$t`). */
export function formatDate(isoDate: string | null): string {
  return isoDate === null ? "—" : DISPLAY_DATE_FORMAT.format(parseIsoDate(isoDate));
}

/** Whole days from `from` (default today UTC) to `isoDate` (original `oD`). */
export function daysUntil(
  isoDate: string,
  from: string = new Date().toISOString().slice(0, 10),
): number {
  return Math.round(
    (parseIsoDate(isoDate).getTime() - parseIsoDate(from).getTime()) / MS_PER_DAY,
  );
}

/** Add (or subtract) calendar days to an ISO date (original `zc`). */
export function addCalendarDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Saturday or Sunday (original `uD`). */
export function isWeekend(isoDate: string): boolean {
  const weekday = parseIsoDate(isoDate).getUTCDay();
  return weekday === 0 || weekday === 6;
}

/** ISO date for a fixed month/day (original `Hs`). */
function fixedHoliday(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/** nth weekday of a month, e.g. 3rd Monday of January (original `ai`). */
function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number,
): string {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const offset = (weekday - firstOfMonth.getUTCDay() + 7) % 7;
  return fixedHoliday(year, month, 1 + offset + (nth - 1) * 7);
}

/** Last given weekday of a month (original `fD`). */
function lastWeekdayOfMonth(year: number, month: number, weekday: number): string {
  const lastOfMonth = new Date(Date.UTC(year, month, 0));
  const back = (lastOfMonth.getUTCDay() - weekday + 7) % 7;
  return fixedHoliday(year, month, lastOfMonth.getUTCDate() - back);
}

function federalHolidays(year: number): Set<string> {
  return new Set([
    fixedHoliday(year, 1, 1),
    nthWeekdayOfMonth(year, 1, 1, 3),
    nthWeekdayOfMonth(year, 2, 1, 3),
    lastWeekdayOfMonth(year, 5, 1),
    fixedHoliday(year, 6, 19),
    fixedHoliday(year, 7, 4),
    nthWeekdayOfMonth(year, 9, 1, 1),
    nthWeekdayOfMonth(year, 10, 1, 2),
    fixedHoliday(year, 11, 11),
    nthWeekdayOfMonth(year, 11, 4, 4),
    fixedHoliday(year, 12, 25),
  ]);
}

/** Federal holidays plus user overrides (original `cD`). */
export function createHolidayCalendar(overrides: string[] | undefined): HolidayCalendar {
  if (overrides !== undefined && !Array.isArray(overrides)) {
    throw new TypeError("holidayOverrides must be an array of ISO calendar dates.");
  }
  const overrideSet = new Set<string>();
  for (const date of overrides ?? []) {
    parseIsoDate(date);
    overrideSet.add(date);
  }
  return {
    overrides: overrideSet,
    isHoliday(isoDate: string): boolean {
      return (
        overrideSet.has(isoDate) ||
        federalHolidays(parseIsoDate(isoDate).getUTCFullYear()).has(isoDate)
      );
    },
  };
}

/** Roll forward to the next business day (original `q0`). */
export function rollToBusinessDay(isoDate: string, calendar: HolidayCalendar): string {
  let date = isoDate;
  while (isWeekend(date) || calendar.isHoliday(date)) {
    date = addCalendarDays(date, 1);
  }
  return date;
}

/** "today", "tomorrow", "in 5 days", "2 days ago" — relative to today in Denver. */
export function describeDaysFromToday(isoDate: string): string {
  const days = daysUntil(isoDate, todayInDenver());
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 1) return `in ${days} days`;
  return `${Math.abs(days)} day${days === -1 ? "" : "s"} ago`;
}
