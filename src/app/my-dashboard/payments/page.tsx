import { requireLinkedEmployeeId } from "@/lib/employee-access";
import { getEmployeePayments } from "@/services/payment-service";
import { PageHeader } from "@/components/ui/page-header";
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

export default async function MyPaymentsPage() {
  const employeeId = await requireLinkedEmployeeId();
  if (!employeeId) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        Account not linked to an employee record.
      </p>
    );
  }

  const payments = await getEmployeePayments(employeeId);

  return (
    <div>
      <PageHeader title="My payments" description="Payments recorded by the office admin." />
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDisplayDate(p.paidAt)}</TableCell>
                  <TableCell>{p.method.replaceAll("_", " ")}</TableCell>
                  <TableCell>{p.reference || "—"}</TableCell>
                  <TableCell>{formatBdt(p.amountPaisa)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
