"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { settingsSchema } from "@/lib/validations";
import { updateSettings } from "@/lib/settings";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateSettingsAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = settingsSchema.safeParse({
      mealPriceBdt: formData.get("mealPriceBdt"),
      employeeSharePct: formData.get("employeeSharePct"),
      officeSharePct: formData.get("officeSharePct"),
      weekStartDay: formData.get("weekStartDay"),
      companyName: formData.get("companyName"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid settings" };
    }
    await updateSettings(parsed.data);
    revalidatePath("/admin/settings");
    revalidatePath("/admin/meals");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save settings" };
  }
}
