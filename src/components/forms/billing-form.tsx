"use client";

import { useActionState } from "react";
import { generateBillsAction, type ActionResult } from "@/actions/billing-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/forms/form-message";

export function BillingForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    generateBillsAction,
    null
  );

  return (
    <form action={action} className="grid max-w-xl gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="startDate">Start date</Label>
        <Input id="startDate" name="startDate" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endDate">End date</Label>
        <Input id="endDate" name="endDate" type="date" required />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <FormMessage result={state} />
        <Button type="submit" disabled={pending}>
          {pending ? "Generating..." : "Generate / refresh bills"}
        </Button>
      </div>
    </form>
  );
}
