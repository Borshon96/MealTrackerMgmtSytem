import { listPayments } from "@/services/payment-service";
import { listEmployees } from "@/services/employee-service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentForm } from "@/components/forms/payment-form";
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

export default async function PaymentsPage() {
  const [payments, employees] = await Promise.all([listPayments(), listEmployees()]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments"
        description="Record collections. Amounts allocate FIFO to oldest outstanding bills; excess becomes credit."
      />

      <Card>
        <CardHeader>
          <CardTitle>Record payment</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForm employees={employees} />
        </CardContent>
      </Card>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDisplayDate(p.paidAt)}</TableCell>
                  <TableCell>
                    {p.employee.fullName}
                    <div className="text-xs text-muted-foreground">{p.employee.employeeCode}</div>
                  </TableCell>
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
