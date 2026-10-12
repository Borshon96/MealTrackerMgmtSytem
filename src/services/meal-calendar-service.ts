import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
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

export type MonthCalendarCell = CalendarDay & { inMonth: boolean };

export type MealCalendarSummary = {
  totalMeals: number;
  paidCount: number;
  dueCount: number;
  dueTotalPaisa: number;
};

type DaySpec = { date: Date; dateStr: string };

function summarizeDays(days: CalendarDay[]): MealCalendarSummary {
  const totalMeals = days.reduce((s, d) => s + d.mealCount, 0);
  const paidCount = days.reduce(
    (s, d) => s + d.meals.filter((m) => m.paymentStatus === "PAID").length,
    0
  );
  const dueCount = totalMeals - paidCount;
  const dueTotalPaisa = days.reduce((s, d) => s + d.duePaisa, 0);
  return { totalMeals, paidCount, dueCount, dueTotalPaisa };
}

async function buildMealCalendarDays(
  daySpecs: DaySpec[],
  chargePerMealPaisa: number
): Promise<CalendarDay[]> {
  if (daySpecs.length === 0) return [];

  const rangeStart = toDateOnly(daySpecs[0].dateStr);
  const rangeEnd = toDateOnly(daySpecs[daySpecs.length - 1].dateStr);
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
  for (const day of daySpecs) byDate.set(day.dateStr, []);

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

  return daySpecs.map(({ date, dateStr }) => {
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
}

export async function getDayMealCalendar(anchorDateStr: string, chargePerMealPaisa: number) {
  const anchor = toDateOnly(anchorDateStr);
  const dateStr = format(anchor, "yyyy-MM-dd");
  const days = await buildMealCalendarDays([{ date: anchor, dateStr }], chargePerMealPaisa);

  return {
    anchorDate: dateStr,
    periodLabel: format(anchor, "EEEE, d MMMM yyyy"),
    days,
    summary: summarizeDays(days),
  };
}

export async function getWeekMealCalendar(anchorDateStr: string, chargePerMealPaisa: number) {
  const anchor = toDateOnly(anchorDateStr);
  const weekStartDate = startOfWeek(anchor, { weekStartsOn: 6 });
  const daySpecs: DaySpec[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStartDate, i);
    return { date: d, dateStr: format(d, "yyyy-MM-dd") };
  });

  const days = await buildMealCalendarDays(daySpecs, chargePerMealPaisa);

  return {
    anchorDate: anchorDateStr,
    weekStart: daySpecs[0].dateStr,
    weekEnd: daySpecs[6].dateStr,
    periodLabel: `${format(daySpecs[0].date, "d")} – ${format(daySpecs[6].date, "d MMMM yyyy")}`,
    days,
    summary: summarizeDays(days),
  };
}

export async function getMonthMealCalendar(anchorDateStr: string, chargePerMealPaisa: number) {
  const anchor = toDateOnly(anchorDateStr);
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 });
  const gridEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 6 }), 6);

  const gridDates = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const daySpecs: DaySpec[] = gridDates.map((date) => ({
    date,
    dateStr: format(date, "yyyy-MM-dd"),
  }));

  const built = await buildMealCalendarDays(daySpecs, chargePerMealPaisa);
  const monthCells: MonthCalendarCell[] = built.map((day, i) => ({
    ...day,
    inMonth: isSameMonth(daySpecs[i].date, monthStart),
  }));

  const inMonthDays = monthCells.filter((c) => c.inMonth);

  return {
    anchorDate: format(anchor, "yyyy-MM-dd"),
    monthStart: format(monthStart, "yyyy-MM-dd"),
    periodLabel: format(monthStart, "MMMM yyyy"),
    monthCells,
    days: inMonthDays,
    summary: summarizeDays(inMonthDays),
  };
}
