import { PageHeader } from "@/components/ui/page-header";
import { EmployeeForm } from "@/components/forms/employee-form";
import { Card, CardContent } from "@/components/ui/card";

export default function NewEmployeePage() {
  return (
    <div>
      <PageHeader title="Add employee" description="Create a new employee record." />
      <Card>
        <CardContent className="pt-6">
          <EmployeeForm />
        </CardContent>
      </Card>
    </div>
  );
}
