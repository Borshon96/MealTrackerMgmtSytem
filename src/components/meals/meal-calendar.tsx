"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Info, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isPastCalendarDate } from "@/lib/dates";
import { formatBdt } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "@/services/meal-calendar-service";
import { CancelMealButton } from "@/components/meals/cancel-meal-button";

const VISIBLE_MEALS = 4;

export function MealCalendar({
  weekStart,
  weekLabel,
  days,
  summary,
  chargePerMealPaisa,
}: {
  weekStart: string;
  weekLabel: string;
  days: CalendarDay[];
  summary: {
    totalMeals: number;
    paidCount: number;
    dueCount: number;
    dueTotalPaisa: number;
  };
  chargePerMealPaisa: number;
}) {
  const [search, setSearch] = useState("");
  const prev = format(subDays(parseISO(`${weekStart}T12:00:00`), 7), "yyyy-MM-dd");
  const next = format(addDays(parseISO(`${weekStart}T12:00:00`), 7), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");

  const filteredDays = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return days;
    return days.map((day) => ({
      ...day,
      meals: day.meals.filter(
        (m) =>
          m.employeeName.toLowerCase().includes(q) ||
          m.employeeCode.toLowerCase().includes(q)
      ),
      mealCount: day.meals.filter(
        (m) =>
          m.employeeName.toLowerCase().includes(q) ||
          m.employeeCode.toLowerCase().includes(q)
      ).length,
      duePaisa: day.meals
        .filter(
          (m) =>
            (m.employeeName.toLowerCase().includes(q) ||
              m.employeeCode.toLowerCase().includes(q)) &&
            m.paymentStatus === "DUE"
        )
        .reduce((s, m) => s + m.chargePaisa, 0),
      allPaid:
        day.meals.filter(
          (m) =>
            m.employeeName.toLowerCase().includes(q) ||
            m.employeeCode.toLowerCase().includes(q)
        ).length > 0 &&
        day.meals
          .filter(
            (m) =>
              m.employeeName.toLowerCase().includes(q) ||
              m.employeeCode.toLowerCase().includes(q)
          )
          .every((m) => m.paymentStatus === "PAID"),
    }));
  }, [days, search]);

  return (
    <div className="mealdesk-card flex h-full flex-col overflow-hidden">
      <div className="border-b border-border p-5 pb-4">
        <h3 className="text-sm font-semibold">Meal Calendar</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Weekly view of taken meals and payment status.
        </p>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/meals?week=${prev}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="min-w-[160px] text-center text-sm font-semibold">{weekLabel}</span>
            <Link
              href={`/admin/meals?week=${next}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white hover:bg-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/meals?week=${today}`}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              Today
            </Link>
          </div>

          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search date history"
              className="h-9 rounded-xl bg-white pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-secondary p-1 text-xs">
              <span className="rounded-lg px-3 py-1.5 text-muted-foreground">Day</span>
              <span className="rounded-lg bg-white px-3 py-1.5 font-semibold shadow-sm">Week</span>
              <span className="rounded-lg px-3 py-1.5 text-muted-foreground">Month</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">{summary.totalMeals}</strong> meals
          </span>
          <span>
            <strong className="text-foreground">{summary.paidCount}</strong> paid
          </span>
          <span>
            <strong className="text-foreground">{summary.dueCount}</strong> due ·{" "}
            {formatBdt(summary.dueTotalPaisa)}
          </span>
          <span className="ml-auto flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-300" /> Paid
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand" /> Due
            </span>
          </span>
        </div>
      </div>

      <div className="grid min-h-[380px] flex-1 grid-cols-2 gap-0 divide-x divide-border overflow-x-auto lg:grid-cols-7">
        {filteredDays.map((day) => {
          const visible = day.meals.slice(0, VISIBLE_MEALS);
          const hiddenCount = day.meals.length - visible.length;
          return (
            <div
              key={day.dateStr}
              className={cn(
                "flex min-w-[120px] flex-col bg-white",
                day.isToday && "bg-brand-soft/30"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-between border-b border-border px-3 py-2.5",
                  day.isToday && "bg-brand-soft"
                )}
              >
                <span className="text-xs font-medium text-muted-foreground">{day.dayLabel}</span>
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                    day.isToday && "bg-foreground text-white"
                  )}
                >
                  {day.dayNumber}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-1.5 p-2">
                {day.meals.length === 0 ? (
                  <p className="px-1 py-3 text-[11px] text-muted-foreground">—</p>
                ) : (
                  <>
                    {visible.map((meal) => (
                      <div
                        key={meal.id}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-[11px]",
                          meal.paymentStatus === "DUE"
                            ? "border-brand/50 bg-brand-soft"
                            : "border-border bg-white"
                        )}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="truncate font-semibold leading-tight">{meal.employeeName}</p>
                          {!isPastCalendarDate(day.dateStr) ? (
                            <CancelMealButton mealId={meal.id} employeeName={meal.employeeName} />
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                meal.paymentStatus === "DUE" ? "bg-brand" : "bg-gray-300"
                              )}
                            />
                            {meal.paymentStatus === "DUE" ? "Due" : "Paid"}
                          </span>
                          <span className="font-semibold">{formatBdt(meal.chargePaisa)}</span>
                        </div>
                      </div>
                    ))}
                    {hiddenCount > 0 ? (
                      <button
                        type="button"
                        className="text-left text-[11px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        See All →
                      </button>
                    ) : null}
                  </>
                )}
              </div>

              <div className="border-t border-border px-2 py-2 text-[10px] leading-snug text-muted-foreground">
                {day.mealCount === 0
                  ? "—"
                  : day.allPaid
                    ? `${day.mealCount} meals · All paid`
                    : `${day.mealCount} meals · ${formatBdt(day.duePaisa)} due`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-secondary/40 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
          Lime entries have an outstanding payment. Cancel (×) is available for today and future meals only.
        </span>
        <span>1 meal = {formatBdt(chargePerMealPaisa)}</span>
      </div>
    </div>
  );
}
