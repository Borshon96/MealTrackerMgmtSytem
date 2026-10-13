import { getDay, type Day } from "date-fns";
import { parseCalendarDate } from "@/lib/dates";

/** Bangladesh-style calendar grid: week rows start on Saturday. */
export const CALENDAR_WEEK_STARTS_ON = 6 satisfies Day;

export const CALENDAR_WEEKDAY_HEADERS = [
  "Sa",
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
] as const;

/** Friday and Saturday (date-fns: 0 = Sunday … 5 = Friday, 6 = Saturday). */
export function isWeekendDay(date: Date): boolean {
  const dow = getDay(date);
  return dow === 5 || dow === 6;
}

export function isWeekendDateStr(dateStr: string): boolean {
  return isWeekendDay(parseCalendarDate(dateStr));
}

/** Column index in a Saturday-start grid (0 = Sat, 6 = Fri). */
export function isWeekendGridColumn(columnIndex: number): boolean {
  return columnIndex === 0 || columnIndex === 6;
}
