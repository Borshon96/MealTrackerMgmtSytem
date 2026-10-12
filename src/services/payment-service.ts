import { prisma } from "@/lib/prisma";
import { bdtToPaisa, computeBillStatus } from "@/lib/money";
import { toDateOnly } from "@/lib/dates";
import type { PaymentMethod } from "@/lib/types";

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
              ...(filters.from ? { gte: toDateOnly(filters.from) } : {}),
              ...(filters.to ? { lte: toDateOnly(filters.to) } : {}),
            },
          }
        : {}),
    },
    include: { employee: true },
    orderBy: { paidAt: "desc" },
  });
}

/**
 * Record a payment and allocate FIFO to oldest outstanding bills.
 * Excess becomes employee.creditPaisa.
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
    const payment = await tx.employeePayment.create({
      data: {
        employeeId: input.employeeId,
        paidAt: toDateOnly(input.paidAt),
        amountPaisa,
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

    if (remaining > 0) {
      await tx.employee.update({
        where: { id: input.employeeId },
        data: { creditPaisa: { increment: remaining } },
      });
    }

    return payment;
  });
}

export async function getEmployeePayments(employeeId: string) {
  return prisma.employeePayment.findMany({
    where: { employeeId },
    orderBy: { paidAt: "desc" },
  });
}
