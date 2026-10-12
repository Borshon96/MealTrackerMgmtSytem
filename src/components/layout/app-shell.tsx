import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export function AppShell({
  role,
  title,
  username,
  children,
}: {
  role: "ADMIN" | "EMPLOYEE";
  title: string;
  username: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <AppSidebar role={role} title={title} username={username} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav role={role} title={title} username={username} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
