"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { employeeSchema } from "@/lib/validations";
import * as employeeService from "@/services/employee-service";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function createEmployeeAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = employeeSchema.safeParse({
      employeeCode: formData.get("employeeCode"),
      fullName: formData.get("fullName"),
      department: formData.get("department") || "",
      phone: formData.get("phone") || "",
      joiningDate: formData.get("joiningDate"),
      status: formData.get("status") || "ACTIVE",
      notes: formData.get("notes") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }
    const emp = await employeeService.createEmployee(parsed.data);
    revalidatePath("/admin/employees");
    return { ok: true, id: emp.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create employee";
    if (message.includes("Unique constraint")) {
      return { ok: false, error: "Employee ID already exists" };
    }
    return { ok: false, error: message };
  }
}

export async function updateEmployeeAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = employeeSchema.safeParse({
      employeeCode: formData.get("employeeCode"),
      fullName: formData.get("fullName"),
      department: formData.get("department") || "",
      phone: formData.get("phone") || "",
      joiningDate: formData.get("joiningDate"),
      status: formData.get("status") || "ACTIVE",
      notes: formData.get("notes") || "",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }
    await employeeService.updateEmployee(id, parsed.data);
    revalidatePath("/admin/employees");
    revalidatePath(`/admin/employees/${id}`);
    return { ok: true, id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update employee";
    if (message.includes("Unique constraint")) {
      return { ok: false, error: "Employee ID already exists" };
    }
    return { ok: false, error: message };
  }
}
