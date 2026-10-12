import { notFound } from "next/navigation";
import { getBillingPeriod } from "@/services/billing-service";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatBdt } from "@/lib/money";
import { formatDisplayDate } from "@/lib/dates";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BillingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const period = await getBillingPeriod(id);
  if (!period) notFound();

  return (
    <div>
      <PageHeader
        title="Billing period"
        description={`${formatDisplayDate(period.startDate)} – ${formatDisplayDate(period.endDate)}`}
        actions={<StatusBadge value={period.status} />}
      />

      {period.bills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bills in this period.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Meals</TableHead>
                <TableHead>Charges</TableHead>
                <TableHead>Previous due</TableHead>
                <TableHead>Payments</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {period.bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    {bill.employee.fullName}
                    <div className="text-xs text-muted-foreground">
                      {bill.employee.employeeCode}
                    </div>
                  </TableCell>
                  <TableCell>{bill.mealCount}</TableCell>
                  <TableCell>{formatBdt(bill.employeeChargesPaisa)}</TableCell>
                  <TableCell>{formatBdt(bill.previousDuePaisa)}</TableCell>
                  <TableCell>{formatBdt(bill.paymentsPaisa)}</TableCell>
                  <TableCell>{formatBdt(bill.outstandingPaisa)}</TableCell>
                  <TableCell>
                    <StatusBadge value={bill.status} />
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
