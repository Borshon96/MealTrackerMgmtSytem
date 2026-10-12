import { requireLinkedEmployeeId } from "@/lib/employee-access";
import { getEmployeeBills } from "@/services/billing-service";
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

export default async function MyBillingPage() {
  const employeeId = await requireLinkedEmployeeId();
  if (!employeeId) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        Account not linked to an employee record.
      </p>
    );
  }

  const bills = await getEmployeeBills(employeeId);

  return (
    <div>
      <PageHeader title="My billing" description="Your weekly bills and outstanding balances." />
      {bills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bills yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Meals</TableHead>
                <TableHead>Charges</TableHead>
                <TableHead>Previous due</TableHead>
                <TableHead>Payments</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    {formatDisplayDate(bill.period.startDate)} –{" "}
                    {formatDisplayDate(bill.period.endDate)}
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
