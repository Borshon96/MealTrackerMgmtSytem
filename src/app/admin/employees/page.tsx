import Link from "next/link";
import { listEmployees } from "@/services/employee-service";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import { employeesPageHref } from "@/lib/admin-routes";
import { EmployeeForm } from "@/components/forms/employee-form";
import { EmployeeListPanel } from "@/components/employees/employee-list-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; id?: string }>;
}) {
  const { q, id } = await searchParams;
  const employees = await listEmployees(q);

  const selected = id
    ? await prisma.employee.findUnique({
        where: { id },
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          department: true,
          phone: true,
          joiningDate: true,
          status: true,
          notes: true,
        },
      })
    : null;

  const listItems = employees.map((emp) => ({
    id: emp.id,
    employeeCode: emp.employeeCode,
    fullName: emp.fullName,
    department: emp.department,
    status: emp.status,
    linkedUsername: emp.user?.username ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Employees</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Add or update employees on the left. Select a row on the right to edit.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <div className="mealdesk-card space-y-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">
                {selected ? "Edit employee" : "Add employee"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selected
                  ? `${selected.employeeCode} · ${selected.fullName}`
                  : "Create a new employee record."}
              </p>
            </div>
            {selected ? (
              <Link
                href={employeesPageHref({ q })}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
              >
                New
              </Link>
            ) : null}
          </div>

          <EmployeeForm
            key={selected?.id ?? "new"}
            employee={
              selected
                ? {
                    id: selected.id,
                    employeeCode: selected.employeeCode,
                    fullName: selected.fullName,
                    department: selected.department,
                    phone: selected.phone,
                    joiningDate: formatDate(selected.joiningDate),
                    status: selected.status as "ACTIVE" | "INACTIVE",
                    notes: selected.notes,
                  }
                : undefined
            }
          />
        </div>

        <div className="mealdesk-card space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold">All employees</h2>
            <form className="flex w-full max-w-xl gap-2 sm:min-w-[420px]">
              {id ? <input type="hidden" name="id" value={id} /> : null}
              <Input
                name="q"
                placeholder="Search name, ID, department..."
                defaultValue={q ?? ""}
                className="h-9 min-w-0 flex-1 rounded-xl"
              />
              <Button type="submit" variant="outline" className="h-9 shrink-0 rounded-xl">
                Search
              </Button>
            </form>
          </div>

          <EmployeeListPanel employees={listItems} selectedId={selected?.id} query={q} />
        </div>
      </div>
    </div>
  );
}
