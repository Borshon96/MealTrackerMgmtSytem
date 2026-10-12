import Link from "next/link";
import { Download, UtensilsCrossed } from "lucide-react";
import { listEmployees } from "@/services/employee-service";
import { getSettings } from "@/lib/settings";
import {
  getDayMealCalendar,
  getMonthMealCalendar,
  getWeekMealCalendar,
} from "@/services/meal-calendar-service";
import type { MealCalendarView } from "@/components/meals/meal-calendar";
import { todayInputValue } from "@/lib/dates";
import { formatBdt, splitMealCost } from "@/lib/money";
import { AddMealsForm } from "@/components/meals/add-meals-form";
import { MealCalendar } from "@/components/meals/meal-calendar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; date?: string; view?: string }>;
}) {
  const params = await searchParams;
  const anchorDate = params.date || params.week || todayInputValue();
  const view: MealCalendarView =
    params.view === "day" || params.view === "month" ? params.view : "week";
  const [employees, settings] = await Promise.all([listEmployees(), getSettings()]);

  const chargePerMeal = splitMealCost(
    settings.mealPricePaisa,
    settings.employeeSharePct
  ).employeeChargePaisa;

  const dayCalendar = view === "day" ? await getDayMealCalendar(anchorDate, chargePerMeal) : null;
  const weekCalendar =
    view === "week" ? await getWeekMealCalendar(anchorDate, chargePerMeal) : null;
  const monthCalendar =
    view === "month" ? await getMonthMealCalendar(anchorDate, chargePerMeal) : null;

  const calendar = dayCalendar ?? weekCalendar ?? monthCalendar!;

  const activeEmployees = employees
    .filter((e) => e.status === "ACTIVE")
    .map((e) => ({
      id: e.id,
      fullName: e.fullName,
      employeeCode: e.employeeCode,
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Employee meals</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Add meal entries, track the week, and keep payments in sync.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-brand-foreground">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            {formatBdt(chargePerMeal)} / meal
          </span>
          <Link
            href="/api/export/meals"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-2 rounded-xl bg-white")}
          >
            <Download className="h-4 w-4" />
            Export
          </Link>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
        <AddMealsForm
          employees={activeEmployees}
          mealPricePaisa={settings.mealPricePaisa}
          employeeSharePct={settings.employeeSharePct}
        />
        <MealCalendar
          view={view}
          anchorDate={calendar.anchorDate}
          periodLabel={calendar.periodLabel}
          days={calendar.days}
          monthCells={monthCalendar?.monthCells}
          summary={calendar.summary}
          chargePerMealPaisa={chargePerMeal}
        />
      </div>
    </div>
  );
}
