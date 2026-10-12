import { getSessionUser } from "@/lib/auth";
import { getEmployeeDashboard } from "@/services/dashboard-service";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBdt } from "@/lib/money";
import { formatDisplayDate } from "@/lib/dates";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function MyDashboardPage() {
  const user = await getSessionUser();
  if (!user?.employeeId) {
    return (
      <div>
        <PageHeader title="My dashboard" />
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your account is not linked to an employee record. Ask an administrator to link your
          account before meal and billing data can be shown.
        </p>
      </div>
    );
  }

  const data = await getEmployeeDashboard(user.employeeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${data.employee.fullName}`}
        description="Your meals, charges, and payments for this week."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="This week's meals" value={String(data.weekMealCount)} />
        <StatCard title="This week's charges" value={formatBdt(data.weekChargesPaisa)} />
        <StatCard title="Outstanding dues" value={formatBdt(data.outstandingPaisa)} />
        <StatCard
          title="Total paid"
          value={formatBdt(data.totalPaidPaisa)}
          hint={data.creditPaisa > 0 ? `Credit: ${formatBdt(data.creditPaisa)}` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent meals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.recentMeals.length === 0 ? (
              <p className="text-muted-foreground">No meals recorded yet.</p>
            ) : (
              data.recentMeals.map((m) => (
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
            {data.recentPayments.length === 0 ? (
              <p className="text-muted-foreground">No payments yet.</p>
            ) : (
              data.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span>{formatDisplayDate(p.paidAt)}</span>
                  <span>{p.method.replaceAll("_", " ")}</span>
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
