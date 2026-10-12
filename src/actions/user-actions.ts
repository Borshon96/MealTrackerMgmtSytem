"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { userSchema } from "@/lib/validations";
import * as userService from "@/services/user-service";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function createUserAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = userSchema.safeParse({
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password") || "",
      role: formData.get("role"),
      status: formData.get("status") || "ACTIVE",
      employeeId: formData.get("employeeId") || "",
      forcePasswordChange: formData.get("forcePasswordChange") === "on",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }
    const user = await userService.createUser({
      ...parsed.data,
      password: parsed.data.password || "",
      employeeId: parsed.data.employeeId || null,
    });
    revalidatePath("/admin/users");
    return { ok: true, id: user.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create user";
    if (message.includes("Unique constraint")) {
      return { ok: false, error: "Username or email already exists" };
    }
    return { ok: false, error: message };
  }
}

export async function updateUserAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = userSchema.safeParse({
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password") || "",
      role: formData.get("role"),
      status: formData.get("status") || "ACTIVE",
      employeeId: formData.get("employeeId") || "",
      forcePasswordChange: formData.get("forcePasswordChange") === "on",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }
    await userService.updateUser(id, {
      ...parsed.data,
      password: parsed.data.password || undefined,
      employeeId: parsed.data.employeeId || null,
    });
    revalidatePath("/admin/users");
    return { ok: true, id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update user";
    if (message.includes("Unique constraint")) {
      return { ok: false, error: "Username or email already exists" };
    }
    return { ok: false, error: message };
  }
}

export async function resetPasswordAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const password = String(formData.get("password") || "");
    await userService.resetUserPassword(id, password);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to reset password" };
  }
}
