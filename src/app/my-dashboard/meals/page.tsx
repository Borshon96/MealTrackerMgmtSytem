import { requireLinkedEmployeeId } from "@/lib/employee-access";
import { getEmployeeMeals } from "@/services/meal-service";
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

export default async function MyMealsPage() {
  const employeeId = await requireLinkedEmployeeId();
  if (!employeeId) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        Account not linked to an employee record.
      </p>
    );
  }

  const meals = await getEmployeeMeals(employeeId);

  return (
    <div>
      <PageHeader
        title="My meals"
        description="View-only meal history. Contact an admin to correct records."
      />
      {meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No meal records yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead>Your charge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meals.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatDisplayDate(m.mealDate)}</TableCell>
                  <TableCell>
                    <StatusBadge value={m.status} />
                  </TableCell>
                  <TableCell>{formatBdt(m.unitPricePaisa)}</TableCell>
                  <TableCell>{formatBdt(m.employeeChargePaisa)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
