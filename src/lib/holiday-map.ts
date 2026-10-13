import type { HolidayOnDate } from "@/lib/holiday-types";

export function pushHoliday(
  map: Map<string, HolidayOnDate[]>,
  holiday: HolidayOnDate
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(holiday.date)) return;
  const list = map.get(holiday.date) ?? [];
  const duplicate = list.some(
    (x) =>
      x.countryCode === holiday.countryCode &&
      (x.name === holiday.name ||
        x.localName === holiday.localName ||
        x.name === holiday.localName)
  );
  if (!duplicate) list.push(holiday);
  map.set(holiday.date, list);
}

export function holidaysMapToRecord(
  map: Map<string, HolidayOnDate[]>
): Record<string, HolidayOnDate[]> {
  return Object.fromEntries(map);
}
