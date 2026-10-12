import { describe, expect, it } from "vitest";
import { loginSchema, settingsSchema } from "@/lib/validations";

describe("validation guards", () => {
  it("rejects empty login", () => {
    const result = loginSchema.safeParse({ login: "", password: "x" });
    expect(result.success).toBe(false);
  });

  it("requires share percentages to total 100", () => {
    const bad = settingsSchema.safeParse({
      mealPriceBdt: 100,
      employeeSharePct: 40,
      officeSharePct: 50,
      weekStartDay: 0,
      companyName: "Test",
    });
    expect(bad.success).toBe(false);

    const good = settingsSchema.safeParse({
      mealPriceBdt: 100,
      employeeSharePct: 50,
      officeSharePct: 50,
      weekStartDay: 0,
      companyName: "Test",
    });
    expect(good.success).toBe(true);
  });
});
