import Link from "next/link";
import { listEmployees } from "@/services/employee-service";
import { PageHeader } from "@/components/ui/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const employees = await listEmployees(q);

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Create and manage office employees."
        actions={
          <Link href="/admin/employees/new" className={cn(buttonVariants())}>
            Add employee
          </Link>
        }
      />

      <form className="mb-4 flex gap-2">
        <Input name="q" placeholder="Search name, ID, department..." defaultValue={q ?? ""} />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {employees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No employees found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Account</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>{emp.employeeCode}</TableCell>
                  <TableCell>{emp.fullName}</TableCell>
                  <TableCell>{emp.department || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge value={emp.status} />
                  </TableCell>
                  <TableCell>{emp.user?.username ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/employees/${emp.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
