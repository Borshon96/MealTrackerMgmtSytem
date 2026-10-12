"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { mealStatusSchema } from "@/lib/validations";
import { datesInRange } from "@/lib/dates";
import * as mealService from "@/services/meal-service";

export type ActionResult =
  | { ok: true; count?: number; message?: string }
  | { ok: false; error: string };

export async function setMealStatusAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const status = mealStatusSchema.parse(formData.get("status"));
    const employeeId = String(formData.get("employeeId") || "");
    const dateStr = String(formData.get("date") || "");
    if (!employeeId || !dateStr) return { ok: false, error: "Missing employee or date" };

    await mealService.upsertMealStatus({
      employeeId,
      dateStr,
      status,
      remarks: String(formData.get("remarks") || "") || undefined,
    });
    revalidatePath("/admin/meals");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update meal" };
  }
}

export async function bulkMealStatusAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const status = mealStatusSchema.parse(formData.get("status"));
    const dateStr = String(formData.get("date") || "");
    if (!dateStr) return { ok: false, error: "Date is required" };

    const count = await mealService.bulkSetMealStatus({ dateStr, status });
    revalidatePath("/admin/meals");
    return { ok: true, count };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Bulk update failed" };
  }
}

export async function addMealsForSelectionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const employeeIds = formData
      .getAll("employeeIds")
      .map(String)
      .filter(Boolean);
    const dateMode = String(formData.get("dateMode") || "range");
    const status = mealStatusSchema.parse(formData.get("status") || "MEAL_TAKEN");
    const remarks = String(formData.get("remarks") || "") || undefined;

    let dates: string[] = [];
    if (dateMode === "selected") {
      dates = formData.getAll("dates").map(String).filter(Boolean);
    } else {
      const startDate = String(formData.get("startDate") || "");
      const endDate = String(formData.get("endDate") || "");
      if (!startDate || !endDate) {
        return { ok: false, error: "Start and end dates are required" };
      }
      dates = datesInRange(startDate, endDate);
      if (dates.length === 0) {
        return { ok: false, error: "End date must be on or after start date" };
      }
    }

    const result = await mealService.addMealsForSelection({
      employeeIds,
      dates,
      status,
      remarks,
    });

    revalidatePath("/admin/meals");
    return {
      ok: true,
      count: result.written,
      message: `Saved ${result.written} meal record(s) for ${result.employeeCount} employee(s) across ${result.dayCount} day(s).`,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to add meals",
    };
  }
}
