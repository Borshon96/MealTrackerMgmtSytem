"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setMealStatusAction, bulkMealStatusAction } from "@/actions/meal-actions";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatBdt } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = {
  employee: { id: string; fullName: string; employeeCode: string };
  record: {
    status: "MEAL_TAKEN" | "NOT_TAKEN" | "PENDING";
    employeeChargePaisa: number;
  } | null;
};

export function MealRegister({
  date,
  rows,
  summary,
}: {
  date: string;
  rows: Row[];
  summary: {
    mealCount: number;
    totalCostPaisa: number;
    employeeChargesPaisa: number;
    officeSubsidyPaisa: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(employeeId: string, status: string) {
    const fd = new FormData();
    fd.set("employeeId", employeeId);
    fd.set("date", date);
    fd.set("status", status);
    startTransition(async () => {
      await setMealStatusAction(null, fd);
      router.refresh();
    });
  }

  function bulk(status: string) {
    const fd = new FormData();
    fd.set("date", date);
    fd.set("status", status);
    startTransition(async () => {
      await bulkMealStatusAction(null, fd);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => bulk("MEAL_TAKEN")}>
          Mark all taken
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => bulk("NOT_TAKEN")}>
          Mark all not taken
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => bulk("PENDING")}>
          Mark all pending
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4 text-sm">
        <div className="rounded-lg border p-3">Meals taken: <strong>{summary.mealCount}</strong></div>
        <div className="rounded-lg border p-3">Total cost: <strong>{formatBdt(summary.totalCostPaisa)}</strong></div>
        <div className="rounded-lg border p-3">Employee share: <strong>{formatBdt(summary.employeeChargesPaisa)}</strong></div>
        <div className="rounded-lg border p-3">Office share: <strong>{formatBdt(summary.officeSubsidyPaisa)}</strong></div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active employees to show.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Charge</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ employee, record }) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="font-medium">{employee.fullName}</div>
                    <div className="text-xs text-muted-foreground">{employee.employeeCode}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={record?.status ?? "PENDING"} />
                  </TableCell>
                  <TableCell>{formatBdt(record?.employeeChargePaisa ?? 0)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => setStatus(employee.id, "MEAL_TAKEN")}
                      >
                        Taken
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => setStatus(employee.id, "NOT_TAKEN")}
                      >
                        Not taken
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => setStatus(employee.id, "PENDING")}
                      >
                        Pending
                      </Button>
                    </div>
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
