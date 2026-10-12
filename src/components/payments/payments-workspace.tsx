"use client";

import { useCallback, useState } from "react";
import { RecordPaymentForm, type RecordPaymentPrefill } from "@/components/payments/record-payment-form";
import { PaymentListPanel } from "@/components/payments/payment-list-panel";
import type { EmployeePaymentRow } from "@/services/payment-service";
import { paisaToBdt } from "@/lib/money";

type EmployeeOption = { id: string; fullName: string; employeeCode: string };

export function PaymentsWorkspace({
  employees,
  rows,
  summary,
}: {
  employees: EmployeeOption[];
  rows: EmployeePaymentRow[];
  summary: {
    outstandingPaisa: number;
    dueEmployees: number;
    advancePaisa: number;
    advanceEmployees: string[];
    settledCount: number;
  };
}) {
  const [prefill, setPrefill] = useState<RecordPaymentPrefill | null>(null);
  const [prefillToken, setPrefillToken] = useState(0);

  const onPayNow = useCallback((row: EmployeePaymentRow) => {
    setPrefill({
      employeeId: row.employeeId,
      amountBdt: paisaToBdt(row.duePaisa),
    });
    setPrefillToken((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const clearPrefill = useCallback(() => setPrefill(null), []);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
      <RecordPaymentForm
        employees={employees}
        prefill={prefill}
        prefillToken={prefillToken}
        onPrefillConsumed={clearPrefill}
      />
      <PaymentListPanel rows={rows} summary={summary} onPayNow={onPayNow} />
    </div>
  );
}
