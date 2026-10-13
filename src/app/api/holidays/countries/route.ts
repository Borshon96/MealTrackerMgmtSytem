import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listAvailableCountries } from "@/services/holiday-service";

/** All calendars (countries) supported by Nager.Date. */
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const countries = await listAvailableCountries();
    return NextResponse.json({ countries });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load countries" },
      { status: 502 }
    );
  }
}
