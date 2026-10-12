import { prisma } from "@/lib/prisma";
import { bdtToPaisa, computeBillStatus, computeMealLedgerBalance } from "@/lib/money";
import type { PaymentMethod } from "@/lib/types";
import {
  getEmployeeMealLedger,
  syncEmployeeStoredCredit,
} from "@/services/meal-ledger-service";

export type EmployeePaymentStatus = "DUE" | "PAID" | "ADVANCE";

export type EmployeePaymentRow = {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  latestMealDate: Date | null;
  duePaisa: number;
  creditPaisa: number;
  mealChargesPaisa: number;
  totalPaidPaisa: number;
  status: EmployeePaymentStatus;
  lastMethod: string | null;
  lastReference: string | null;
};

export async function getEmployeeMealBalance(employeeId: string) {
  return getEmployeeMealLedger(employeeId);
}

export async function getPaymentListRows(): Promise<EmployeePaymentRow[]> {
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    orderBy: { fullName: "asc" },
  });

  const rows: EmployeePaymentRow[] = [];

  for (const emp of employees) {
    const [balance, latestMeal, lastPayment] = await Promise.all([
      getEmployeeMealBalance(emp.id),
      prisma.mealRecord.findFirst({
        where: { employeeId: emp.id, status: "MEAL_TAKEN" },
        orderBy: { mealDate: "desc" },
        select: { mealDate: true },
      }),
      prisma.employeePayment.findFirst({
        where: { employeeId: emp.id },
        orderBy: { paidAt: "desc" },
        select: { method: true, reference: true },
      }),
    ]);

    if (balance.mealChargesPaisa === 0 && balance.totalPaidPaisa === 0 && balance.creditPaisa === 0) {
      continue;
    }

    rows.push({
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      latestMealDate: latestMeal?.mealDate ?? null,
      duePaisa: balance.duePaisa,
      creditPaisa: balance.creditPaisa,
      mealChargesPaisa: balance.mealChargesPaisa,
      totalPaidPaisa: balance.totalPaidPaisa,
      status: balance.status,
      lastMethod: lastPayment?.method ?? null,
      lastReference: lastPayment?.reference ?? null,
    });
  }

  rows.sort((a, b) => {
    if (a.status === "DUE" && b.status !== "DUE") return -1;
    if (b.status === "DUE" && a.status !== "DUE") return 1;
    return b.duePaisa - a.duePaisa;
  });

  return rows;
}

export async function getPaymentSummary() {
  const rows = await getPaymentListRows();
  const outstandingPaisa = rows.reduce((s, r) => s + r.duePaisa, 0);
  const dueEmployees = rows.filter((r) => r.status === "DUE").length;
  const advanceRows = rows.filter((r) => r.creditPaisa > 0);
  const advancePaisa = advanceRows.reduce((s, r) => s + r.creditPaisa, 0);
  const settledCount = rows.filter((r) => r.status === "PAID").length;

  return {
    outstandingPaisa,
    dueEmployees,
    advancePaisa,
    advanceEmployees: advanceRows.map((r) => r.fullName),
    settledCount,
  };
}

