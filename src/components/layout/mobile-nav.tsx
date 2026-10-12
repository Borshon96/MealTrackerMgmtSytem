"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth-actions";

const adminLinks = [
  ["/admin", "Dashboard"],
  ["/admin/employees", "Employees"],
  ["/admin/users", "Users"],
  ["/admin/meals", "Meals"],
  ["/admin/billing", "Billing"],
  ["/admin/payments", "Payments"],
  ["/admin/reports", "Reports"],
  ["/admin/settings", "Settings"],
] as const;

const employeeLinks = [
  ["/my-dashboard", "Dashboard"],
  ["/my-dashboard/meals", "My Meals"],
  ["/my-dashboard/billing", "My Billing"],
  ["/my-dashboard/payments", "My Payments"],
  ["/my-dashboard/profile", "Profile"],
] as const;

export function MobileNav({
  role,
  title,
  username,
}: {
  role: "ADMIN" | "EMPLOYEE";
  title: string;
  username: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = role === "ADMIN" ? adminLinks : employeeLinks;

  return (
    <header className="border-b md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Office Meal Tracker</p>
          <p className="font-medium">{title}</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>
      {open ? (
        <nav className="space-y-1 border-t px-3 py-3">
          <p className="px-2 pb-2 text-xs text-muted-foreground">{username}</p>
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm",
                pathname === href ? "bg-muted font-medium" : "hover:bg-muted/70"
              )}
            >
              {label}
            </Link>
          ))}
          <form action={logoutAction} className="pt-2">
            <Button type="submit" variant="outline" className="w-full">
              Log out
            </Button>
          </form>
        </nav>
      ) : null}
    </header>
  );
}
