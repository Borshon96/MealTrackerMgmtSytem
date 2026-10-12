import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/dates";
import { startOfWeek, endOfWeek } from "date-fns";

export async function getAdminDashboard() {
  const today = toDateOnly(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

  const [
    activeEmployees,
    todayMeals,
    weekMeals,
    outstandingAgg,
    creditAgg,
    weekPayments,
  ] = await Promise.all([
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.mealRecord.findMany({
      where: { mealDate: today, status: "MEAL_TAKEN" },
    }),
    prisma.mealRecord.findMany({
      where: {
        status: "MEAL_TAKEN",
        mealDate: { gte: toDateOnly(weekStart), lte: toDateOnly(weekEnd) },
      },
    }),
    prisma.employeeBill.aggregate({ _sum: { outstandingPaisa: true } }),
    prisma.employee.aggregate({ _sum: { creditPaisa: true } }),
    prisma.employeePayment.aggregate({
      where: { paidAt: { gte: toDateOnly(weekStart), lte: toDateOnly(weekEnd) } },
      _sum: { amountPaisa: true },
    }),
  ]);

  const todayCost = todayMeals.reduce((s, m) => s + m.unitPricePaisa, 0);
  const weekCost = weekMeals.reduce((s, m) => s + m.unitPricePaisa, 0);
  const weekEmployeeCharges = weekMeals.reduce((s, m) => s + m.employeeChargePaisa, 0);
  const weekOfficeSubsidy = weekMeals.reduce((s, m) => s + m.officeSubsidyPaisa, 0);

  return {
    activeEmployees,
    todayMealCount: todayMeals.length,
    todayCostPaisa: todayCost,
    weekMealCount: weekMeals.length,
    weekCostPaisa: weekCost,
    weekEmployeeChargesPaisa: weekEmployeeCharges,
    weekOfficeSubsidyPaisa: weekOfficeSubsidy,
    outstandingDuesPaisa: outstandingAgg._sum.outstandingPaisa ?? 0,
    unappliedCreditsPaisa: creditAgg._sum.creditPaisa ?? 0,
    weekPaymentsPaisa: weekPayments._sum.amountPaisa ?? 0,
  };
}

export async function getEmployeeDashboard(employeeId: string) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

  const [employee, weekMeals, outstandingAgg, paymentsAgg, recentMeals, recentPayments] =
    await Promise.all([
      prisma.employee.findUniqueOrThrow({ where: { id: employeeId } }),
      prisma.mealRecord.findMany({
        where: {
          employeeId,
          mealDate: { gte: toDateOnly(weekStart), lte: toDateOnly(weekEnd) },
        },
        orderBy: { mealDate: "desc" },
      }),
      prisma.employeeBill.aggregate({
        where: { employeeId },
        _sum: { outstandingPaisa: true },
      }),
      prisma.employeePayment.aggregate({
        where: { employeeId },
        _sum: { amountPaisa: true },
      }),
      prisma.mealRecord.findMany({
        where: { employeeId },
        orderBy: { mealDate: "desc" },
        take: 7,
      }),
      prisma.employeePayment.findMany({
        where: { employeeId },
        orderBy: { paidAt: "desc" },
        take: 5,
      }),
    ]);

  const taken = weekMeals.filter((m) => m.status === "MEAL_TAKEN");
  return {
    employee,
    weekMealCount: taken.length,
    weekChargesPaisa: taken.reduce((s, m) => s + m.employeeChargePaisa, 0),
    outstandingPaisa: outstandingAgg._sum.outstandingPaisa ?? 0,
    totalPaidPaisa: paymentsAgg._sum.amountPaisa ?? 0,
    creditPaisa: employee.creditPaisa,
    recentMeals,
    recentPayments,
  };
}
