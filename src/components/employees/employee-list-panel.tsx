"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { employeesPageHref } from "@/lib/admin-routes";

export type EmployeeListItem = {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string | null;
  status: string;
  linkedUsername: string | null;
};

export function EmployeeListPanel({
  employees,
  selectedId,
  query,
}: {
  employees: EmployeeListItem[];
  selectedId?: string;
  query?: string;
}) {
  const router = useRouter();

  if (employees.length === 0) {
    return <p className="text-sm text-muted-foreground">No employees found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Account</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => (
            <TableRow
              key={emp.id}
              onClick={() => router.push(employeesPageHref({ q: query, id: emp.id }))}
              className={cn(
                "cursor-pointer transition-colors hover:bg-secondary/70",
                selectedId === emp.id && "bg-brand-soft/50"
              )}
            >
              <TableCell className="font-medium">{emp.employeeCode}</TableCell>
              <TableCell>{emp.fullName}</TableCell>
              <TableCell>{emp.department || "—"}</TableCell>
              <TableCell>
                <StatusBadge value={emp.status} />
              </TableCell>
              <TableCell>{emp.linkedUsername ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
