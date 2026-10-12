import { getAdminDashboard } from "@/services/dashboard-service";
import { formatBdt } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Today and this week’s meal and collection overview."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active employees" value={String(data.activeEmployees)} />
        <StatCard
          title="Today's meals"
          value={String(data.todayMealCount)}
          hint={formatBdt(data.todayCostPaisa)}
        />
        <StatCard
          title="Weekly meal cost"
          value={formatBdt(data.weekCostPaisa)}
          hint={`${data.weekMealCount} meals`}
        />
        <StatCard
          title="Weekly employee charges"
          value={formatBdt(data.weekEmployeeChargesPaisa)}
        />
        <StatCard title="Weekly office subsidy" value={formatBdt(data.weekOfficeSubsidyPaisa)} />
        <StatCard title="Payments this week" value={formatBdt(data.weekPaymentsPaisa)} />
        <StatCard title="Outstanding dues" value={formatBdt(data.outstandingDuesPaisa)} />
        <StatCard title="Unapplied credits" value={formatBdt(data.unappliedCreditsPaisa)} />
      </div>
    </div>
  );
}
