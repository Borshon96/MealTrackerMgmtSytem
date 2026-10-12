import Link from "next/link";
import { listUsers } from "@/services/user-service";
import { listEmployees } from "@/services/employee-service";
import { prisma } from "@/lib/prisma";
import { usersPageHref } from "@/lib/admin-routes";
import { UserForm } from "@/components/forms/user-form";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { UserListPanel } from "@/components/users/user-list-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; id?: string }>;
}) {
  const { q, id } = await searchParams;
  const [users, employees] = await Promise.all([listUsers(q), listEmployees()]);

  const selected = id
    ? await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          employeeId: true,
          forcePasswordChange: true,
        },
      })
    : null;

  const employeeOptions = employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    employeeCode: e.employeeCode,
  }));

  const listItems = users.map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    employeeLabel: user.employee
      ? `${user.employee.employeeCode} — ${user.employee.fullName}`
      : null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Users</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Create or update accounts on the left. Select a user on the right to edit.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(340px,400px)_minmax(0,1fr)]">
        <div className="mealdesk-card flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">{selected ? "Edit user" : "Add user"}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selected
                  ? `@${selected.username}`
                  : "Create a login and link an employee if needed."}
              </p>
            </div>
            {selected ? (
              <Link
                href={usersPageHref({ q })}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
              >
                New
              </Link>
            ) : null}
          </div>

          <UserForm
            key={selected?.id ?? "new"}
            user={
              selected
                ? {
                    id: selected.id,
                    username: selected.username,
                    email: selected.email,
                    role: selected.role as "ADMIN" | "EMPLOYEE",
                    status: selected.status as "ACTIVE" | "INACTIVE" | "SUSPENDED",
                    employeeId: selected.employeeId,
                    forcePasswordChange: selected.forcePasswordChange,
                  }
                : undefined
            }
            employees={employeeOptions}
          />

          {selected ? (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Password
                </h3>
                <ResetPasswordForm key={selected.id} userId={selected.id} />
              </div>
            </>
          ) : null}
        </div>

        <div className="mealdesk-card space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold">All users</h2>
            <form className="flex w-full max-w-xl gap-2 sm:min-w-[420px]">
              {id ? <input type="hidden" name="id" value={id} /> : null}
              <Input
                name="q"
                placeholder="Search username or email..."
                defaultValue={q ?? ""}
                className="h-9 min-w-0 flex-1 rounded-xl"
              />
              <Button type="submit" variant="outline" className="h-9 shrink-0 rounded-xl">
                Search
              </Button>
            </form>
          </div>

          <UserListPanel users={listItems} selectedId={selected?.id} query={q} />
        </div>
      </div>
    </div>
  );
}
