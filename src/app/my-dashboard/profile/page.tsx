import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordChangeForm } from "@/components/forms/password-change-form";

export default async function MyProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const employee = user.employeeId
    ? await prisma.employee.findUnique({ where: { id: user.employeeId } })
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your account details." />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Username:</span> {user.username}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Name:</span>{" "}
            {employee?.fullName ?? "Not linked"}
          </p>
          <p>
            <span className="text-muted-foreground">Employee ID:</span>{" "}
            {employee?.employeeCode ?? "Not linked"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>
    </div>
  );
}
