"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  format,
  parseISO,
  subDays,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isPastCalendarDate, todayInputValue } from "@/lib/dates";
import { formatBdt } from "@/lib/money";
import { cn } from "@/lib/utils";
import type {
  CalendarDay,
  MealCalendarSummary,
  MonthCalendarCell,
} from "@/services/meal-calendar-service";
import type { HolidayOnDate } from "@/services/holiday-service";
import { formatDateShort } from "@/lib/dates";
import {
  CALENDAR_WEEKDAY_HEADERS,
  isWeekendGridColumn,
} from "@/lib/work-week";
import { CancelMealButton } from "@/components/meals/cancel-meal-button";
import { HolidayStrip } from "@/components/meals/holiday-strip";

export type MealCalendarView = "day" | "week" | "month";

const WEEK_VISIBLE_MEALS = 4;

function collectPeriodHolidays(
  days: CalendarDay[],
  monthCells?: MonthCalendarCell[]
): { dateStr: string; holidays: HolidayOnDate[] }[] {
  const source = monthCells?.filter((c) => c.inMonth) ?? days;
  return source
    .filter((d) => (d.holidays?.length ?? 0) > 0)
    .map((d) => ({ dateStr: d.dateStr, holidays: d.holidays ?? [] }))
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}

function adminMealsHref(view: MealCalendarView, date: string) {
  return `/admin/meals?view=${view}&date=${date}`;
}

function DayMealsList({
  day,
  limit,
}: {
  day: CalendarDay;
  limit?: number;
}) {
  const meals = limit ? day.meals.slice(0, limit) : day.meals;
  const hiddenCount = limit ? day.meals.length - meals.length : 0;

  if (day.meals.length === 0) {
    return <p className="px-1 py-3 text-[11px] text-muted-foreground">—</p>;
  }

  return (
    <>
      {meals.map((meal) => (
        <div
          key={meal.id}
          className={cn(
            "rounded-lg border px-2 py-2 text-[11px]",
            meal.paymentStatus === "DUE" ? "border-due bg-due-soft" : "border-paid bg-paid-soft"
          )}
        >
          <div className="flex items-start justify-between gap-1">
            <p className="truncate font-semibold leading-tight">{meal.employeeName}</p>
            {!isPastCalendarDate(day.dateStr) ? (
              <CancelMealButton mealId={meal.id} employeeName={meal.employeeName} />
            ) : null}
          </div>
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="inline-flex items-center gap-1">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  meal.paymentStatus === "DUE" ? "bg-due" : "bg-paid"
                )}
              />
              <span
                className={cn(
                  "font-medium",
                  meal.paymentStatus === "DUE" ? "text-due" : "text-paid"
                )}
              >
                {meal.paymentStatus === "DUE" ? "Due" : "Paid"}
              </span>
            </span>
            <span
              className={cn(
                "font-semibold",
                meal.paymentStatus === "DUE" ? "text-due" : "text-paid"
              )}
            >
              {formatBdt(meal.chargePaisa)}
            </span>
          </div>
        </div>
      ))}
      {hiddenCount > 0 ? (
        <Link
          href={adminMealsHref("day", day.dateStr)}
          className="text-left text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          See all {day.meals.length} →
        </Link>
      ) : null}
    </>
  );
}

function DayColumn({ day }: { day: CalendarDay }) {
  return (
    <div
      className={cn(
        "flex min-w-[120px] flex-col bg-white",
        day.isWeekend && !day.isToday && "bg-slate-100/90",
        day.isToday && "bg-brand-soft/30"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-border px-3 py-2.5",
          day.isWeekend && !day.isToday && "bg-slate-200/50",
          day.isToday && "bg-brand-soft"
        )}
      >
        <span
          className={cn(
            "text-xs font-medium text-muted-foreground",
            day.isWeekend && "font-semibold"
          )}
        >
          {day.dayLabel}
          {day.isWeekend ? " · Weekend" : ""}
        </span>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
            day.isToday && "bg-foreground text-white"
          )}
        >
          {day.dayNumber}
        </span>
      </div>

      <HolidayStrip holidays={day.holidays} />

      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <DayMealsList day={day} limit={WEEK_VISIBLE_MEALS} />
      </div>

      <div className="border-t border-border px-2 py-2 text-[10px] leading-snug text-muted-foreground">
        {day.mealCount === 0 ? (
          "—"
        ) : day.allPaid ? (
          `${day.mealCount} meals · All paid`
        ) : (
          <>
            {day.mealCount} meals ·{" "}
            <span className="font-semibold text-due">{formatBdt(day.duePaisa)}</span> due
          </>
        )}
      </div>
    </div>
  );
}

