"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Utensils,
  Receipt,
  Wallet,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/meals", label: "Meals", icon: Utensils },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/users", label: "Users", icon: UserCog },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/billing", label: "Billing", icon: Receipt },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const employeeNav: NavItem[] = [
  { href: "/my-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-dashboard/meals", label: "My Meals", icon: Utensils },
  { href: "/my-dashboard/billing", label: "My Billing", icon: Receipt },
  { href: "/my-dashboard/payments", label: "My Payments", icon: Wallet },
  { href: "/my-dashboard/profile", label: "Profile", icon: UserCog },
];

export function AppSidebar({
  role,
  title,
  username,
}: {
  role: "ADMIN" | "EMPLOYEE";
  title: string;
  username: string;
}) {
  const pathname = usePathname();
  const items = role === "ADMIN" ? adminNav : employeeNav;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="border-b px-4 py-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Office Meal Tracker</p>
        <h1 className="mt-1 text-lg font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{username}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" &&
              item.href !== "/my-dashboard" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/70"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <form action={logoutAction}>
          <Button type="submit" variant="outline" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </form>
      </div>
    </aside>
  );
}
