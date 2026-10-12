"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Wallet } from "lucide-react";
import {
  getEmployeeBalanceAction,
  recordPaymentAction,
  type ActionResult,
} from "@/actions/payment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/forms/form-message";
import { employeeInitials } from "@/lib/employee-display";
import { nowDateTimeLocalValue } from "@/lib/dates";
import { paisaToBdt } from "@/lib/money";

type EmployeeOption = { id: string; fullName: string; employeeCode: string };

export type RecordPaymentPrefill = {
  employeeId: string;
  amountBdt?: number;
};

export function RecordPaymentForm({
  employees,
  prefill,
  prefillToken = 0,
  onPrefillConsumed,
}: {
  employees: EmployeeOption[];
  prefill?: RecordPaymentPrefill | null;
  prefillToken?: number;
  onPrefillConsumed?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [paidAt, setPaidAt] = useState(nowDateTimeLocalValue());
  const [amountBdt, setAmountBdt] = useState("");
  const [method, setMethod] = useState("CASH");
  const [dueHint, setDueHint] = useState<number | null>(null);

  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    recordPaymentAction,
    null
  );

  useEffect(() => {
    if (state?.ok) {
      setEmployeeId("");
      setAmountBdt("");
      setDueHint(null);
      router.refresh();
    }
  }, [state, router]);

  useEffect(() => {
    if (!prefill?.employeeId) return;
    setEmployeeId(prefill.employeeId);
    if (prefill.amountBdt !== undefined) {
      setAmountBdt(String(prefill.amountBdt));
    }
    onPrefillConsumed?.();
    // prefillToken lets Pay Now re-apply for the same employee
  }, [prefill, prefillToken, onPrefillConsumed]);

  useEffect(() => {
    if (!employeeId) {
      setDueHint(null);
      setAmountBdt("");
      return;
    }
    let cancelled = false;
    setAmountBdt("");
    (async () => {
      const balance = await getEmployeeBalanceAction(employeeId);
      if (cancelled) return;
      const dueBdt = paisaToBdt(balance.duePaisa);
      setDueHint(dueBdt);
      if (balance.duePaisa > 0) {
        setAmountBdt(String(dueBdt));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const filtered = employees.filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      e.fullName.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q)
    );
  });

  const selected = employees.find((e) => e.id === employeeId);

  return (
    <div className="mealdesk-card p-5">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold">Record Payment</h3>
          <p className="text-xs text-muted-foreground">Apply a payment to an employee&apos;s meal balance.</p>
        </div>
      </div>

      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="employeeId" value={employeeId} />
        <input type="hidden" name="paidAt" value={paidAt} />
        <input type="hidden" name="amountBdt" value={amountBdt} />
        <input type="hidden" name="method" value={method} />

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Employee
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={selected ? `${selected.fullName} (${selected.employeeCode})` : query}
              onChange={(e) => {
                setQuery(e.target.value);
                setEmployeeId("");
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Select Employee / search"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          {dropdownOpen ? (
            <div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-white shadow-sm">
              {filtered.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-secondary"
                  onClick={() => {
                    setEmployeeId(emp.id);
                    setQuery("");
                    setDropdownOpen(false);
                  }}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                    {employeeInitials(emp.fullName)}
                  </span>
                  <span>
                    <span className="font-medium">{emp.fullName}</span>
                    <span className="block text-xs text-muted-foreground">{emp.employeeCode}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paidAtLocal" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Payment date
          </Label>
          <Input
            id="paidAtLocal"
            type="datetime-local"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="h-10 rounded-xl"
            required
          />
          <p className="text-[11px] text-muted-foreground">DD/MM/YYYY · time stored for payment history</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amountBdtVisible" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Amount (BDT) / Partial Payment
          </Label>
          <Input
            id="amountBdtVisible"
            type="number"
            step="0.01"
            min="0.01"
            value={amountBdt}
            onChange={(e) => setAmountBdt(e.target.value)}
            placeholder={dueHint !== null ? String(dueHint) : "Auto generated from meals allocated"}
            className="h-10 rounded-xl"
            required
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Select an employee to calculate the amount due. You can enter a smaller amount for a partial
            payment.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Method</Label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-white px-2.5 text-sm"
          >
            <option value="CASH">Cash</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference" className="text-xs text-muted-foreground">
            Reference (Optional)
          </Label>
          <Input
            id="reference"
            name="reference"
            placeholder="Enter receipt or transaction reference"
            className="h-10 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs text-muted-foreground">
            Note (Optional)
          </Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Add a note about this payment..."
            className="rounded-xl"
          />
        </div>

        <FormMessage result={state} />

        <Button
          type="submit"
          className="h-11 w-full rounded-xl font-semibold"
          disabled={pending || !employeeId || !amountBdt}
        >
          <Plus className="h-4 w-4" />
          {pending ? "Recording..." : "Record Payment"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Recorded payments will appear in Payment History.
        </p>
      </form>
    </div>
  );
}
