import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { splitMealCost } from "@/lib/money";
import { toDateOnly } from "@/lib/dates";
import type { MealStatus } from "@/lib/types";

function chargesForStatus(
  status: MealStatus,
  unitPricePaisa: number,
  employeeSharePct: number
) {
  if (status !== "MEAL_TAKEN") {
    return { employeeChargePaisa: 0, officeSubsidyPaisa: 0 };
  }
  return splitMealCost(unitPricePaisa, employeeSharePct);
}

export async function getDailyMealRegister(dateStr: string) {
  const mealDate = toDateOnly(dateStr);
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    orderBy: { fullName: "asc" },
  });
  const records = await prisma.mealRecord.findMany({
    where: { mealDate },
  });
  const byEmployee = new Map(records.map((r) => [r.employeeId, r]));

  const rows = employees.map((emp) => ({
    employee: emp,
    record: byEmployee.get(emp.id) ?? null,
  }));

  const taken = records.filter((r) => r.status === "MEAL_TAKEN");
  const totalCost = taken.reduce((s, r) => s + r.unitPricePaisa, 0);
  const employeeCharges = taken.reduce((s, r) => s + r.employeeChargePaisa, 0);
  const officeSubsidy = taken.reduce((s, r) => s + r.officeSubsidyPaisa, 0);

  return {
    date: mealDate,
    rows,
    summary: {
      mealCount: taken.length,
      totalCostPaisa: totalCost,
      employeeChargesPaisa: employeeCharges,
      officeSubsidyPaisa: officeSubsidy,
    },
  };
}

export async function upsertMealStatus(input: {
  employeeId: string;
  dateStr: string;
  status: MealStatus;
  remarks?: string;
}) {
  const settings = await getSettings();
  const mealDate = toDateOnly(input.dateStr);
  const existing = await prisma.mealRecord.findUnique({
    where: {
      employeeId_mealDate: { employeeId: input.employeeId, mealDate },
    },
  });

  const unitPricePaisa = existing?.unitPricePaisa ?? settings.mealPricePaisa;
  const employeeSharePct = existing?.employeeSharePct ?? settings.employeeSharePct;
  const officeSharePct = existing?.officeSharePct ?? settings.officeSharePct;
  const { employeeChargePaisa, officeSubsidyPaisa } = chargesForStatus(
    input.status,
    unitPricePaisa,
    employeeSharePct
  );

  if (existing) {
    return prisma.mealRecord.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        employeeChargePaisa,
        officeSubsidyPaisa,
        remarks: input.remarks?.trim() || null,
      },
    });
  }

  return prisma.mealRecord.create({
    data: {
      employeeId: input.employeeId,
      mealDate,
      status: input.status,
      unitPricePaisa,
      employeeSharePct,
      officeSharePct,
      employeeChargePaisa,
      officeSubsidyPaisa,
      remarks: input.remarks?.trim() || null,
    },
  });
}

export async function bulkSetMealStatus(input: {
  dateStr: string;
  status: MealStatus;
  employeeIds?: string[];
}) {
  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      ...(input.employeeIds?.length ? { id: { in: input.employeeIds } } : {}),
    },
    select: { id: true },
  });

  for (const emp of employees) {
    await upsertMealStatus({
      employeeId: emp.id,
      dateStr: input.dateStr,
      status: input.status,
    });
  }

  return employees.length;
}

/**
 * Mark meals as taken for selected employees across many dates.
 * Returns how many employee-day records were written.
 */
export async function addMealsForSelection(input: {
  employeeIds: string[];
  dates: string[];
  status?: MealStatus;
  remarks?: string;
}) {
  const employeeIds = [...new Set(input.employeeIds.filter(Boolean))];
  const dates = [...new Set(input.dates.filter(Boolean))].sort();
  if (employeeIds.length === 0) throw new Error("Select at least one employee");
  if (dates.length === 0) throw new Error("Select at least one date");

  const active = await prisma.employee.findMany({
    where: { id: { in: employeeIds }, status: "ACTIVE" },
    select: { id: true },
  });
  if (active.length === 0) throw new Error("No active employees selected");

  const status = input.status ?? "MEAL_TAKEN";
  let written = 0;

  for (const emp of active) {
    for (const dateStr of dates) {
      await upsertMealStatus({
        employeeId: emp.id,
        dateStr,
        status,
        remarks: input.remarks,
      });
      written += 1;
    }
  }

  return {
    written,
    employeeCount: active.length,
    dayCount: dates.length,
  };
}

export async function getEmployeeMeals(employeeId: string, from?: string, to?: string) {
  return prisma.mealRecord.findMany({
    where: {
      employeeId,
      ...(from || to
        ? {
            mealDate: {
              ...(from ? { gte: toDateOnly(from) } : {}),
              ...(to ? { lte: toDateOnly(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { mealDate: "desc" },
  });
}
