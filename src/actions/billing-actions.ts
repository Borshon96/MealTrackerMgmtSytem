"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { billingPeriodSchema } from "@/lib/validations";
import * as billingService from "@/services/billing-service";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export async function generateBillsAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = billingPeriodSchema.safeParse({
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid dates" };
    }
    const result = await billingService.generateBills(
      parsed.data.startDate,
      parsed.data.endDate
    );
    revalidatePath("/admin/billing");
    return {
      ok: true,
      message: `Generated ${result.billCount} bill(s) for the period`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to generate bills" };
  }
}

export async function closePeriodAction(periodId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await billingService.closeBillingPeriod(periodId);
    revalidatePath("/admin/billing");
    return { ok: true, message: "Billing period closed" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to close period" };
  }
}
