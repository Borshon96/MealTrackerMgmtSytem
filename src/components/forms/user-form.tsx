"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, updateUserAction, type ActionResult } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/forms/form-message";
import { usersPageHref } from "@/lib/admin-routes";
import { formControlClassName } from "@/lib/form-field-styles";

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
  const router = useRouter();
  const isEdit = Boolean(user?.id);
  const action = isEdit ? updateUserAction.bind(null, user!.id!) : createUserAction;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    if (state.id && !user?.id) {
      router.push(usersPageHref({ id: state.id }));
    }
  }, [state, router, user?.id]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="user-username">Username</Label>
        <Input
          id="user-username"
          name="username"
          defaultValue={user?.username}
          required
          className={formControlClassName}
        />
      </div>
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          name="email"
          type="email"
          defaultValue={user?.email}
          required
          className={formControlClassName}
        />
      </div>
      {!isEdit ? (
        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="user-create-password">Password</Label>
          <Input
            id="user-create-password"
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            className={formControlClassName}
          />
        </div>
      ) : null}
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="user-role">Role</Label>
        <select
          id="user-role"
          name="role"
          defaultValue={user?.role ?? "EMPLOYEE"}
          className={formControlClassName}
        >
          <option value="ADMIN">Admin</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="user-status">Status</Label>
        <select
          id="user-status"
          name="status"
          defaultValue={user?.status ?? "ACTIVE"}
          className={formControlClassName}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="user-employeeId">Linked employee</Label>
        <select
          id="user-employeeId"
          name="employeeId"
          defaultValue={user?.employeeId ?? ""}
          className={formControlClassName}
        >
          <option value="">None</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.employeeCode} — {e.fullName}
            </option>
          ))}
        </select>
      </div>
      <div className="flex w-full items-start gap-2">
        <input
          id="user-forcePasswordChange"
          name="forcePasswordChange"
          type="checkbox"
          defaultChecked={user?.forcePasswordChange}
          className="mt-1"
        />
        <Label htmlFor="user-forcePasswordChange" className="font-normal leading-snug">
          Force password change on next login
        </Label>
      </div>
      <div className="flex w-full flex-col gap-2 pt-1">
        <FormMessage result={state} />
        <Button type="submit" className="h-10 w-full rounded-xl" disabled={pending}>
          {pending ? "Saving..." : isEdit ? "Update user" : "Create user"}
        </Button>
      </div>
    </form>
  );
}
