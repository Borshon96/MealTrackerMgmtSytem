import { describe, expect, it } from "vitest";
import { bdtToPaisa, computeBillStatus, formatBdt, splitMealCost } from "@/lib/money";
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

  it("expands inclusive date ranges for meal selection", () => {
    expect(datesInRange("2026-10-01", "2026-10-03")).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
    expect(datesInRange("2026-10-03", "2026-10-01")).toEqual([]);
  });
});
