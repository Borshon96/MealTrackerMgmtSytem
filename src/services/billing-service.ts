import { prisma } from "@/lib/prisma";
import { computeBillStatus } from "@/lib/money";
import { toDateOnly } from "@/lib/dates";

export async function listBillingPeriods() {
  return prisma.billingPeriod.findMany({
    include: {
      bills: true,
      _count: { select: { bills: true } },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getBillingPeriod(id: string) {
  return prisma.billingPeriod.findUnique({
    where: { id },
    include: {
      bills: {
        include: { employee: true },
        orderBy: { employee: { fullName: "asc" } },
      },
    },
  });
}

async function previousOutstanding(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  employeeId: string,
  beforePeriodStart: Date
) {
  const lastBill = await tx.employeeBill.findFirst({
    where: {
      employeeId,
      period: { endDate: { lt: beforePeriodStart } },
    },
    orderBy: { period: { endDate: "desc" } },
  });
  return lastBill?.outstandingPaisa ?? 0;
}

export async function generateBills(startDateStr: string, endDateStr: string) {
  const startDate = toDateOnly(startDateStr);
  const endDate = toDateOnly(endDateStr);
  if (endDate < startDate) {
    throw new Error("End date must be on or after start date");
  }

  return prisma.$transaction(async (tx) => {
    let period = await tx.billingPeriod.findUnique({
      where: { startDate_endDate: { startDate, endDate } },
    });

    if (period?.status === "CLOSED") {
      throw new Error("This billing period is closed and cannot be regenerated");
    }

    if (!period) {
      period = await tx.billingPeriod.create({
        data: { startDate, endDate, status: "OPEN" },
      });
    } else {
      await tx.employeeBill.deleteMany({ where: { periodId: period.id } });
    }

    const employees = await tx.employee.findMany({
      orderBy: { fullName: "asc" },
    });

    const created = [];
    for (const emp of employees) {
      const meals = await tx.mealRecord.findMany({
        where: {
          employeeId: emp.id,
          status: "MEAL_TAKEN",
          mealDate: { gte: startDate, lte: endDate },
        },
      });

      const mealCount = meals.length;
      const employeeChargesPaisa = meals.reduce((s, m) => s + m.employeeChargePaisa, 0);
      const previousDuePaisa = await previousOutstanding(tx, emp.id, startDate);
      const totalDue = previousDuePaisa + employeeChargesPaisa;

      // Apply existing unapplied credit first
      let credit = emp.creditPaisa;
      let paymentsPaisa = 0;
      let outstandingPaisa = totalDue;

      if (credit > 0 && outstandingPaisa > 0) {
        const applied = Math.min(credit, outstandingPaisa);
        paymentsPaisa += applied;
        outstandingPaisa -= applied;
        credit -= applied;
        await tx.employee.update({
          where: { id: emp.id },
          data: { creditPaisa: credit },
        });
      }

      if (mealCount === 0 && previousDuePaisa === 0 && paymentsPaisa === 0) {
        continue;
      }

      const status = computeBillStatus(outstandingPaisa, paymentsPaisa, totalDue);
      const bill = await tx.employeeBill.create({
        data: {
          periodId: period.id,
          employeeId: emp.id,
          mealCount,
          employeeChargesPaisa,
          previousDuePaisa,
          paymentsPaisa,
          outstandingPaisa,
          status,
        },
      });
      created.push(bill);
    }

    return { period, billCount: created.length };
  });
}

export async function closeBillingPeriod(periodId: string) {
  const period = await prisma.billingPeriod.findUniqueOrThrow({ where: { id: periodId } });
  if (period.status === "CLOSED") throw new Error("Period already closed");
  return prisma.billingPeriod.update({
    where: { id: periodId },
    data: { status: "CLOSED" },
  });
}

export async function getEmployeeBills(employeeId: string) {
  return prisma.employeeBill.findMany({
    where: { employeeId },
    include: { period: true },
    orderBy: { period: { startDate: "desc" } },
  });
}

export async function getOutstandingDues() {
  const employees = await prisma.employee.findMany({
    include: {
      bills: {
        where: { outstandingPaisa: { gt: 0 } },
        include: { period: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  return employees
    .map((emp) => ({
      employee: emp,
      outstandingPaisa: emp.bills.reduce((s, b) => s + b.outstandingPaisa, 0),
      creditPaisa: emp.creditPaisa,
      bills: emp.bills,
    }))
    .filter((r) => r.outstandingPaisa > 0 || r.creditPaisa > 0);
}
