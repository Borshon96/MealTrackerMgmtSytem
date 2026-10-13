import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getPublicHolidays,
  parseHolidayCountryCodes,
} from "@/services/holiday-service";

/** Public holidays for one year and one or more ISO country codes (comma-separated). */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const codes = parseHolidayCountryCodes(searchParams.get("codes") ?? "");

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  if (codes.length === 0) {
    return NextResponse.json({ error: "Provide codes (e.g. BD,US)" }, { status: 400 });
  }

  try {
    const byCountry = await Promise.all(
      codes.map(async (code) => ({
        countryCode: code,
        holidays: await getPublicHolidays(year, code),
      }))
    );
    return NextResponse.json({ year, calendars: byCountry });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load holidays" },
      { status: 502 }
    );
  }
}
