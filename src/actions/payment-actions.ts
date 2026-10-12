"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { paymentSchema } from "@/lib/validations";
import * as paymentService from "@/services/payment-service";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function recordPaymentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = paymentSchema.safeParse({
      employeeId: formData.get("employeeId"),
      paidAt: formData.get("paidAt"),
      amountBdt: formData.get("amountBdt"),
      method: formData.get("method"),
      reference: formData.get("reference") || "",
      notes: formData.get("notes") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }
    await paymentService.recordPayment(parsed.data);
    revalidatePath("/admin/payments");
    revalidatePath("/admin/billing");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to record payment" };
  }
}
