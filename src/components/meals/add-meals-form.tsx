"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Search, UtensilsCrossed, X } from "lucide-react";
import {
  addMealsForSelectionAction,
  getTakenMealDatesAction,
  type ActionResult,
} from "@/actions/meal-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/forms/form-message";
import { datesInRange, todayInputValue } from "@/lib/dates";
import { employeeInitials, employeeShortName } from "@/lib/employee-display";
import { formatBdt, splitMealCost } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { HolidayOnDate } from "@/lib/holiday-types";
import {
  CALENDAR_WEEK_STARTS_ON,
  CALENDAR_WEEKDAY_HEADERS,
  isWeekendDay,
  isWeekendGridColumn,
} from "@/lib/work-week";

type EmployeeOption = {
  id: string;
  fullName: string;
  employeeCode: string;
};

function formatCompactDates(dates: string[]) {
  if (dates.length === 0) return "—";
  return dates.map((d) => format(parseISO(`${d}T12:00:00`), "d MMM")).join(", ");
}

export function AddMealsForm({
  employees,
  mealPricePaisa,
  employeeSharePct,
  holidaysByDate = {},
}: {
  employees: EmployeeOption[];
  mealPricePaisa: number;
  employeeSharePct: number;
  holidaysByDate?: Record<string, HolidayOnDate[]>;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dateMode, setDateMode] = useState<"range" | "selected">("selected");
  const [startDate, setStartDate] = useState(todayInputValue());
  const [endDate, setEndDate] = useState(todayInputValue());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [takenByEmployee, setTakenByEmployee] = useState<Record<string, string[]>>({});

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    addMealsForSelectionAction,
    null
  );

  useEffect(() => {
    if (state?.ok) {
      setSelectedIds([]);
      setSelectedDates([]);
      router.refresh();
    }
  }, [state, router]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setTakenByEmployee({});
      return;
    }
    let cancelled = false;
    (async () => {
      const map = await getTakenMealDatesAction(selectedIds);
      if (!cancelled) setTakenByEmployee(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  const employeeHasMealOn = (employeeId: string, dateStr: string) =>
    takenByEmployee[employeeId]?.includes(dateStr) ?? false;

  const isDateBlockedForSelection = (dateStr: string) =>
    selectedIds.length > 0 && selectedIds.some((id) => employeeHasMealOn(id, dateStr));

  const datesAvailableForEmployee = (employeeId: string, dates: string[]) =>
    dates.filter((d) => !employeeHasMealOn(employeeId, d));

  useEffect(() => {
    setSelectedDates((prev) => prev.filter((d) => !isDateBlockedForSelection(d)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prune when taken dates load
  }, [takenByEmployee, selectedIds]);

  const perMealCharge = useMemo(
    () => splitMealCost(mealPricePaisa, employeeSharePct).employeeChargePaisa,
    [mealPricePaisa, employeeSharePct]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q)
    );
  }, [employees, query]);

  const selectedEmployees = useMemo(
    () => employees.filter((e) => selectedIds.includes(e.id)),
    [employees, selectedIds]
  );

  const resolvedDates = useMemo(() => {
    if (dateMode === "selected") return [...selectedDates].sort();
    return datesInRange(startDate, endDate);
  }, [dateMode, selectedDates, startDate, endDate]);

  const lines = useMemo(
    () =>
      selectedEmployees.map((emp) => {
        const empDates = datesAvailableForEmployee(emp.id, resolvedDates);
        return {
          id: emp.id,
          name: emp.fullName,
          days: empDates.length,
          skipped: resolvedDates.length - empDates.length,
          total: empDates.length * perMealCharge,
          datesLabel: formatCompactDates(empDates),
        };
      }),
    [selectedEmployees, resolvedDates, perMealCharge, takenByEmployee]
  );

  const totalMeals = lines.reduce((s, l) => s + l.days, 0);
  const totalPaisa = totalMeals * perMealCharge;
  const blockedInSelection = resolvedDates.filter(isDateBlockedForSelection).length;

  const allSelected = employees.length > 0 && selectedIds.length === employees.length;

  function toggleEmployee(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(employees.map((e) => e.id));
  }

  function toggleCalendarDate(dateStr: string) {
    if (isDateBlockedForSelection(dateStr)) return;
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort()
    );
  }

  function toggleLineExpand(id: string) {
    setExpandedLines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const monthStart = startOfMonth(monthCursor);
  const gridStart = startOfWeek(monthStart, {
    weekStartsOn: CALENDAR_WEEK_STARTS_ON,
  });
  const calendarDays = eachDayOfInterval({
    start: gridStart,
    end: addDays(
      startOfWeek(endOfMonth(monthStart), {
        weekStartsOn: CALENDAR_WEEK_STARTS_ON,
      }),
      6
    ),
  });

  const monthHolidayEntries = useMemo(() => {
    const monthKey = format(monthCursor, "yyyy-MM");
    return Object.entries(holidaysByDate)
      .filter(([dateStr]) => dateStr.startsWith(monthKey))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [holidaysByDate, monthCursor]);

  function holidayTitle(dateStr: string) {
    const list = holidaysByDate[dateStr];
    if (!list?.length) return undefined;
    return list.map((h) => `${h.localName || h.name} (${h.countryCode})`).join(", ");
  }

  return (
    <div className="mealdesk-card p-5">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Add meal for employee</h3>
      </div>

      <form action={formAction} className="mt-5 space-y-5">
        <input type="hidden" name="dateMode" value={dateMode} />
        <input type="hidden" name="status" value="MEAL_TAKEN" />
        {selectedIds.map((id) => (
          <input key={id} type="hidden" name="employeeIds" value={id} />
        ))}
        {dateMode === "range" ? (
          <>
            <input type="hidden" name="startDate" value={startDate} />
            <input type="hidden" name="endDate" value={endDate} />
          </>
        ) : (
          selectedDates.map((d) => <input key={d} type="hidden" name="dates" value={d} />)
        )}

        {/* Employees */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Employees
            </p>
            <p className="text-xs text-muted-foreground">{selectedIds.length} selected</p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Select employee / search"
              className="h-10 rounded-xl border-border bg-white pl-9 text-sm"
            />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {selectedEmployees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedEmployees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggleEmployee(emp.id)}
                  className="mealdesk-chip"
                >
                  {employeeShortName(emp.fullName)}
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : null}

          {dropdownOpen ? (
            <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <label className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-2.5 text-sm hover:bg-secondary/80">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                <span className="font-medium">Select all</span>
              </label>
              <div className="max-h-44 overflow-y-auto">
                {filtered.map((emp) => {
                  const checked = selectedIds.includes(emp.id);
                  return (
                    <label
                      key={emp.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary/60"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEmployee(emp.id)}
                      />
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                        {employeeInitials(emp.fullName)}
                      </span>
                      <span className="font-medium">{emp.fullName}</span>
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                className="w-full border-t border-border px-3 py-2 text-left text-xs text-muted-foreground hover:bg-secondary"
                onClick={() => setDropdownOpen(false)}
              >
                Done
              </button>
            </div>
          ) : null}
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Date selection
          </p>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
            <button
              type="button"
              onClick={() => setDateMode("range")}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                dateMode === "range" ? "bg-white shadow-sm" : "text-muted-foreground"
              )}
            >
              Date range
            </button>
            <button
              type="button"
              onClick={() => setDateMode("selected")}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                dateMode === "selected" ? "bg-white shadow-sm" : "text-muted-foreground"
              )}
            >
              Individual dates
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Start date</p>
              <Input
                type="date"
                value={startDate}
                disabled={dateMode === "selected"}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(
                  "h-10 rounded-xl",
                  dateMode === "selected" && "cursor-not-allowed opacity-50"
                )}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">End date</p>
              <Input
                type="date"
                value={endDate}
                disabled={dateMode === "selected"}
                onChange={(e) => setEndDate(e.target.value)}
                className={cn(
                  "h-10 rounded-xl",
                  dateMode === "selected" && "cursor-not-allowed opacity-50"
                )}
              />
            </div>
          </div>

          {dateMode === "selected" ? (
            <div className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <button type="button" onClick={() => setMonthCursor((m) => subMonths(m, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold">{format(monthCursor, "MMMM yyyy")}</span>
                <button type="button" onClick={() => setMonthCursor((m) => addMonths(m, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
                {CALENDAR_WEEKDAY_HEADERS.map((d, i) => (
                  <div
                    key={d}
                    className={cn(isWeekendGridColumn(i) && "font-semibold text-slate-600")}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const selected = selectedDates.includes(dateStr);
                  const inMonth = isSameMonth(day, monthCursor);
                  const todayCell = inMonth && isToday(day);
                  const blocked =
                    inMonth && selectedIds.length > 0 && isDateBlockedForSelection(dateStr);
                  const isHoliday = inMonth && (holidaysByDate[dateStr]?.length ?? 0) > 0;
                  const isWeekend = inMonth && isWeekendDay(day);
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={!inMonth || blocked}
                      title={
                        blocked
                          ? "Meal already added for a selected employee on this date"
                          : holidayTitle(dateStr) ??
                            (isWeekend ? "Weekend (Friday or Saturday)" : undefined) ??
                            (todayCell ? "Today" : undefined)
                      }
                      onClick={() => toggleCalendarDate(dateStr)}
                      className={cn(
                        "relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm",
                        !inMonth && "invisible",
                        blocked &&
                          "cursor-not-allowed bg-muted text-muted-foreground line-through opacity-60",
                        !blocked &&
                          isHoliday &&
                          !selected &&
                          "bg-amber-50 ring-1 ring-amber-300/80",
                        !blocked &&
                          isWeekend &&
                          !isHoliday &&
                          !selected &&
                          "bg-slate-100 ring-1 ring-slate-200",
                        !blocked &&
                          selected &&
                          "bg-brand font-semibold text-brand-foreground",
                        !blocked &&
                          !selected &&
                          todayCell &&
                          !isHoliday &&
                          "ring-2 ring-brand font-semibold",
                        !blocked &&
                          !selected &&
                          !todayCell &&
                          !isHoliday &&
                          !isWeekend &&
                          "hover:bg-secondary"
                      )}
                    >
                      {format(day, "d")}
                      {isHoliday && !selected && !blocked ? (
                        <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-500" />
                      ) : null}
                      {todayCell && !selected && !blocked && !isHoliday ? (
                        <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {monthHolidayEntries.length > 0 ? (
                <ul className="mt-3 max-h-28 space-y-1 overflow-y-auto border-t border-border pt-2 text-[10px] leading-snug text-amber-950">
                  {monthHolidayEntries.map(([dateStr, list]) => (
                    <li key={dateStr}>
                      <span className="font-semibold">{format(parseISO(`${dateStr}T12:00:00`), "d MMM")}</span>
                      {": "}
                      {list.map((h) => h.localName || h.name).join(" · ")}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            {resolvedDates.length} date{resolvedDates.length === 1 ? "" : "s"} selected
            {selectedIds.length > 0 && blockedInSelection > 0
              ? ` · ${blockedInSelection} already booked (disabled on calendar)`
              : ""}
            {dateMode === "selected" && selectedIds.length > 0
              ? " · Crossed-out days already have a meal for a selected employee."
              : ""}
          </p>
        </div>

        {/* Payment calculation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Payment calculation
            </p>
            <p className="text-xs text-muted-foreground">
              Automatic · {formatBdt(perMealCharge)} / meal
            </p>
          </div>

          {lines.length === 0 || resolvedDates.length === 0 || totalMeals === 0 ? (
            <p className="rounded-xl bg-secondary px-3 py-4 text-sm text-muted-foreground">
              {resolvedDates.length > 0 && totalMeals === 0
                ? "Every selected date already has a meal for the chosen employee(s). Pick other dates."
                : "Select employees and dates to preview charges."}
            </p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {lines.map((line) => {
                const open = expandedLines.has(line.id);
                return (
                  <div key={line.id} className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{line.name}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {line.days} day{line.days === 1 ? "" : "s"}
                            {line.skipped > 0 ? ` (${line.skipped} skipped)` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleLineExpand(line.id)}
                            className="font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            {open ? "Hide" : "Show"}
                          </button>
                        </div>
                        {open ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {line.datesLabel} | {line.days} × {formatBdt(perMealCharge)}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-sm font-bold">{formatBdt(line.total)}</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between px-3 py-3">
                <span className="text-sm font-semibold">
                  Total · {totalMeals} meal{totalMeals === 1 ? "" : "s"}
                </span>
                <span className="text-base font-bold">{formatBdt(totalPaisa)}</span>
              </div>
            </div>
          )}
        </div>

        <FormMessage result={state} />

        <Button
          type="submit"
          className="h-11 w-full rounded-xl text-sm font-semibold"
          disabled={
            pending ||
            selectedIds.length === 0 ||
            resolvedDates.length === 0 ||
            totalMeals === 0 ||
            employees.length === 0
          }
        >
          <Plus className="h-4 w-4" />
          {pending ? "Adding..." : "Add Meal"}
        </Button>
      </form>
    </div>
  );
}
