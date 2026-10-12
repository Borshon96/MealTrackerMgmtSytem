import { notFound } from "next/navigation";
import { getEmployee, getEmployeeBalances } from "@/services/employee-service";
import { PageHeader } from "@/components/ui/page-header";
import { EmployeeForm } from "@/components/forms/employee-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatBdt } from "@/lib/money";
import { formatDisplayDate } from "@/lib/dates";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();
  const balances = await getEmployeeBalances(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={employee.fullName}
        description={`Employee ${employee.employeeCode}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total billed" value={formatBdt(balances.totalBilledPaisa)} />
        <StatCard title="Total paid" value={formatBdt(balances.totalPaidPaisa)} />
        <StatCard title="Outstanding" value={formatBdt(balances.outstandingPaisa)} />
        <StatCard title="Credit" value={formatBdt(balances.creditPaisa)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit employee</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            employee={{
              ...employee,
              status: employee.status as "ACTIVE" | "INACTIVE",
            }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent meals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {employee.meals.length === 0 ? (
              <p className="text-muted-foreground">No meals yet.</p>
            ) : (
              employee.meals.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2">
                  <span>{formatDisplayDate(m.mealDate)}</span>
                  <StatusBadge value={m.status} />
                  <span>{formatBdt(m.employeeChargePaisa)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {employee.payments.length === 0 ? (
              <p className="text-muted-foreground">No payments yet.</p>
            ) : (
              employee.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span>{formatDisplayDate(p.paidAt)}</span>
                  <span>{p.method}</span>
                  <span>{formatBdt(p.amountPaisa)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
