import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/dates";
import type { EmployeeStatus } from "@/lib/types";

export async function listEmployees(search?: string) {
  return prisma.employee.findMany({
    where: search
      ? {
          OR: [
            { fullName: { contains: search } },
            { employeeCode: { contains: search } },
            { department: { contains: search } },
          ],
        }
      : undefined,
    include: { user: { select: { id: true, username: true, status: true } } },
    orderBy: { fullName: "asc" },
  });
}

export async function getEmployee(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, email: true, status: true } },
      bills: { orderBy: { createdAt: "desc" }, take: 10, include: { period: true } },
      payments: { orderBy: { paidAt: "desc" }, take: 10 },
      meals: { orderBy: { mealDate: "desc" }, take: 20 },
    },
  });
}

export async function createEmployee(data: {
  employeeCode: string;
  fullName: string;
  department?: string;
  phone?: string;
  joiningDate: string;
  status: EmployeeStatus;
  notes?: string;
}) {
  return prisma.employee.create({
    data: {
      employeeCode: data.employeeCode.trim(),
      fullName: data.fullName.trim(),
      department: data.department?.trim() || null,
      phone: data.phone?.trim() || null,
      joiningDate: toDateOnly(data.joiningDate),
      status: data.status,
      notes: data.notes?.trim() || null,
    },
  });
}

export async function updateEmployee(
  id: string,
  data: {
    employeeCode: string;
    fullName: string;
    department?: string;
    phone?: string;
    joiningDate: string;
    status: EmployeeStatus;
    notes?: string;
  }
) {
  return prisma.employee.update({
    where: { id },
    data: {
      employeeCode: data.employeeCode.trim(),
      fullName: data.fullName.trim(),
      department: data.department?.trim() || null,
      phone: data.phone?.trim() || null,
      joiningDate: toDateOnly(data.joiningDate),
      status: data.status,
      notes: data.notes?.trim() || null,
    },
  });
}

export async function getEmployeeBalances(employeeId: string) {
  const [employee, outstandingAgg, paidAgg, billedAgg] = await Promise.all([
    prisma.employee.findUniqueOrThrow({ where: { id: employeeId } }),
    prisma.employeeBill.aggregate({
      where: { employeeId },
      _sum: { outstandingPaisa: true },
    }),
    prisma.employeePayment.aggregate({
      where: { employeeId },
      _sum: { amountPaisa: true },
    }),
    prisma.employeeBill.aggregate({
      where: { employeeId },
      _sum: { employeeChargesPaisa: true },
    }),
  ]);

  return {
    outstandingPaisa: outstandingAgg._sum.outstandingPaisa ?? 0,
    totalPaidPaisa: paidAgg._sum.amountPaisa ?? 0,
    totalBilledPaisa: billedAgg._sum.employeeChargesPaisa ?? 0,
    creditPaisa: employee.creditPaisa,
  };
}
