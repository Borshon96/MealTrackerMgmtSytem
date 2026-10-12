"use client";

import { useActionState } from "react";
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
  const action = employee?.id
    ? updateEmployeeAction.bind(null, employee.id)
    : createEmployeeAction;

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="employeeCode">Employee ID</Label>
        <Input
          id="employeeCode"
          name="employeeCode"
          defaultValue={employee?.employeeCode}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={employee?.fullName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Input id="department" name="department" defaultValue={employee?.department ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={employee?.phone ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="joiningDate">Joining date</Label>
        <Input
          id="joiningDate"
          name="joiningDate"
          type="date"
          defaultValue={
            employee?.joiningDate ? formatDate(employee.joiningDate) : undefined
          }
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={employee?.status ?? "ACTIVE"}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={employee?.notes ?? ""} rows={3} />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <FormMessage result={state} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : employee ? "Update employee" : "Create employee"}
        </Button>
      </div>
    </form>
  );
}
