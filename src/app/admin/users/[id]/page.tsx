import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listEmployees } from "@/services/employee-service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/forms/user-form";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, employees] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        employeeId: true,
        forcePasswordChange: true,
      },
    }),
    listEmployees(),
  ]);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${user.username}`} description="Update account settings." />
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            user={{
              ...user,
              role: user.role as "ADMIN" | "EMPLOYEE",
              status: user.status as "ACTIVE" | "INACTIVE" | "SUSPENDED",
            }}
            employees={employees}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
