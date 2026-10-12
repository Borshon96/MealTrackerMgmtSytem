import Link from "next/link";
import { listUsers } from "@/services/user-service";
import { listEmployees } from "@/services/employee-service";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/forms/user-form";
import { formatDisplayDate } from "@/lib/dates";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [users, employees] = await Promise.all([listUsers(q), listEmployees()]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="Manage login accounts and link employees."
      />

      <Card>
        <CardHeader>
          <CardTitle>Create user</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm employees={employees} />
        </CardContent>
      </Card>

      <form className="flex gap-2">
        <Input name="q" placeholder="Search username or email..." defaultValue={q ?? ""} />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <StatusBadge value={user.status} />
                  </TableCell>
                  <TableCell>
                    {user.employee
                      ? `${user.employee.employeeCode} — ${user.employee.fullName}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? formatDisplayDate(user.lastLoginAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
