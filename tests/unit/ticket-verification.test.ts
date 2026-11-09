import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryDatabase } from "@/lib/database/in-memory-store";

describe("Public Boarding Pass Verification & Privacy Protection", () => {
  let db: InMemoryDatabase;
  const TRIP_ID = "d1000000-0000-0000-0000-000000000001";

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  it("Sanitized Public Verification: Exposes valid boarding metadata but withholds all PII", async () => {
    const seats = db.getTripSeats(TRIP_ID);
    const targetSeat = seats.find((s) => s.status === "available")!;

    // 1. Create a booking with sensitive PII
    const bookingResult = await db.createBookingAtomic({
      tripId: TRIP_ID,
      userId: "secret-user-id-999",
      seatIds: [targetSeat.id],
      passengers: [
        {
          fullName: "Confidential Passenger Name",
          age: 45,
          gender: "female",
          seatNumber: targetSeat.seat_number,
        },
      ],
      contact: {
        name: "Confidential Contact",
        email: "confidential.email@private.com",
        phone: "+91 99999 88888",
      },
      idempotencyKey: "pnr-verify-test-key",
    });

    const pnr = bookingResult.booking.pnr;

    // 2. Query public verification endpoint
    const verification = db.verifyTicketByPnr(pnr);

    expect(verification).not.toBeNull();
    expect(verification?.found).toBe(true);
    expect(verification?.pnr).toBe(pnr);
    expect(verification?.isValidForBoarding).toBe(true);
    expect(verification?.status).toBe("confirmed");
    expect(verification?.originCity).toBe("Mumbai");
    expect(verification?.destinationCity).toBe("Pune");
    expect(verification?.seats).toContain(targetSeat.seat_number);
    expect(verification?.operatorName).toBeDefined();
    expect(verification?.busModel).toBeDefined();

    // 3. STRICT PRIVACY ASSERTIONS: No PII must be exposed in public verification
    const rawKeys = Object.keys(verification as any);
    expect(rawKeys).not.toContain("contact_name");
    expect(rawKeys).not.toContain("contact_email");
    expect(rawKeys).not.toContain("contact_phone");
    expect(rawKeys).not.toContain("passengers");
    expect(rawKeys).not.toContain("total_fare");
    expect(rawKeys).not.toContain("user_id");
  });

  it("Public Verification of Cancelled Ticket: Shows invalid for boarding and cancellation timestamp", async () => {
    const seats = db.getTripSeats(TRIP_ID);
    const targetSeat = seats.find((s) => s.status === "available")!;

    const bookingResult = await db.createBookingAtomic({
      tripId: TRIP_ID,
      userId: "test-user-cancel",
      seatIds: [targetSeat.id],
      passengers: [
        {
          fullName: "Traveler Test",
          age: 25,
          gender: "male",
          seatNumber: targetSeat.seat_number,
        },
      ],
      contact: {
        name: "Traveler Test",
        email: "test@algions.com",
        phone: "+91 98765 43210",
      },
    });

    const bookingId = bookingResult.booking.id;
    const pnr = bookingResult.booking.pnr;

    // Cancel booking
    await db.cancelBookingAtomic({
      bookingId,
      userId: "test-user-cancel",
      reason: "Meeting rescheduled",
    });

    // Verify through public endpoint
    const verification = db.verifyTicketByPnr(pnr);

    expect(verification).not.toBeNull();
    expect(verification?.isValidForBoarding).toBe(false);
    expect(verification?.status).toBe("cancelled");
    expect(verification?.isCancelled).toBe(true);
    expect(verification?.cancelledAt).toBeDefined();
  });

  it("Nonexistent PNR verification returns null", () => {
    const verification = db.verifyTicketByPnr("ALG-NONEXIST");
    expect(verification).toBeNull();
  });
});
