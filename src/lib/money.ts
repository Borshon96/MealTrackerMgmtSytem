/** Money is stored as integer paisa (1 BDT = 100 paisa). */

export function bdtToPaisa(bdt: number): number {
  return Math.round(bdt * 100);
}

export function paisaToBdt(paisa: number): number {
  return paisa / 100;
}

export function formatBdt(paisa: number): string {
  const amount = paisaToBdt(paisa);
  return `৳${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Split meal cost by percentage.
 * Employee share is rounded to nearest paisa; office gets the remainder
 * so the two parts always sum to unitPricePaisa.
 */
export function splitMealCost(
  unitPricePaisa: number,
  employeeSharePct: number
): { employeeChargePaisa: number; officeSubsidyPaisa: number } {
  const employeeChargePaisa = Math.round((unitPricePaisa * employeeSharePct) / 100);
  const officeSubsidyPaisa = unitPricePaisa - employeeChargePaisa;
  return { employeeChargePaisa, officeSubsidyPaisa };
}

export function computeBillStatus(
  outstandingPaisa: number,
  paymentsPaisa: number,
  totalDuePaisa: number
): "PENDING" | "PARTIALLY_PAID" | "PAID" | "DUE" {
  if (outstandingPaisa <= 0 && totalDuePaisa > 0) return "PAID";
  if (paymentsPaisa > 0 && outstandingPaisa > 0) return "PARTIALLY_PAID";
  if (outstandingPaisa > 0 && paymentsPaisa === 0 && totalDuePaisa > 0) return "DUE";
  return "PENDING";
}
