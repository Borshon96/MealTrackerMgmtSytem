"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction, type ActionResult } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/forms/form-message";
import { formControlClassName } from "@/lib/form-field-styles";

export function ResetPasswordForm({ userId }: { userId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const action = resetPasswordAction.bind(null, userId);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (!state?.ok) return;
    formRef.current?.reset();
    router.refresh();
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-2">
        <Label htmlFor={`reset-password-${userId}`}>New password</Label>
        <Input
          id={`reset-password-${userId}`}
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
          className={formControlClassName}
        />
        <p className="text-xs text-muted-foreground">
          Sets a new password and requires the user to change it on next login.
        </p>
      </div>
      <FormMessage result={state} />
      <Button type="submit" variant="outline" className="h-10 w-full rounded-xl" disabled={pending}>
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
