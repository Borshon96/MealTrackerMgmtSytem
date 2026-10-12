import { addDays, format, startOfWeek } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toDateOnly, formatDate } from "@/lib/dates";
import {
  buildDueMealRecordIdMap,
  getEmployeeMealLedger,
} from "@/services/meal-ledger-service";

export type CalendarMealEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  chargePaisa: number;
  status: string;
  paymentStatus: "PAID" | "DUE";
};

export type CalendarDay = {
  dateStr: string;
  dayLabel: string;
  dayNumber: number;
  isToday: boolean;
  meals: CalendarMealEntry[];
  mealCount: number;
  duePaisa: number;
  allPaid: boolean;
};

export async function getWeekMealCalendar(
  anchorDateStr: string,
  chargePerMealPaisa: number
) {
  const anchor = toDateOnly(anchorDateStr);
  // Saturday start to match design (Sat–Fri)
  const weekStart = startOfWeek(anchor, { weekStartsOn: 6 });
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return {
      date: d,
      dateStr: format(d, "yyyy-MM-dd"),
    };
  });

  const rangeStart = toDateOnly(days[0].dateStr);
  const rangeEnd = toDateOnly(days[6].dateStr);
  const todayStr = formatDate(new Date());

  const records = await prisma.mealRecord.findMany({
    where: {
      status: "MEAL_TAKEN",
      mealDate: { gte: rangeStart, lte: rangeEnd },
    },
    include: { employee: true },
    orderBy: [{ mealDate: "asc" }, { employee: { fullName: "asc" } }],
  });

  const employeeIds = [...new Set(records.map((r) => r.employeeId))];
  const ledgerEntries = await Promise.all(
    employeeIds.map(async (id) => [id, await getEmployeeMealLedger(id)] as const)
  );
  const duePaisaByEmployee = new Map(
    ledgerEntries.map(([id, ledger]) => [id, ledger.duePaisa])
  );
  const dueMealIdsByEmployee = await buildDueMealRecordIdMap(
    employeeIds,
    chargePerMealPaisa,
    duePaisaByEmployee
  );

  const byDate = new Map<string, CalendarMealEntry[]>();
  for (const day of days) byDate.set(day.dateStr, []);

  for (const record of records) {
    const dateStr = formatDate(record.mealDate);
    const list = byDate.get(dateStr);
    if (!list) continue;
    const dueMealIds = dueMealIdsByEmployee.get(record.employeeId) ?? new Set();
    const isDueMeal = dueMealIds.has(record.id);
    list.push({
      id: record.id,
      employeeId: record.employeeId,
      employeeName: record.employee.fullName,
      employeeCode: record.employee.employeeCode,
      chargePaisa: record.employeeChargePaisa,
      status: record.status,
      paymentStatus: isDueMeal ? "DUE" : "PAID",
    });
  }

  const calendarDays: CalendarDay[] = days.map(({ date, dateStr }) => {
    const meals = byDate.get(dateStr) ?? [];
    const duePaisa = meals
      .filter((m) => m.paymentStatus === "DUE")
      .reduce((s, m) => s + m.chargePaisa, 0);
    return {
      dateStr,
      dayLabel: format(date, "EEE"),
      dayNumber: Number(format(date, "d")),
      isToday: dateStr === todayStr,
      meals,
      mealCount: meals.length,
      duePaisa,
      allPaid: meals.length > 0 && duePaisa === 0,
    };
  });

  const totalMeals = calendarDays.reduce((s, d) => s + d.mealCount, 0);
  const paidCount = calendarDays.reduce(
    (s, d) => s + d.meals.filter((m) => m.paymentStatus === "PAID").length,
    0
  );
  const dueCount = totalMeals - paidCount;
  const dueTotalPaisa = calendarDays.reduce((s, d) => s + d.duePaisa, 0);

  return {
    weekStart: days[0].dateStr,
    weekEnd: days[6].dateStr,
    weekLabel: `${format(days[0].date, "d")} – ${format(days[6].date, "d MMMM yyyy")}`,
    days: calendarDays,
    summary: {
      totalMeals,
      paidCount,
      dueCount,
      dueTotalPaisa,
    },
  };
}
