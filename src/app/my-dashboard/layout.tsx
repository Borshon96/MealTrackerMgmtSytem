import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { getSettings } from "@/lib/settings";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "EMPLOYEE") redirect("/admin");

  const settings = await getSettings();

  return (
    <AppShell role="EMPLOYEE" title={settings.companyName} username={user.username}>
      {children}
    </AppShell>
  );
}
