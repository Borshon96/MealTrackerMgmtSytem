import { eachDayOfInterval, format, parseISO, startOfDay } from "date-fns";

/** Store calendar dates as UTC midnight for stable SQLite uniqueness. */
export function toDateOnly(value: string | Date): Date {
  if (typeof value === "string") {
    const d = parseISO(value.length === 10 ? `${value}T00:00:00.000Z` : value);
    return startOfDay(d);
  }
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
}

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, "yyyy-MM-dd");
}

export function formatDisplayDate(value: Date | string): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, "dd MMM yyyy");
}

export function todayInputValue(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Parse yyyy-MM-dd as local calendar date (avoids UTC day shift). */
export function parseCalendarDate(dateStr: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return parseISO(dateStr);
  }
  return parseISO(`${dateStr}T12:00:00`);
}

export function formatCalendarDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** True when the calendar date is strictly before today (local). */
export function isPastCalendarDate(dateStr: string): boolean {
  return dateStr < todayInputValue();
}

export function nowDateTimeLocalValue(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm");
}

export function formatDateTime(value: Date | string): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, "dd/MM/yyyy · h:mm a");
}

export function formatDateShort(value: Date | string): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, "dd/MM/yyyy");
}

/** Inclusive yyyy-MM-dd list for a date range (calendar days, timezone-safe). */
export function datesInRange(startStr: string, endStr: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
    return [];
  }
  if (endStr < startStr) return [];

  // Use noon local time so DST / UTC offsets do not shift the calendar day.
  const start = parseISO(`${startStr}T12:00:00`);
  const end = parseISO(`${endStr}T12:00:00`);
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}
