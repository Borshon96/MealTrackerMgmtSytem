import { getDailyMealRegister } from "@/services/meal-service";
import { listEmployees } from "@/services/employee-service";
import { getSettings } from "@/lib/settings";
import { todayInputValue, formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MealRegister } from "@/components/meals/meal-register";
import { AddMealsForm } from "@/components/meals/add-meals-form";

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam || todayInputValue();
  const [register, employees, settings] = await Promise.all([
    getDailyMealRegister(date),
    listEmployees(),
    getSettings(),
  ]);

  const activeEmployees = employees
    .filter((e) => e.status === "ACTIVE")
    .map((e) => ({
      id: e.id,
      fullName: e.fullName,
      employeeCode: e.employeeCode,
    }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Meals"
        description="Add meals for one or more employees across a date range or selected dates, then review the daily register."
      />

      <AddMealsForm
        employees={activeEmployees}
        mealPricePaisa={settings.mealPricePaisa}
        employeeSharePct={settings.employeeSharePct}
      />

      <section>
        <h3 className="mb-4 text-lg font-semibold">Daily register</h3>
        <form className="mb-6 flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="date" className="mb-1 block text-sm text-muted-foreground">
              Date
            </label>
            <Input id="date" name="date" type="date" defaultValue={date} />
          </div>
          <Button type="submit" variant="outline">
            Load
          </Button>
        </form>

        <MealRegister
          date={date}
          rows={register.rows.map(({ employee, record }) => ({
            employee,
            record: record
              ? {
                  status: record.status as "MEAL_TAKEN" | "NOT_TAKEN" | "PENDING",
                  employeeChargePaisa: record.employeeChargePaisa,
                }
              : null,
          }))}
          summary={register.summary}
        />
        <p className="mt-4 text-xs text-muted-foreground">
          Showing register for {formatDate(register.date)}
        </p>
      </section>
    </div>
  );
}
