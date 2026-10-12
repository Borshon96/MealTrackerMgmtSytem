import Link from "next/link";
import { Clock, Download } from "lucide-react";
import { listEmployees } from "@/services/employee-service";
import {
  getPaymentListRows,
  getPaymentSummary,
} from "@/services/payment-service";
import { PaymentsWorkspace } from "@/components/payments/payments-workspace";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PaymentsPage() {
  const [employees, rows, summary] = await Promise.all([
    listEmployees(),
    getPaymentListRows(),
    getPaymentSummary(),
  ]);

  const activeEmployees = employees
    .filter((e) => e.status === "ACTIVE")
    .map((e) => ({
      id: e.id,
      fullName: e.fullName,
      employeeCode: e.employeeCode,
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Record employee payments, settle outstanding meals, and manage advance credits.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/payments/history"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-2 rounded-xl bg-white")}
          >
            <Clock className="h-4 w-4" />
            Payment History
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

      <PaymentsWorkspace employees={activeEmployees} rows={rows} summary={summary} />
    </div>
  );
}
