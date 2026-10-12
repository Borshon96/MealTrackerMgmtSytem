import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { getSettings } from "@/lib/settings";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/my-dashboard");

  const settings = await getSettings();

  return (
    <AppShell role="ADMIN" title={settings.companyName} username={user.username}>
      {children}
    </AppShell>
  );
}
