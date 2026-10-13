/**
 * Public holidays: BanglaDateToday for Bangladesh (gazette); Nager.Date for other countries.
 * @see https://www.bangladatetoday.com/holidays-bangladesh
 * @see https://date.nager.at/swagger/index.html
 */
import { pushHoliday } from "@/lib/holiday-map";
import type { HolidayCountry, HolidayOnDate } from "@/lib/holiday-types";
import { getBangladeshHolidaysForYear } from "@/services/bangladatetoday-provider";

const NAGER_API = "https://date.nager.at/api/v3";

export type { HolidayCountry, HolidayOnDate } from "@/lib/holiday-types";

export type PublicHoliday = {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  global: boolean;
};

type CacheEntry<T> = { expiresAt: number; data: T };
const countriesCache: { entry: CacheEntry<HolidayCountry[]> | null } = { entry: null };
const holidaysCache = new Map<string, CacheEntry<PublicHoliday[]>>();

const CACHE_MS = 1000 * 60 * 60 * 12;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Holiday API error (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function listAvailableCountries(): Promise<HolidayCountry[]> {
  const now = Date.now();
  if (countriesCache.entry && countriesCache.entry.expiresAt > now) {
    return countriesCache.entry.data;
  }
  const data = await fetchJson<HolidayCountry[]>(`${NAGER_API}/AvailableCountries`);
  const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
  countriesCache.entry = { data: sorted, expiresAt: now + CACHE_MS };
  return sorted;
}

export async function getPublicHolidays(
  year: number,
  countryCode: string
): Promise<PublicHoliday[]> {
  const code = countryCode.toUpperCase();
  const cacheKey = `${year}-${code}`;
  const now = Date.now();
  const cached = holidaysCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.data;

  let data: PublicHoliday[];
  if (code === "BD") {
    const bd = await getBangladeshHolidaysForYear(year);
    data = bd.map((h) => ({
      date: h.date,
      localName: h.localName,
      name: h.name,
      countryCode: "BD",
      global: true,
    }));
  } else {
    data = await fetchJson<PublicHoliday[]>(
      `${NAGER_API}/PublicHolidays/${year}/${code}`
    );
  }
  holidaysCache.set(cacheKey, { data, expiresAt: now + CACHE_MS });
  return data;
}

export {
  parseHolidayCountryCodes,
  serializeHolidayCountryCodes,
} from "@/lib/holiday-codes";

/** Holidays keyed by yyyy-MM-dd for a date range (inclusive). */
export async function getHolidaysByDateInRange(
  fromDateStr: string,
  toDateStr: string,
  countryCodes: string[]
): Promise<Map<string, HolidayOnDate[]>> {
  const map = new Map<string, HolidayOnDate[]>();
  if (countryCodes.length === 0) return map;

  const fromYear = Number(fromDateStr.slice(0, 4));
  const toYear = Number(toDateStr.slice(0, 4));
  const years: number[] = [];
  for (let y = fromYear; y <= toYear; y++) years.push(y);

  for (const code of countryCodes) {
    for (const year of years) {
      let holidays: PublicHoliday[] = [];
      try {
        holidays = await getPublicHolidays(year, code);
      } catch (err) {
        console.error(`[holiday-service] ${code} ${year}:`, err);
      }

      for (const h of holidays) {
        if (h.date < fromDateStr || h.date > toDateStr) continue;
        pushHoliday(map, {
          date: h.date,
          countryCode: h.countryCode,
          name: h.name,
          localName: h.localName,
        });
      }
    }
  }

  return map;
}

/** Prefetch holidays for add-meals mini calendar (prior ±1 year). */
export async function getHolidayRecordForMealPicker(countryCodes: string[]) {
  const year = new Date().getFullYear();
  const from = `${year - 1}-01-01`;
  const to = `${year + 1}-12-31`;
  const map = await getHolidaysByDateInRange(from, to, countryCodes);
  return Object.fromEntries(map);
}

export function attachHolidaysToCalendarDays<T extends { dateStr: string }>(
  days: T[],
  holidaysByDate: Map<string, HolidayOnDate[]>
): (T & { holidays: HolidayOnDate[] })[] {
  return days.map((day) => ({
    ...day,
    holidays: holidaysByDate.get(day.dateStr) ?? [],
  }));
}
