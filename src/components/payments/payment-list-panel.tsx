"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatBdt } from "@/lib/money";
import { formatDateShort } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { EmployeePaymentRow } from "@/services/payment-service";

function methodLabel(method: string | null) {
  if (!method) return "—";
  return method.replaceAll("_", " ");
}

function StatusPill({ status }: { status: EmployeePaymentRow["status"] }) {
  const config = {
    DUE: { label: "Due", dot: "bg-brand", className: "text-foreground" },
    PAID: { label: "Paid", dot: "bg-gray-300", className: "text-muted-foreground" },
    ADVANCE: { label: "Advance", dot: "bg-sky-400", className: "text-sky-800" },
  }[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", config.className)}>
      <span className={cn("h-2 w-2 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export function PaymentListPanel({
  rows,
  summary,
  onPayNow,
}: {
  rows: EmployeePaymentRow[];
  summary: {
    outstandingPaisa: number;
    dueEmployees: number;
    advancePaisa: number;
    advanceEmployees: string[];
    settledCount: number;
  };
  onPayNow: (row: EmployeePaymentRow) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        row.fullName.toLowerCase().includes(q) ||
        row.employeeCode.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const totalOutstanding = filtered.reduce((s, r) => s + r.duePaisa, 0);

  return (
    <div className="mealdesk-card flex flex-col overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Payment List</h3>
            <p className="text-xs text-muted-foreground">Current meal balances for your employees.</p>
          </div>
          <div className="flex rounded-xl bg-secondary p-1 text-xs">
            <span className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-brand-foreground shadow-sm">
              Payment List
            </span>
            <Link
              href="/admin/payments/history"
              className="rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Payment History
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-brand px-4 py-3">
            <p className="text-xs font-medium text-brand-foreground/80">Outstanding amount</p>
            <p className="text-xl font-bold">{formatBdt(summary.outstandingPaisa)}</p>
            <p className="text-xs text-brand-foreground/80">
              {summary.dueEmployees} employee{summary.dueEmployees === 1 ? "" : "s"} with a payment due
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-muted-foreground">Advance credit</p>
            <p className="text-xl font-bold">{formatBdt(summary.advancePaisa)}</p>
            <p className="text-xs text-muted-foreground">
              {summary.advanceEmployees.length > 0
                ? `Available for ${summary.advanceEmployees[0]}${summary.advanceEmployees.length > 1 ? " and others" : ""}'s future meals`
                : "No advance credit"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-muted-foreground">Settled balances</p>
            <p className="text-xl font-bold">{summary.settledCount} employee{summary.settledCount === 1 ? "" : "s"}</p>
            <p className="text-xs text-muted-foreground">No outstanding meal amount</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee or ID"
              className="h-9 rounded-xl pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-input bg-white px-3 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="DUE">Due</option>
            <option value="PAID">Paid</option>
            <option value="ADVANCE">Advance</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Ref.</th>
              <th className="px-4 py-3 font-medium">Amount Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No employees with meal balances yet. Add meals first.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isDue = row.status === "DUE";
                return (
                  <tr
                    key={row.employeeId}
                    className={cn(
                      "border-b border-border",
                      isDue && "bg-brand-soft/40"
                    )}
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.latestMealDate ? formatDateShort(row.latestMealDate) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.fullName}</p>
                      <p className="text-xs text-muted-foreground">{row.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3">{methodLabel(row.lastMethod)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.lastReference || "—"}</td>
                    <td className="px-4 py-3 font-semibold">
                      {row.status === "ADVANCE" ? (
                        <span className="text-sky-700">
                          -{formatBdt(row.creditPaisa)}
                          <span className="block text-[10px] font-normal text-muted-foreground">
                            Available credit
                          </span>
                        </span>
                      ) : (
                        formatBdt(row.duePaisa)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        disabled={row.status !== "DUE" || row.duePaisa <= 0}
                        onClick={() => onPayNow(row)}
                      >
                        Pay Now
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Showing {filtered.length} employee{filtered.length === 1 ? "" : "s"}</span>
        <span>Total outstanding {formatBdt(totalOutstanding)}</span>
      </div>

      <div className="space-y-1 border-t border-border bg-secondary/30 px-4 py-3 text-[11px] text-muted-foreground">
        <p>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-brand align-middle" />
          Lime rows have an outstanding payment. Due amounts are not recorded payments.
        </p>
        <p>
          A negative balance is an advance credit. Paid and advance balances do not require payment.
        </p>
      </div>
    </div>
  );
}
