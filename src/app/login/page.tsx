import Image from "next/image";
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
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 h-full w-full">
        <Image
          src="/login-food-frame.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="h-full w-full object-fill opacity-[0.14]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-border/80 bg-white/95 p-8 shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand shadow-sm">
              <UtensilsCrossed className="h-6 w-6 text-brand-foreground" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mealdesk</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your workspace</p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Office meal tracking · Admin & employee access
          </p>
        </div>
      </div>
    </div>
  );
}
