"use client";

import { useActionState } from "react";
import { updateSettingsAction, type ActionResult } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/forms/form-message";

export function SettingsForm({
  settings,
}: {
  settings: {
    mealPriceBdt: number;
    employeeSharePct: number;
    officeSharePct: number;
    weekStartDay: number;
    companyName: string;
  };
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updateSettingsAction,
    null
  );

  return (
    <form action={action} className="grid max-w-xl gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" name="companyName" defaultValue={settings.companyName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mealPriceBdt">Default meal price (BDT)</Label>
        <Input
          id="mealPriceBdt"
          name="mealPriceBdt"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={settings.mealPriceBdt}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="weekStartDay">Week start day</Label>
        <select
          id="weekStartDay"
          name="weekStartDay"
          defaultValue={settings.weekStartDay}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value={0}>Sunday</option>
          <option value={1}>Monday</option>
          <option value={2}>Tuesday</option>
          <option value={3}>Wednesday</option>
          <option value={4}>Thursday</option>
          <option value={5}>Friday</option>
          <option value={6}>Saturday</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="employeeSharePct">Employee share %</Label>
        <Input
          id="employeeSharePct"
          name="employeeSharePct"
          type="number"
          min={0}
          max={100}
          defaultValue={settings.employeeSharePct}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="officeSharePct">Office share %</Label>
        <Input
          id="officeSharePct"
          name="officeSharePct"
          type="number"
          min={0}
          max={100}
          defaultValue={settings.officeSharePct}
          required
        />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <FormMessage result={state} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save settings"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Changes apply to new meal records only. Historical meals keep their snapshotted values.
        </p>
      </div>
    </form>
  );
}
