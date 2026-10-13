import { prisma } from "@/lib/prisma";
import { bdtToPaisa } from "@/lib/money";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/lib/defaults";
import {
  defaultHolidayCountryCodes,
  parseHolidayCountryCodes,
} from "@/lib/holiday-codes";

export { DEFAULT_SETTINGS, SETTING_KEYS };

export type AppSettings = {
  mealPriceBdt: number;
  mealPricePaisa: number;
  employeeSharePct: number;
  officeSharePct: number;
  weekStartDay: number;
  companyName: string;
  holidayCountryCodes: string[];
};

export async function ensureDefaultSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
}

export async function getSettings(): Promise<AppSettings> {
  await ensureDefaultSettings();
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const mealPriceBdt = Number(map[SETTING_KEYS.mealPriceBdt] ?? 100);
  const employeeSharePct = Number(map[SETTING_KEYS.employeeSharePct] ?? 50);
  const officeSharePct = Number(map[SETTING_KEYS.officeSharePct] ?? 50);

  return {
    mealPriceBdt,
    mealPricePaisa: bdtToPaisa(mealPriceBdt),
    employeeSharePct,
    officeSharePct,
    weekStartDay: Number(map[SETTING_KEYS.weekStartDay] ?? 0),
    companyName: map[SETTING_KEYS.companyName] ?? "Office Meal Tracker",
    holidayCountryCodes: (() => {
      const raw = map[SETTING_KEYS.holidayCountryCodes]?.trim();
      const parsed = parseHolidayCountryCodes(raw || DEFAULT_SETTINGS[SETTING_KEYS.holidayCountryCodes]);
      return parsed.length > 0 ? parsed : defaultHolidayCountryCodes();
    })(),
  };
}

export async function updateSettings(input: {
  mealPriceBdt: number;
  employeeSharePct: number;
  officeSharePct: number;
  weekStartDay: number;
  companyName: string;
  holidayCountryCodes: string;
}) {
  if (input.employeeSharePct + input.officeSharePct !== 100) {
    throw new Error("Employee and office shares must total 100%");
  }
  if (input.mealPriceBdt <= 0) {
    throw new Error("Meal price must be greater than 0");
  }

  const updates: Record<string, string> = {
    [SETTING_KEYS.mealPriceBdt]: String(input.mealPriceBdt),
    [SETTING_KEYS.employeeSharePct]: String(input.employeeSharePct),
    [SETTING_KEYS.officeSharePct]: String(input.officeSharePct),
    [SETTING_KEYS.weekStartDay]: String(input.weekStartDay),
    [SETTING_KEYS.companyName]: input.companyName.trim() || "Office Meal Tracker",
    [SETTING_KEYS.holidayCountryCodes]: input.holidayCountryCodes.trim() || "BD",
  };

  for (const [key, value] of Object.entries(updates)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
