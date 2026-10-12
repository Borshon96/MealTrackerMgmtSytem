import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { listEmployees } from "@/services/employee-service";
import { getPaymentHistorySummary } from "@/services/payment-service";
import { RecordPaymentForm } from "@/components/payments/record-payment-form";
import { PaymentHistoryPanel } from "@/components/payments/payment-history-panel";
import { StatCard } from "@/components/ui/stat-card";
import { formatBdt } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateShort } from "@/lib/dates";

export default async function PaymentHistoryPage() {
  const [employees, history] = await Promise.all([
    listEmployees(),
    getPaymentHistorySummary(),
  ]);

  const activeEmployees = employees
    .filter((e) => e.status === "ACTIVE")
    .map((e) => ({
      id: e.id,
      fullName: e.fullName,
      employeeCode: e.employeeCode,
    }));

  const dates =
    history.payments.length > 0
      ? {
          from: formatDateShort(history.payments[history.payments.length - 1].paidAt),
          to: formatDateShort(history.payments[0].paidAt),
        }
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review recorded payments and see how each payment was applied.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/payments"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-2 rounded-xl bg-white")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Payments
          </Link>
          <Link
            href="/api/export/payments"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-2 rounded-xl bg-white")}
          >
            <Download className="h-4 w-4" />
            Export
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total amount paid"
          value={formatBdt(history.totalPaidPaisa)}
          hint={`Received across ${history.transactionCount} recorded payment${history.transactionCount === 1 ? "" : "s"}`}
        />
        <StatCard
          title="Applied to meals"
          value={formatBdt(history.appliedPaisa)}
          hint="Meal balances settled by these payments"
        />
        <StatCard
          title="Advance credited"
          value={formatBdt(history.advancePaisa)}
          hint="Excess payments stored as meal credit"
        />
        <StatCard
          title="Recorded payments"
          value={`${history.transactionCount} transactions`}
          hint={
            dates
              ? `${dates.from} – ${dates.to} · ${history.employeeCount} employees`
              : `${history.employeeCount} employees`
          }
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
        <RecordPaymentForm employees={activeEmployees} />
        <PaymentHistoryPanel payments={history.payments} summary={history} />
      </div>
    </div>
  );
}
