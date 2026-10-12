import { getOutstandingDues } from "@/services/billing-service";
import { PageHeader } from "@/components/ui/page-header";
import { formatBdt } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ReportsPage() {
  const rows = await getOutstandingDues();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Outstanding dues overview and CSV exports."
        actions={
          <div className="flex flex-wrap gap-2">
            <a href="/api/export/meals" className={cn(buttonVariants({ variant: "outline" }))}>
              Export meals CSV
            </a>
            <a href="/api/export/payments" className={cn(buttonVariants({ variant: "outline" }))}>
              Export payments CSV
            </a>
          </div>
        }
      />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No outstanding dues or credits.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Open bills</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.employee.id}>
                  <TableCell>
                    {row.employee.fullName}
                    <div className="text-xs text-muted-foreground">
                      {row.employee.employeeCode}
                    </div>
                  </TableCell>
                  <TableCell>{formatBdt(row.outstandingPaisa)}</TableCell>
                  <TableCell>{formatBdt(row.creditPaisa)}</TableCell>
                  <TableCell>{row.bills.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
