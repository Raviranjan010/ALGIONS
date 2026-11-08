import { describe, it, expect } from "vitest";
import { searchTripsSchema, createBookingSchema } from "@/lib/validation/schemas";

describe("Unit: Request Validation Schemas", () => {
  it("should validate a correct search trips query", () => {
    const valid = {
      origin: "Mumbai",
      destination: "Pune",
      date: "2026-02-15",
      passengers: 2,
    };
    const res = searchTripsSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("should reject search query with invalid date format", () => {
    const invalid = {
      origin: "Mumbai",
      destination: "Pune",
      date: "15/02/2026",
    };
    const res = searchTripsSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("should reject booking if passenger count does not match selected seat count", () => {
    const mismatch = {
      tripId: "d1000000-0000-0000-0000-000000000001",
      seatIds: ["b1000000-0000-0000-0000-000000000001", "b1000000-0000-0000-0000-000000000002"],
      passengers: [
        {
          fullName: "Ravi Ranjan",
          age: 26,
          gender: "male" as const,
          seatNumber: "1A",
        },
      ],
      contact: {
        name: "Ravi Ranjan",
        email: "ravi@example.com",
        phone: "+91 98765 43210",
      },
    };
    const res = createBookingSchema.safeParse(mismatch);
    expect(res.success).toBe(false);
  });
});
