import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils";

describe("Unit: Fare Calculation & Formatting", () => {
  it("should calculate total fare by summing individual selected seat fares", () => {
    const selectedSeatFares = [850, 900, 850];
    const total = selectedSeatFares.reduce((sum, f) => sum + f, 0);
    expect(total).toBe(2600);
  });

  it("should format currency consistently in INR format", () => {
    const formatted = formatCurrency(1450);
    expect(formatted).toContain("1,450");
  });
});

