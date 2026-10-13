/** Client-safe helpers (no external API). */

export function parseHolidayCountryCodes(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(/[,;\s]+/)
        .map((c) => c.trim().toUpperCase())
        .filter((c) => /^[A-Z]{2}$/.test(c))
    ),
  ];
}

export function serializeHolidayCountryCodes(codes: string[]): string {
  return [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))].join(",");
}

export function defaultHolidayCountryCodes(): string[] {
  return parseHolidayCountryCodes("BD");
}