export function MealCalendar({
  view,
  anchorDate,
  periodLabel,
  days,
  monthCells,
  summary,
  chargePerMealPaisa,
  holidayCountryCodes = [],
}: {
  view: MealCalendarView;
  anchorDate: string;
  periodLabel: string;
  days: CalendarDay[];
  monthCells?: MonthCalendarCell[];
  summary: MealCalendarSummary;
  chargePerMealPaisa: number;
  holidayCountryCodes?: string[];
}) {
  const router = useRouter();
  const today = todayInputValue();
  const anchor = parseISO(`${anchorDate}T12:00:00`);
  const periodHolidays = collectPeriodHolidays(days, monthCells);

  const prevDate =
    view === "day"
      ? format(subDays(anchor, 1), "yyyy-MM-dd")
      : view === "month"
        ? format(subMonths(startOfMonthSafe(anchor), 1), "yyyy-MM-dd")
        : format(subDays(parseISO(`${days[0]?.dateStr ?? anchorDate}T12:00:00`), 7), "yyyy-MM-dd");

  const nextDate =
    view === "day"
      ? format(addDays(anchor, 1), "yyyy-MM-dd")
      : view === "month"
        ? format(addMonths(startOfMonthSafe(anchor), 1), "yyyy-MM-dd")
        : format(addDays(parseISO(`${days[0]?.dateStr ?? anchorDate}T12:00:00`), 7), "yyyy-MM-dd");

  const viewDescription =
    view === "day"
      ? "Single-day list of meals and payment status."
      : view === "month"
        ? "Month overview — open a day for full details."
        : "Weekly view of taken meals and payment status.";

  return (
    <div className="mealdesk-card flex h-full flex-col overflow-hidden">
      <div className="border-b border-border p-5 pb-4">
        <h3 className="text-sm font-semibold">Meal Calendar</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{viewDescription}</p>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={adminMealsHref(view, prevDate)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="min-w-[160px] text-center text-sm font-semibold">{periodLabel}</span>
            <Link
              href={adminMealsHref(view, nextDate)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white hover:bg-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href={adminMealsHref(view, today)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              Today
            </Link>
          </div>

          <div className="relative max-w-[220px] flex-1">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={anchorDate}
              onChange={(e) => {
                const value = e.target.value;
                if (value) router.push(adminMealsHref(view, value));
              }}
              className="h-9 cursor-pointer rounded-xl bg-white pl-9 text-sm"
              aria-label="Jump to date"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-secondary p-1 text-xs">
              {(["day", "week", "month"] as const).map((mode) => (
                <Link
                  key={mode}
                  href={adminMealsHref(mode, anchorDate)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 capitalize",
                    view === mode
                      ? "bg-white font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode}
                </Link>
              ))}
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
            <strong className="text-due">{summary.dueCount}</strong> due ·{" "}
            <span className="font-semibold text-due">{formatBdt(summary.dueTotalPaisa)}</span>
          </span>
          <span className="ml-auto flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-paid" /> Paid
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-due" /> Due
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Holiday
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" /> Weekend (Fri–Sat)
            </span>
          </span>
        </div>

        {holidayCountryCodes.length > 0 ? (
          <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-950">
            <p className="font-semibold">
              Public holidays ({holidayCountryCodes.join(", ")}) in this {view}
            </p>
            {periodHolidays.length === 0 ? (
              <p className="mt-1 text-amber-900/80">
                None in this period. Try{" "}
                <Link href={adminMealsHref("month", "2026-03-01")} className="font-medium underline">
                  Mar 2026 (Eid)
                </Link>{" "}
                or{" "}
                <Link href={adminMealsHref("month", "2026-10-01")} className="font-medium underline">
                  Oct 2026 (Puja)
                </Link>{" "}
                for Bangladesh.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {periodHolidays.map(({ dateStr, holidays }) => (
                  <li key={dateStr}>
                    <Link
                      href={adminMealsHref("day", dateStr)}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {formatDateShort(dateStr)}
                    </Link>
                    {": "}
                    {holidays
                      .map((h) => `${h.localName || h.name} (${h.countryCode})`)
                      .join(" · ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Choose holiday calendars in Settings to show public holidays.
          </p>
        )}
      </div>

      {view === "day" && days[0] ? (
        <div className="min-h-[380px] flex-1 bg-white p-4">
          <div
            className={cn(
              "mb-4 flex items-center justify-between rounded-xl border border-border px-4 py-3",
              days[0].isWeekend && !days[0].isToday && "bg-slate-100/90",
              days[0].isToday && "border-brand bg-brand-soft/40"
            )}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {days[0].dayLabel}
                {days[0].isWeekend ? " · Weekend" : ""}
              </p>
              <p className="text-lg font-bold">{periodLabel}</p>
            </div>
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-base font-bold",
                days[0].isToday && "bg-foreground text-white"
              )}
            >
              {days[0].dayNumber}
            </span>
          </div>
          <HolidayStrip holidays={days[0].holidays} />
          <div className="flex max-w-3xl flex-col gap-2">
            <DayMealsList day={days[0]} />
          </div>
          {days[0].mealCount > 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              {days[0].allPaid
                ? `${days[0].mealCount} meals · All paid`
                : (
                    <>
                      {days[0].mealCount} meals ·{" "}
                      <span className="font-semibold text-due">
                        {formatBdt(days[0].duePaisa)}
                      </span>{" "}
                      due
                    </>
                  )}
            </p>
          ) : null}
        </div>
      ) : null}

      {view === "week" ? (
        <div className="grid min-h-[380px] flex-1 grid-cols-2 gap-0 divide-x divide-border overflow-x-auto lg:grid-cols-7">
          {days.map((day) => (
            <DayColumn key={day.dateStr} day={day} />
          ))}
        </div>
      ) : null}

      {view === "month" && monthCells ? (
        <div className="min-h-[380px] flex-1 p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
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
            {monthCells.map((cell) => (
              <Link
                key={cell.dateStr}
                href={adminMealsHref("day", cell.dateStr)}
                className={cn(
                  "flex min-h-[88px] flex-col rounded-lg border border-border p-2 text-left transition-colors hover:bg-secondary/60",
                  !cell.inMonth && "pointer-events-none border-transparent opacity-40",
                  cell.inMonth &&
                    cell.isWeekend &&
                    cell.holidays.length === 0 &&
                    !cell.isToday &&
                    "border-slate-200 bg-slate-100/80",
                  cell.isToday && cell.inMonth && "border-brand bg-brand-soft/50 ring-1 ring-brand",
                  cell.inMonth && cell.holidays.length > 0 && "border-amber-300/80 bg-amber-50/80"
                )}
              >
                <span
                  className={cn(
                    "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    cell.isToday && cell.inMonth && "bg-foreground text-white"
                  )}
                >
                  {cell.dayNumber}
                </span>
                {cell.inMonth && cell.holidays.length > 0 ? (
                  <span className="line-clamp-2 text-[9px] font-medium leading-tight text-amber-900">
                    {cell.holidays[0].localName || cell.holidays[0].name}
                  </span>
                ) : null}
                {cell.inMonth && cell.mealCount > 0 ? (
                  <>
                    <span className="text-[11px] font-semibold">
                      {cell.mealCount} meal{cell.mealCount === 1 ? "" : "s"}
                    </span>
                    {cell.duePaisa > 0 ? (
                      <span className="mt-auto text-[10px] font-medium text-due">
                        {formatBdt(cell.duePaisa)} due
                      </span>
                    ) : (
                      <span className="mt-auto text-[10px] text-paid">All paid</span>
                    )}
                  </>
                ) : cell.inMonth ? (
                  <span className="text-[10px] text-muted-foreground">—</span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-secondary/40 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
          Red = unpaid meals. Green = paid. Cancel (×) for today and future only.
        </span>
        <span>1 meal = {formatBdt(chargePerMealPaisa)}</span>
      </div>
    </div>
  );
}

function startOfMonthSafe(date: Date) {
  return parseISO(`${format(date, "yyyy-MM")}-01T12:00:00`);
}
