"use client";

import { useMemo, useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addMealsForSelectionAction, type ActionResult } from "@/actions/meal-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/forms/form-message";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { datesInRange, todayInputValue } from "@/lib/dates";
import { formatBdt, splitMealCost } from "@/lib/money";

type EmployeeOption = {
  id: string;
  fullName: string;
  employeeCode: string;
};

export function AddMealsForm({
  employees,
  mealPricePaisa,
  employeeSharePct,
}: {
  employees: EmployeeOption[];
  mealPricePaisa: number;
  employeeSharePct: number;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateMode, setDateMode] = useState<"range" | "selected">("range");
  const [startDate, setStartDate] = useState(todayInputValue());
  const [endDate, setEndDate] = useState(todayInputValue());
  const [pickedDate, setPickedDate] = useState(todayInputValue());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [status, setStatus] = useState<"MEAL_TAKEN" | "NOT_TAKEN" | "PENDING">("MEAL_TAKEN");

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    addMealsForSelectionAction,
    null
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  const resolvedDates = useMemo(() => {
    if (dateMode === "selected") {
      return [...selectedDates].sort();
    }
    if (!startDate || !endDate) return [];
    return datesInRange(startDate, endDate);
  }, [dateMode, selectedDates, startDate, endDate]);

  const perMeal = useMemo(() => {
    if (status !== "MEAL_TAKEN") {
      return { employeeChargePaisa: 0, officeSubsidyPaisa: 0, unitPricePaisa: mealPricePaisa };
    }
    const split = splitMealCost(mealPricePaisa, employeeSharePct);
    return { ...split, unitPricePaisa: mealPricePaisa };
  }, [status, mealPricePaisa, employeeSharePct]);

  const calc = useMemo(() => {
    const employeeCount = selectedIds.length;
    const dayCount = resolvedDates.length;
    const mealCount = employeeCount * dayCount;
    return {
      employeeCount,
      dayCount,
      mealCount,
      totalCostPaisa: mealCount * perMeal.unitPricePaisa,
      employeeChargesPaisa: mealCount * perMeal.employeeChargePaisa,
      officeSubsidyPaisa: mealCount * perMeal.officeSubsidyPaisa,
      perEmployeePaisa: dayCount * perMeal.employeeChargePaisa,
    };
  }, [selectedIds.length, resolvedDates.length, perMeal]);

  function toggleEmployee(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAllEmployees() {
    setSelectedIds(employees.map((e) => e.id));
  }

  function clearEmployees() {
    setSelectedIds([]);
  }

  function addSelectedDate() {
    if (!pickedDate) return;
    setSelectedDates((prev) =>
      prev.includes(pickedDate) ? prev : [...prev, pickedDate].sort()
    );
  }

  function removeSelectedDate(date: string) {
    setSelectedDates((prev) => prev.filter((d) => d !== date));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add meals for employees</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="dateMode" value={dateMode} />
          <input type="hidden" name="status" value={status} />
          {selectedIds.map((id) => (
            <input key={id} type="hidden" name="employeeIds" value={id} />
          ))}
          {dateMode === "range" ? (
            <>
              <input type="hidden" name="startDate" value={startDate} />
              <input type="hidden" name="endDate" value={endDate} />
            </>
          ) : (
            selectedDates.map((d) => (
              <input key={d} type="hidden" name="dates" value={d} />
            ))
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Employees</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={selectAllEmployees}>
                  Select all
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={clearEmployees}>
                  Clear
                </Button>
              </div>
            </div>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active employees available.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-lg border p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {employees.map((emp) => {
                    const checked = selectedIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEmployee(emp.id)}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium">{emp.fullName}</span>
                          <span className="block text-xs text-muted-foreground">
                            {emp.employeeCode}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedIds.length} employee(s) selected
            </p>
          </div>

          <div className="space-y-3">
            <Label>Date selection</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={dateMode === "range" ? "default" : "outline"}
                onClick={() => setDateMode("range")}
              >
                Date range
              </Button>
              <Button
                type="button"
                size="sm"
                variant={dateMode === "selected" ? "default" : "outline"}
                onClick={() => setDateMode("selected")}
              >
                Selected dates
              </Button>
            </div>

            {dateMode === "range" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="pickedDate">Add date</Label>
                    <Input
                      id="pickedDate"
                      type="date"
                      value={pickedDate}
                      onChange={(e) => setPickedDate(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={addSelectedDate}>
                    Add date
                  </Button>
                </div>
                {selectedDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No dates selected yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedDates.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => removeSelectedDate(d)}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                        title="Remove date"
                      >
                        {d} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{resolvedDates.length} day(s) selected</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mealStatus">Meal status</Label>
              <select
                id="mealStatus"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "MEAL_TAKEN" | "NOT_TAKEN" | "PENDING")
                }
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="MEAL_TAKEN">Meal taken</option>
                <option value="NOT_TAKEN">Not taken</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (optional)</Label>
              <Textarea id="remarks" name="remarks" rows={2} />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium">Payment calculation</p>
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                Employees × days:{" "}
                <strong>
                  {calc.employeeCount} × {calc.dayCount} = {calc.mealCount} meals
                </strong>
              </div>
              <div>
                Charge / meal (employee): <strong>{formatBdt(perMeal.employeeChargePaisa)}</strong>
              </div>
              <div>
                Per employee (selected days): <strong>{formatBdt(calc.perEmployeePaisa)}</strong>
              </div>
              <div>
                Total employee charges: <strong>{formatBdt(calc.employeeChargesPaisa)}</strong>
              </div>
              <div>
                Total office subsidy: <strong>{formatBdt(calc.officeSubsidyPaisa)}</strong>
              </div>
              <div>
                Total meal cost: <strong>{formatBdt(calc.totalCostPaisa)}</strong>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Uses current settings (meal price and share %). Existing meal rows keep their original
              snapshotted price.
            </p>
          </div>

          <div className="space-y-2">
            <FormMessage result={state} />
            <Button
              type="submit"
              disabled={
                pending || selectedIds.length === 0 || resolvedDates.length === 0 || employees.length === 0
              }
            >
              {pending ? "Saving..." : "Add meals"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
