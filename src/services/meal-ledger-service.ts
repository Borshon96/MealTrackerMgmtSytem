import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeMealLedgerBalance,
  mealLedgerStatus,
  type MealLedgerStatus,
} from "@/lib/money";

type Tx = Prisma.TransactionClient;

async function sumMealCharges(employeeId: string, client: Tx | typeof prisma) {
  const agg = await client.mealRecord.aggregate({
    where: { employeeId, status: "MEAL_TAKEN" },
    _sum: { employeeChargePaisa: true },
  });
  return agg._sum.employeeChargePaisa ?? 0;
}

async function sumPayments(employeeId: string, client: Tx | typeof prisma) {
  const agg = await client.employeePayment.aggregate({
    where: { employeeId },
    _sum: { amountPaisa: true },
  });
  return agg._sum.amountPaisa ?? 0;
}

export async function getEmployeeMealLedger(employeeId: string) {
  const [mealChargesPaisa, totalPaidPaisa] = await Promise.all([
    sumMealCharges(employeeId, prisma),
    sumPayments(employeeId, prisma),
  ]);
  const { duePaisa, creditPaisa } = computeMealLedgerBalance(
    mealChargesPaisa,
    totalPaidPaisa
  );
  const status: MealLedgerStatus = mealLedgerStatus(duePaisa, creditPaisa);
  return { mealChargesPaisa, totalPaidPaisa, duePaisa, creditPaisa, status };
}

/** Keep Employee.creditPaisa aligned with the ledger (for billing/reports). */
export async function syncEmployeeStoredCredit(
  employeeId: string,
  tx?: Tx
) {
  const client = tx ?? prisma;
  const [mealChargesPaisa, totalPaidPaisa] = await Promise.all([
    sumMealCharges(employeeId, client),
    sumPayments(employeeId, client),
  ]);
  const { creditPaisa } = computeMealLedgerBalance(mealChargesPaisa, totalPaidPaisa);
  await client.employee.update({
    where: { id: employeeId },
    data: { creditPaisa },
  });
}

/**
 * Which meal rows should show as "due" on the calendar: newest meals first,
 * count = ceil(employee due ÷ standard per-meal charge).
 */
export async function buildDueMealRecordIdMap(
  employeeIds: string[],
  chargePerMealPaisa: number,
  duePaisaByEmployee: Map<string, number>
): Promise<Map<string, Set<string>>> {
  const result = new Map<string, Set<string>>();
  for (const id of employeeIds) result.set(id, new Set());

  if (employeeIds.length === 0 || chargePerMealPaisa <= 0) return result;

  const allMeals = await prisma.mealRecord.findMany({
    where: { employeeId: { in: employeeIds }, status: "MEAL_TAKEN" },
    orderBy: [{ mealDate: "desc" }, { createdAt: "desc" }],
    select: { id: true, employeeId: true },
  });

  const mealIdsByEmployee = new Map<string, string[]>();
  for (const id of employeeIds) mealIdsByEmployee.set(id, []);
  for (const meal of allMeals) {
    mealIdsByEmployee.get(meal.employeeId)?.push(meal.id);
  }

  for (const employeeId of employeeIds) {
    const duePaisa = duePaisaByEmployee.get(employeeId) ?? 0;
    const mealIds = mealIdsByEmployee.get(employeeId) ?? [];
    if (duePaisa <= 0 || mealIds.length === 0) continue;

    const dueMealCount = Math.min(
      mealIds.length,
      Math.ceil(duePaisa / chargePerMealPaisa)
    );
    result.set(employeeId, new Set(mealIds.slice(0, dueMealCount)));
  }

  return result;
}

export async function resyncAllEmployeeStoredCredits() {
  const employees = await prisma.employee.findMany({ select: { id: true } });
  for (const emp of employees) {
    await syncEmployeeStoredCredit(emp.id);
  }
  return employees.length;
}
