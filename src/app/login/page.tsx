import { redirect } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/forms/login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/my-dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mealdesk-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mealdesk</h1>
            <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
