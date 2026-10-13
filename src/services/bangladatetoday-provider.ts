/**
 * Bangladesh public holidays from BanglaDateToday (government gazette).
 * @see https://www.bangladatetoday.com/holidays-bangladesh
 * @see https://www.bangladatetoday.com/bangla-date-api
 */
import type { HolidayOnDate } from "@/lib/holiday-types";

const ICAL_HOLIDAYS_URL =
  "https://www.bangladatetoday.com/api/ical/holidays-bd.ics";
const CONVERT_API_URL = "https://www.bangladatetoday.com/api/convert";

const CACHE_MS = 1000 * 60 * 60 * 24;

type CacheEntry = { expiresAt: number; holidays: HolidayOnDate[] };
let icalCache: CacheEntry | null = null;

type IcalEvent = { date: string; name: string };

/** Unfold iCalendar lines (RFC 5545). */
function unfoldIcal(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];
  for (const line of raw) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      if (lines.length) lines[lines.length - 1] += line.slice(1);
    } else if (line.trim()) {
      lines.push(line);
    }
  }
  return lines;
}

function parseIcalDateValue(value: string): string | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function parseBangladeshHolidaysIcal(ics: string): IcalEvent[] {
  const events: IcalEvent[] = [];
  let inEvent = false;
  let date: string | null = null;
  let name: string | null = null;

  for (const line of unfoldIcal(ics)) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      date = null;
      name = null;
      continue;
    }
    if (line === "END:VEVENT") {
      if (inEvent && date && name) events.push({ date, name });
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    if (line.startsWith("DTSTART")) {
      const value = line.split(":").pop() ?? "";
      date = parseIcalDateValue(value);
    } else if (line.startsWith("SUMMARY:")) {
      name = line.slice("SUMMARY:".length).trim();
    }
  }

  return events;
}

async function fetchIcalHolidays(): Promise<HolidayOnDate[]> {
  const now = Date.now();
  if (icalCache && icalCache.expiresAt > now) return icalCache.holidays;

  const res = await fetch(ICAL_HOLIDAYS_URL, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(`BanglaDateToday iCal error (${res.status})`);
  }
  const ics = await res.text();
  const holidays = parseBangladeshHolidaysIcal(ics).map((e) => ({
    date: e.date,
    countryCode: "BD",
    name: e.name,
    localName: e.name,
  }));

  icalCache = { holidays, expiresAt: now + CACHE_MS };
  return holidays;
}

export async function getBangladeshHolidaysForYear(
  year: number
): Promise<HolidayOnDate[]> {
  const all = await fetchIcalHolidays();
  const prefix = `${year}-`;
  return all.filter((h) => h.date.startsWith(prefix));
}

type ConvertHoliday = {
  name?: { en?: string; bn?: string };
};

type ConvertResponse = {
  date: string;
  holidays?: ConvertHoliday[];
};

/** Single-date lookup via /api/convert (same gazette data). */
export async function getBangladeshHolidaysForDate(
  dateStr: string
): Promise<HolidayOnDate[]> {
  const res = await fetch(`${CONVERT_API_URL}?date=${dateStr}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(`BanglaDateToday convert error (${res.status})`);
  }
  const data = (await res.json()) as ConvertResponse;
  const list = data.holidays ?? [];
  return list.map((h) => {
    const en = h.name?.en ?? "Holiday";
    const bn = h.name?.bn ?? en;
    return {
      date: dateStr,
      countryCode: "BD",
      name: en,
      localName: bn,
    };
  });
}
