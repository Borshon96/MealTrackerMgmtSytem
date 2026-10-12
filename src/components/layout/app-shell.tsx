import { TopNav } from "@/components/layout/top-nav";

export function AppShell({
  role,
  username,
  children,
}: {
  role: "ADMIN" | "EMPLOYEE";
  title?: string;
  username: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav role={role} username={username} />
      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
