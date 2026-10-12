import Link from "next/link";
import { listBillingPeriods } from "@/services/billing-service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingForm } from "@/components/forms/billing-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatBdt } from "@/lib/money";
import { formatDisplayDate } from "@/lib/dates";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClosePeriodButton } from "@/components/forms/close-period-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BillingPage() {
  const periods = await listBillingPeriods();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Weekly billing"
        description="Generate employee bills for a date range. Open periods can be regenerated."
      />

      <Card>
        <CardHeader>
          <CardTitle>Generate bills</CardTitle>
        </CardHeader>
        <CardContent>
          <BillingForm />
        </CardContent>
      </Card>

      {periods.length === 0 ? (
        <p className="text-sm text-muted-foreground">No billing periods yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bills</TableHead>
                <TableHead>Employee charges</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => {
                const charges = period.bills.reduce((s, b) => s + b.employeeChargesPaisa, 0);
                const outstanding = period.bills.reduce((s, b) => s + b.outstandingPaisa, 0);
                return (
                  <TableRow key={period.id}>
                    <TableCell>
                      {formatDisplayDate(period.startDate)} – {formatDisplayDate(period.endDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={period.status} />
                    </TableCell>
                    <TableCell>{period._count.bills}</TableCell>
                    <TableCell>{formatBdt(charges)}</TableCell>
                    <TableCell>{formatBdt(outstanding)}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Link
                        href={`/admin/billing/${period.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        View
                      </Link>
                      {period.status === "OPEN" ? (
                        <ClosePeriodButton periodId={period.id} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
