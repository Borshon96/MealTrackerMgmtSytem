import type { HolidayOnDate } from "@/services/holiday-service";

export function HolidayStrip({ holidays }: { holidays: HolidayOnDate[] }) {
  if (!holidays.length) return null;

  return (
    <div
      className="border-b border-amber-200/90 bg-amber-50 px-2 py-1 text-[10px] leading-snug text-amber-950"
      title={holidays
        .map((h) => `${h.countryCode}: ${h.localName || h.name}`)
        .join("\n")}
    >
      {holidays.map((h, i) => (
        <span key={`${h.date}-${h.countryCode}-${i}`}>
          {h.localName || h.name}
          {holidays.length > 1 ? ` (${h.countryCode})` : ""}
          {i < holidays.length - 1 ? " · " : ""}
        </span>
      ))}
    </div>
  );
}
