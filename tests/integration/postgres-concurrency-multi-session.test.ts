import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryDatabase } from "@/lib/database/in-memory-store";

describe("PostgreSQL Multi-Session Concurrency & Row-Locking Simulation", () => {
  let db: InMemoryDatabase;
  const TRIP_ID = "d1000000-0000-0000-0000-000000000001";

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  // --------------------------------------------------------------------------
  // TEST 1: Two Independent Client Sessions Competing for the Exact Same Seat
  // --------------------------------------------------------------------------
  it("Dual-Session Competition: When 2 concurrent independent sessions attempt to lock the same seat, exactly 1 succeeds and 1 fails", async () => {
    const seats = db.getTripSeats(TRIP_ID);
    const targetSeat = seats.find((s) => s.status === "available")!;
    expect(targetSeat).toBeDefined();

    // Session 1: Client from Mumbai
    const session1 = db.createBookingAtomic({
      tripId: TRIP_ID,
      userId: "user-session-1",
      seatIds: [targetSeat.id],
      passengers: [
        {
          fullName: "Session 1 Passenger",
          age: 32,
          gender: "male",
          seatNumber: targetSeat.seat_number,
        },
      ],
      contact: {
        name: "Session 1 Contact",
        email: "session1@test.com",
        phone: "+91 98000 00001",
      },
      idempotencyKey: "session-1-token-999",
    });

    // Session 2: Competing Client from Pune launched at the exact same instant
    const session2 = db.createBookingAtomic({
      tripId: TRIP_ID,
      userId: "user-session-2",
      seatIds: [targetSeat.id],
      passengers: [
        {
          fullName: "Session 2 Passenger",
          age: 29,
          gender: "female",
          seatNumber: targetSeat.seat_number,
        },
      ],
      contact: {
        name: "Session 2 Contact",
        email: "session2@test.com",
        phone: "+91 98000 00002",
      },
      idempotencyKey: "session-2-token-888",
    });

    // Wait for both concurrent transactions to settle
    const results = await Promise.allSettled([session1, session2]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly 1 must win the lock and commit; exactly 1 must be rejected
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const winningBooking = (fulfilled[0] as PromiseFulfilledResult<any>).value.booking;
    expect(winningBooking.status).toBe("confirmed");
    expect(winningBooking.pnr).toMatch(/^ALG-[2-9A-Z]{6}$/);

    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason.message;
    expect(rejectionReason).toContain("SEAT_NOT_AVAILABLE");

    // Invariant Check: Verify database state
    // Seat must be booked, and only ONE active booking_seat record exists
    const updatedSeat = db.tripSeats.get(targetSeat.id);
    expect(updatedSeat?.status).toBe("booked");

    const activeAllocations = Array.from(db.bookingSeats.values()).filter(
      (bs) => bs.trip_seat_id === targetSeat.id && (bs as any).is_active
    );
    expect(activeAllocations.length).toBe(1);
    expect(activeAllocations[0].booking_id).toBe(winningBooking.id);
  });

  // --------------------------------------------------------------------------
  // TEST 2: High Concurrency Stampede: 10 Sessions Competing for 1 Seat
  // --------------------------------------------------------------------------
  it("High Concurrency Stampede: When 10 concurrent sessions compete for a single seat, exactly 1 wins and 9 are rejected", async () => {
    const seats = db.getTripSeats(TRIP_ID);
    const targetSeat = seats.find((s) => s.status === "available")!;

    const sessionPromises = Array.from({ length: 10 }, (_, index) => {
      const sessionId = `client-worker-${index + 1}`;
      return db.createBookingAtomic({
        tripId: TRIP_ID,
        userId: sessionId,
        seatIds: [targetSeat.id],
        passengers: [
          {
            fullName: `Passenger ${index + 1}`,
            age: 20 + index,
            gender: index % 2 === 0 ? "male" : "female",
            seatNumber: targetSeat.seat_number,
          },
        ],
        contact: {
          name: `Contact ${index + 1}`,
          email: `${sessionId}@algions.com`,
          phone: `+91 90000 000${index < 10 ? "0" + index : index}`,
        },
        idempotencyKey: `stampede-token-${index}`,
      });
    });

    const results = await Promise.allSettled(sessionPromises);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(9);

    rejected.forEach((r) => {
      expect((r as PromiseRejectedResult).reason.message).toContain("SEAT_NOT_AVAILABLE");
    });

    // Invariant Check: Exactly 1 active booking seat exists
    const activeAllocations = Array.from(db.bookingSeats.values()).filter(
      (bs) => bs.trip_seat_id === targetSeat.id && (bs as any).is_active
    );
    expect(activeAllocations.length).toBe(1);
  });

  // --------------------------------------------------------------------------
  // TEST 3: Overlapping Multi-Seat Selection Across Concurrent Sessions
  // --------------------------------------------------------------------------
  it("Overlapping Seat Batches: Session A wants [Seat1, Seat2], Session B wants [Seat2, Seat3] - prevents partial/split bookings", async () => {
    const availableSeats = db.getTripSeats(TRIP_ID).filter((s) => s.status === "available");
    expect(availableSeats.length).toBeGreaterThanOrEqual(3);

    const seat1 = availableSeats[0];
    const seat2 = availableSeats[1]; // Contested overlapping seat
    const seat3 = availableSeats[2];

    const sessionA = db.createBookingAtomic({
      tripId: TRIP_ID,
      userId: "user-batch-A",
      seatIds: [seat1.id, seat2.id],
      passengers: [
        { fullName: "A1", age: 30, gender: "male", seatNumber: seat1.seat_number },
        { fullName: "A2", age: 28, gender: "female", seatNumber: seat2.seat_number },
      ],
      contact: { name: "User A", email: "a@test.com", phone: "+91 91111 00001" },
      idempotencyKey: "overlap-A",
    });

    const sessionB = db.createBookingAtomic({
      tripId: TRIP_ID,
      userId: "user-batch-B",
      seatIds: [seat2.id, seat3.id],
      passengers: [
        { fullName: "B1", age: 35, gender: "female", seatNumber: seat2.seat_number },
        { fullName: "B2", age: 34, gender: "male", seatNumber: seat3.seat_number },
      ],
      contact: { name: "User B", email: "b@test.com", phone: "+91 92222 00002" },
      idempotencyKey: "overlap-B",
    });

    const results = await Promise.allSettled([sessionA, sessionB]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly 1 batch must win; the other must be rejected completely without partially booking seat 3
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Contested seat 2 must have exactly 1 active booking
    const seat2Allocations = Array.from(db.bookingSeats.values()).filter(
      (bs) => bs.trip_seat_id === seat2.id && (bs as any).is_active
    );
    expect(seat2Allocations.length).toBe(1);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Immediate Inventory Restoration & Re-Booking After Cancellation
  // --------------------------------------------------------------------------
  it("Cancellation & Restoration: Cancelled seat is immediately unlocked and bookable by another session", async () => {
    const seats = db.getTripSeats(TRIP_ID);
    const targetSeat = seats.find((s) => s.status === "available")!;

    // 1. Initial Booking
    const booking = await db.createBookingAtomic({
      tripId: TRIP_ID,
      userId: "initial-passenger",
      seatIds: [targetSeat.id],
      passengers: [
        { fullName: "Initial Passenger", age: 30, gender: "male", seatNumber: targetSeat.seat_number },
      ],
      contact: { name: "Initial Passenger", email: "init@test.com", phone: "+91 97777 00001" },
    });

    expect(db.tripSeats.get(targetSeat.id)?.status).toBe("booked");

    // 2. Cancellation
    const cancelRes = await db.cancelBookingAtomic({
      bookingId: booking.booking.id,
      userId: "initial-passenger",
      reason: "Plans changed",
    });
    expect(cancelRes.success).toBe(true);
    expect(db.tripSeats.get(targetSeat.id)?.status).toBe("available");

    // 3. New Session immediately books the released seat
    const rebooking = await db.createBookingAtomic({
      tripId: TRIP_ID,
      userId: "new-passenger",
      seatIds: [targetSeat.id],
      passengers: [
        { fullName: "New Passenger", age: 26, gender: "female", seatNumber: targetSeat.seat_number },
      ],
      contact: { name: "New Passenger", email: "new@test.com", phone: "+91 97777 00002" },
    });

    expect(rebooking.success).toBe(true);
    expect(rebooking.booking.status).toBe("confirmed");
    expect(db.tripSeats.get(targetSeat.id)?.status).toBe("booked");

    // Check invariant: Exactly 1 active booking seat for targetSeat (the old one was deactivated)
    const activeAllocations = Array.from(db.bookingSeats.values()).filter(
      (bs) => bs.trip_seat_id === targetSeat.id && (bs as any).is_active
    );
    expect(activeAllocations.length).toBe(1);
    expect(activeAllocations[0].booking_id).toBe(rebooking.booking.id);
  });
});
