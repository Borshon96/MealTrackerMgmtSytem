"use client";

import { useActionState } from "react";
import { recordPaymentAction, type ActionResult } from "@/actions/payment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/forms/form-message";
import { todayInputValue } from "@/lib/dates";

type EmployeeOption = { id: string; fullName: string; employeeCode: string };

export function PaymentForm({ employees }: { employees: EmployeeOption[] }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    recordPaymentAction,
    null
  );

  return (
    <form action={action} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="employeeId">Employee</Label>
        <select
          id="employeeId"
          name="employeeId"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Select employee</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.employeeCode} — {e.fullName}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="paidAt">Payment date</Label>
        <Input id="paidAt" name="paidAt" type="date" defaultValue={todayInputValue()} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amountBdt">Amount (BDT)</Label>
        <Input id="amountBdt" name="amountBdt" type="number" step="0.01" min="0.01" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="method">Method</Label>
        <select
          id="method"
          name="method"
          defaultValue="CASH"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="CASH">Cash</option>
          <option value="BKASH">bKash</option>
          <option value="NAGAD">Nagad</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reference">Reference</Label>
        <Input id="reference" name="reference" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <FormMessage result={state} />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Record payment"}
        </Button>
      </div>
    </form>
  );
}
