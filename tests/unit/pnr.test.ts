import { describe, it, expect } from "vitest";
import { db } from "@/lib/database/in-memory-store";

describe("Unit: PNR Generator", () => {
  it("should generate a valid PNR starting with ALG- followed by 6 alphanumeric characters", () => {
    const pnr = db.generatePnr();
    expect(pnr).toMatch(/^ALG-[2-9A-Z]{6}$/);
  });

  it("should generate unique PNRs across 1000 consecutive iterations", () => {
    const pnrs = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      pnrs.add(db.generatePnr());
    }
    expect(pnrs.size).toBe(1000);
  });
});