export async function listPayments(filters?: {
  employeeId?: string;
  from?: string;
  to?: string;
}) {
  return prisma.employeePayment.findMany({
    where: {
      ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters?.from || filters?.to
        ? {
            paidAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    },
    include: { employee: true },
    orderBy: { paidAt: "desc" },
  });
}

function normalizePaymentSplit(p: {
  amountPaisa: number;
  appliedToMealsPaisa: number;
  advanceCreditPaisa: number;
}) {
  let appliedToMealsPaisa = p.appliedToMealsPaisa ?? 0;
  let advanceCreditPaisa = p.advanceCreditPaisa ?? 0;
  if (appliedToMealsPaisa === 0 && advanceCreditPaisa === 0 && p.amountPaisa > 0) {
    appliedToMealsPaisa = p.amountPaisa;
  }
  return { appliedToMealsPaisa, advanceCreditPaisa };
}

export async function getPaymentHistorySummary() {
  const raw = await prisma.employeePayment.findMany({
    include: { employee: true },
    orderBy: { paidAt: "desc" },
  });

  const payments = raw.map((p) => {
    const split = normalizePaymentSplit(p);
    return { ...p, ...split };
  });

  const totalPaidPaisa = payments.reduce((s, p) => s + p.amountPaisa, 0);
  const appliedPaisa = payments.reduce((s, p) => s + p.appliedToMealsPaisa, 0);
  const advancePaisa = payments.reduce((s, p) => s + p.advanceCreditPaisa, 0);
  const employeeIds = new Set(payments.map((p) => p.employeeId));

  return {
    payments,
    totalPaidPaisa,
    appliedPaisa,
    advancePaisa,
    transactionCount: payments.length,
    employeeCount: employeeIds.size,
  };
}

function parsePaidAt(value: string): Date {
  if (value.includes("T")) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(`${value.length === 10 ? `${value}T12:00:00` : value}`);
}

/**
 * Record payment against meal balance (from meal charges), with partial support.
 * Also allocates FIFO to open bills and stores advance credit when overpaid.
 */
export async function recordPayment(input: {
  employeeId: string;
  paidAt: string;
  amountBdt: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}) {
  const amountPaisa = bdtToPaisa(input.amountBdt);
  if (amountPaisa <= 0) throw new Error("Amount must be greater than 0");

  return prisma.$transaction(async (tx) => {
    const mealTotal = await tx.mealRecord.aggregate({
      where: { employeeId: input.employeeId, status: "MEAL_TAKEN" },
      _sum: { employeeChargePaisa: true },
    });
    const paidBefore = await tx.employeePayment.aggregate({
      where: { employeeId: input.employeeId },
      _sum: { amountPaisa: true },
    });

    const mealChargesPaisa = mealTotal._sum.employeeChargePaisa ?? 0;
    const totalPaidBefore = paidBefore._sum.amountPaisa ?? 0;
    const { duePaisa: dueBefore } = computeMealLedgerBalance(
      mealChargesPaisa,
      totalPaidBefore
    );
    const appliedToMealsPaisa = Math.min(amountPaisa, dueBefore);
    const advanceCreditPaisa = amountPaisa - appliedToMealsPaisa;

    const payment = await tx.employeePayment.create({
      data: {
        employeeId: input.employeeId,
        paidAt: parsePaidAt(input.paidAt),
        amountPaisa,
        appliedToMealsPaisa,
        advanceCreditPaisa,
        method: input.method,
        reference: input.reference?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });

    let remaining = amountPaisa;
    const bills = await tx.employeeBill.findMany({
      where: { employeeId: input.employeeId, outstandingPaisa: { gt: 0 } },
      include: { period: true },
      orderBy: { period: { startDate: "asc" } },
    });

    for (const bill of bills) {
      if (remaining <= 0) break;
      const apply = Math.min(remaining, bill.outstandingPaisa);
      const paymentsPaisa = bill.paymentsPaisa + apply;
      const outstandingPaisa = bill.outstandingPaisa - apply;
      const totalDue = bill.previousDuePaisa + bill.employeeChargesPaisa;
      const status = computeBillStatus(outstandingPaisa, paymentsPaisa, totalDue);

      await tx.employeeBill.update({
        where: { id: bill.id },
        data: { paymentsPaisa, outstandingPaisa, status },
      });
      remaining -= apply;
    }

    await syncEmployeeStoredCredit(input.employeeId, tx);

    return payment;
  });
}

export async function getEmployeePayments(employeeId: string) {
  return prisma.employeePayment.findMany({
    where: { employeeId },
    orderBy: { paidAt: "desc" },
  });
}

export function formatPaymentRef(_createdAt: Date, id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (Math.imul(31, hash) + id.charCodeAt(i)) >>> 0;
  }
  const seq = String(hash % 10000).padStart(4, "0");
  return `PAY-${seq}`;
}
