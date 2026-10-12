"use server";

import { redirect } from "next/navigation";
import {
  destroySession,
  getSessionUser,
  hashPassword,
  loginWithCredentials,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema, passwordChangeSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const user = await loginWithCredentials(parsed.data.login, parsed.data.password);
    if (user.role === "ADMIN") redirect("/admin");
    redirect("/my-dashboard");
  } catch (e) {
    if (typeof e === "object" && e && "digest" in e) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "Login failed" };
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = passwordChangeSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const ok = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
    if (!ok) return { ok: false, error: "Current password is incorrect" };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(parsed.data.newPassword),
        forcePasswordChange: false,
      },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to change password" };
  }
}

export async function getCurrentUserAction() {
  return getSessionUser();
}
