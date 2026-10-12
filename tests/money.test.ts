import { describe, expect, it } from "vitest";
import {
  bdtToPaisa,
  computeBillStatus,
  computeMealLedgerBalance,
  formatBdt,
  mealLedgerStatus,
  splitMealCost,
} from "@/lib/money";
import { datesInRange } from "@/lib/dates";

describe("money helpers", () => {
  it("converts BDT to paisa without float drift", () => {
    expect(bdtToPaisa(100)).toBe(10000);
    expect(bdtToPaisa(12.5)).toBe(1250);
  });

  it("splits meal cost so shares always sum to unit price", () => {
    const split = splitMealCost(10000, 50);
    expect(split.employeeChargePaisa).toBe(5000);
    expect(split.officeSubsidyPaisa).toBe(5000);

    const odd = splitMealCost(10001, 50);
    expect(odd.employeeChargePaisa + odd.officeSubsidyPaisa).toBe(10001);
  });

  it("formats BDT with taka symbol", () => {
    expect(formatBdt(10050)).toContain("৳");
    expect(formatBdt(10050)).toContain("100.50");
  });

  it("computes bill status", () => {
    expect(computeBillStatus(0, 5000, 5000)).toBe("PAID");
    expect(computeBillStatus(2000, 3000, 5000)).toBe("PARTIALLY_PAID");
    expect(computeBillStatus(5000, 0, 5000)).toBe("DUE");
    expect(computeBillStatus(0, 0, 0)).toBe("PENDING");
  });

  it("computes meal ledger due and credit from charges vs payments", () => {
    expect(computeMealLedgerBalance(37500, 0)).toEqual({ duePaisa: 37500, creditPaisa: 0 });
    expect(computeMealLedgerBalance(37500, 37500)).toEqual({ duePaisa: 0, creditPaisa: 0 });
    expect(computeMealLedgerBalance(25000, 37500)).toEqual({ duePaisa: 0, creditPaisa: 12500 });
    expect(computeMealLedgerBalance(25000, 10000)).toEqual({ duePaisa: 15000, creditPaisa: 0 });
    expect(mealLedgerStatus(15000, 0)).toBe("DUE");
    expect(mealLedgerStatus(0, 12500)).toBe("ADVANCE");
    expect(mealLedgerStatus(0, 0)).toBe("PAID");
  });

  it("expands inclusive date ranges for meal selection", () => {
    expect(datesInRange("2026-10-01", "2026-10-03")).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
    expect(datesInRange("2026-10-03", "2026-10-01")).toEqual([]);
  });
});
