"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatBdt } from "@/lib/money";
import { formatDateTime, formatDateShort } from "@/lib/dates";
import { formatPaymentRef } from "@/services/payment-service";

type HistoryPayment = {
  id: string;
  paidAt: Date;
  createdAt: Date;
  amountPaisa: number;
  appliedToMealsPaisa: number;
  advanceCreditPaisa: number;
  method: string;
  reference: string | null;
  employee: { fullName: string; employeeCode: string };
};

function statusForPayment(p: HistoryPayment) {
  if (p.advanceCreditPaisa > 0 && p.appliedToMealsPaisa === 0) return "Advance";
  if (p.advanceCreditPaisa > 0) return "Advance";
  return "Paid";
}

export function PaymentHistoryPanel({
  payments,
  summary,
}: {
  payments: HistoryPayment[];
  summary: {
    totalPaidPaisa: number;
    appliedPaisa: number;
    advancePaisa: number;
    transactionCount: number;
    employeeCount: number;
  };
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        p.employee.fullName.toLowerCase().includes(q) ||
        p.employee.employeeCode.toLowerCase().includes(q) ||
        (p.reference?.toLowerCase().includes(q) ?? false)
    );
  }, [payments, search]);

  const filteredTotals = filtered.reduce(
    (acc, p) => {
      acc.amount += p.amountPaisa;
      acc.applied += p.appliedToMealsPaisa;
      acc.advance += p.advanceCreditPaisa;
      return acc;
    },
    { amount: 0, applied: 0, advance: 0 }
  );

  return (
    <div className="mealdesk-card flex flex-col overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Recorded payments</h3>
            <p className="text-xs text-muted-foreground">Each row is a payment recorded with date and time.</p>
          </div>
          <div className="flex rounded-xl bg-secondary p-1 text-xs">
            <Link
              href="/admin/payments"
              className="rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Payment List
            </Link>
            <span className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-brand-foreground shadow-sm">
              Payment History
            </span>
          </div>
        </div>

        <div className="relative mt-4 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, ID or reference"
            className="h-9 rounded-xl pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Payment date</th>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Amount paid</th>
              <th className="px-4 py-3 font-medium">Applied to meals</th>
              <th className="px-4 py-3 font-medium">Advance credit</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No recorded payments yet.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium">{formatDateTime(p.paidAt)}</p>
                    <p className="text-xs text-muted-foreground">{formatPaymentRef(p.createdAt, p.id)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.employee.fullName}</p>
                    <p className="text-xs text-muted-foreground">{p.employee.employeeCode}</p>
                  </td>
                  <td className="px-4 py-3">{p.method.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.reference || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatBdt(p.amountPaisa)}</td>
                  <td className="px-4 py-3">{formatBdt(p.appliedToMealsPaisa)}</td>
                  <td className="px-4 py-3">{formatBdt(p.advanceCreditPaisa)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {statusForPayment(p)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filtered.length > 0 ? (
            <tfoot>
              <tr className="bg-secondary/30 text-sm font-semibold">
                <td className="px-4 py-3" colSpan={4}>
                  Filtered total · {filtered.length} recorded payment{filtered.length === 1 ? "" : "s"}
                </td>
                <td className="px-4 py-3">{formatBdt(filteredTotals.amount)}</td>
                <td className="px-4 py-3">{formatBdt(filteredTotals.applied)}</td>
                <td className="px-4 py-3">{formatBdt(filteredTotals.advance)}</td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
        <span>
          Paid = applied to meals. Advance = includes credit for future meals. Outstanding balances remain in
          Payment List.
        </span>
        <span>
          {summary.transactionCount} transactions · {summary.employeeCount} employees · Total{" "}
          {formatBdt(summary.totalPaidPaisa)}
        </span>
      </div>
    </div>
  );
}
