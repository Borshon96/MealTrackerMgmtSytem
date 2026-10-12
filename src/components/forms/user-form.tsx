"use client";

import { useActionState } from "react";
import { createUserAction, updateUserAction, type ActionResult } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/forms/form-message";

type EmployeeOption = { id: string; fullName: string; employeeCode: string };

type UserValues = {
  id?: string;
  username: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  employeeId?: string | null;
  forcePasswordChange?: boolean;
};

export function UserForm({
  user,
  employees,
}: {
  user?: UserValues;
  employees: EmployeeOption[];
}) {
  const action = user?.id ? updateUserAction.bind(null, user.id) : createUserAction;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={user?.username} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={user?.email} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{user ? "New password (optional)" : "Password"}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={user ? undefined : 8}
          required={!user}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue={user?.role ?? "EMPLOYEE"}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="ADMIN">Admin</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={user?.status ?? "ACTIVE"}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="employeeId">Linked employee</Label>
        <select
          id="employeeId"
          name="employeeId"
          defaultValue={user?.employeeId ?? ""}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">None</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.employeeCode} — {e.fullName}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 sm:col-span-2">
        <input
          id="forcePasswordChange"
          name="forcePasswordChange"
          type="checkbox"
          defaultChecked={user?.forcePasswordChange}
        />
        <Label htmlFor="forcePasswordChange">Force password change on next login</Label>
      </div>
      <div className="sm:col-span-2 space-y-2">
        <FormMessage result={state} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : user ? "Update user" : "Create user"}
        </Button>
      </div>
    </form>
  );
}
