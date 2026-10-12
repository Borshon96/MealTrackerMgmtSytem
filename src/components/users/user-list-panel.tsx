"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { usersPageHref } from "@/lib/admin-routes";

export type UserListItem = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  employeeLabel: string | null;
  lastLoginAt: string | null;
};

export function UserListPanel({
  users,
  selectedId,
  query,
}: {
  users: UserListItem[];
  selectedId?: string;
  query?: string;
}) {
  const router = useRouter();

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Last login</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              onClick={() => router.push(usersPageHref({ q: query, id: user.id }))}
              className={cn(
                "cursor-pointer transition-colors hover:bg-secondary/70",
                selectedId === user.id && "bg-brand-soft/50"
              )}
            >
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <StatusBadge value={user.status} />
              </TableCell>
              <TableCell>{user.employeeLabel ?? "—"}</TableCell>
              <TableCell>
                {user.lastLoginAt ? formatDisplayDate(user.lastLoginAt) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
