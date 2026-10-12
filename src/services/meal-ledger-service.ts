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

export async function resyncAllEmployeeStoredCredits() {
  const employees = await prisma.employee.findMany({ select: { id: true } });
  for (const emp of employees) {
    await syncEmployeeStoredCredit(emp.id);
  }
  return employees.length;
}
