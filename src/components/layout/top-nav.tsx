"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, UtensilsCrossed, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string };

const adminPrimary: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/meals", label: "Meals" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reports", label: "Reports" },
];

const adminMore: NavItem[] = [
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/settings", label: "Settings" },
];

const employeeNav: NavItem[] = [
  { href: "/my-dashboard", label: "Dashboard" },
  { href: "/my-dashboard/meals", label: "Meals" },
  { href: "/my-dashboard/billing", label: "Billing" },
  { href: "/my-dashboard/payments", label: "Payments" },
  { href: "/my-dashboard/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/my-dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav({
  role,
  username,
}: {
  role: "ADMIN" | "EMPLOYEE";
  username: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const primary = role === "ADMIN" ? adminPrimary : employeeNav;
  const homeHref = role === "ADMIN" ? "/admin" : "/my-dashboard";
  const initials = username.slice(0, 2).toUpperCase();

  const mobileLinks =
    role === "ADMIN" ? [...adminPrimary, ...adminMore] : employeeNav;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-8">
          <Link href={homeHref} className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <UtensilsCrossed className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">Mealdesk</span>
          </Link>

          <nav className="hidden items-center gap-0.5 overflow-x-auto md:flex lg:gap-1">
            {primary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium transition-colors lg:px-3",
                  isActive(pathname, item.href)
                    ? "text-foreground underline decoration-2 underline-offset-8"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Operations workspace
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-2 text-sm"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold">
                {initials}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-white p-1 shadow-lg">
                <p className="px-3 py-2 text-xs text-muted-foreground">{username}</p>
                {role === "ADMIN"
                  ? adminMore.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm hover:bg-secondary"
                      >
                        {item.label}
                      </Link>
                    ))
                  : null}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    Log out
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="border-t border-border px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {mobileLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isActive(pathname, item.href) ? "bg-brand-soft" : "hover:bg-secondary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
