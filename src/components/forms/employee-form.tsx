"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createEmployeeAction,
  updateEmployeeAction,
  type ActionResult,
} from "@/actions/employee-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/forms/form-message";
import { formatDate } from "@/lib/dates";
import { employeesPageHref } from "@/lib/admin-routes";
import { formControlClassName, formTextareaClassName } from "@/lib/form-field-styles";

type EmployeeValues = {
  id?: string;
  employeeCode: string;
  fullName: string;
  department?: string | null;
  phone?: string | null;
  joiningDate: Date | string;
  status: "ACTIVE" | "INACTIVE";
  notes?: string | null;
};

export function EmployeeForm({ employee }: { employee?: EmployeeValues }) {
  const router = useRouter();
  const action = employee?.id
    ? updateEmployeeAction.bind(null, employee.id)
    : createEmployeeAction;

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    if (state.id && !employee?.id) {
      router.push(employeesPageHref({ id: state.id }));
    }
  }, [state, router, employee?.id]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="employeeCode">Employee ID</Label>
        <Input
          id="employeeCode"
          name="employeeCode"
          defaultValue={employee?.employeeCode}
          required
          className={formControlClassName}
        />
      </div>
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={employee?.fullName}
          required
          className={formControlClassName}
        />
      </div>
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          name="department"
          defaultValue={employee?.department ?? ""}
          className={formControlClassName}
        />
      </div>
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          defaultValue={employee?.phone ?? ""}
          className={formControlClassName}
        />
      </div>
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="joiningDate">Joining date</Label>
        <Input
          id="joiningDate"
          name="joiningDate"
          type="date"
          defaultValue={
            employee?.joiningDate ? formatDate(employee.joiningDate) : undefined
          }
          required
          className={formControlClassName}
        />
      </div>
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={employee?.status ?? "ACTIVE"}
          className={formControlClassName}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={employee?.notes ?? ""}
          rows={3}
          className={formTextareaClassName}
        />
      </div>
      <div className="flex w-full flex-col gap-2">
        <FormMessage result={state} />
        <Button type="submit" className="h-10 w-full rounded-xl" disabled={pending}>
          {pending ? "Saving..." : employee ? "Update employee" : "Create employee"}
        </Button>
      </div>
    </form>
  );
}
