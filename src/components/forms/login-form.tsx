"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/forms/form-message";
import { formControlClassName } from "@/lib/form-field-styles";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    loginAction,
    null
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="login">Username or email</Label>
        <Input
          id="login"
          name="login"
          autoComplete="username"
          required
          placeholder="e.g. admin or you@company.com"
          className={formControlClassName}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Enter your password"
          className={formControlClassName}
        />
      </div>
      <FormMessage result={state} />
      <Button
        type="submit"
        className="h-11 w-full rounded-xl text-sm font-semibold"
        disabled={pending}
      >
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
