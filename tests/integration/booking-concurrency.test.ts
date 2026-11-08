import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryDatabase } from "@/lib/database/in-memory-store";

describe("Integration: Booking Engine, Concurrency & Acceptance Scenarios", () => {
  let testDb: InMemoryDatabase;

  beforeEach(() => {
    testDb = new InMemoryDatabase();
  });

  // --------------------------------------------------------------------------
  // SCENARIO 1: Passenger searches for a valid trip and books an available seat
  // --------------------------------------------------------------------------
  it("Scenario 1: Passenger searches for a valid trip and successfully books an available seat", async () => {
    const searchResults = testDb.searchTrips({
      origin: "Mumbai",
      destination: "Pune",
      date: "",
    });

    expect(searchResults.length).toBeGreaterThan(0);
    const trip = searchResults[0];
    expect(trip.route?.origin_city).toBe("Mumbai");
    expect(trip.route?.destination_city).toBe("Pune");

    const seats = testDb.getTripSeats(trip.id);
    const availableSeat = seats.find((s) => s.status === "available");
    expect(availableSeat).toBeDefined();

    const bookingResult = await testDb.createBookingAtomic({
      tripId: trip.id,
      userId: "demo-passenger-id",
      seatIds: [availableSeat!.id],
      passengers: [
        {
          fullName: "Ravi Ranjan",
          age: 26,
          gender: "male",
          seatNumber: availableSeat!.seat_number,
        },
      ],
      contact: {
        name: "Ravi Ranjan",
        email: "passenger@algions.com",
        phone: "+91 98765 00001",
      },
    });

    expect(bookingResult.success).toBe(true);
    expect(bookingResult.booking.status).toBe("confirmed");
    expect(bookingResult.booking.pnr).toMatch(/^ALG-[2-9A-Z]{6}$/);

    // Verify seat is now booked
    const updatedSeat = testDb.tripSeats.get(availableSeat!.id);
    expect(updatedSeat?.status).toBe("booked");
  });

  // --------------------------------------------------------------------------
  // SCENARIO 2: Two concurrent requests attempting to book the EXACT SAME SEAT
  // --------------------------------------------------------------------------
  it("Scenario 2: Double-Booking Prevention: Two simultaneous requests for the same seat - exactly one succeeds", async () => {
    const tripId = "d1000000-0000-0000-0000-000000000001";
    const seats = testDb.getTripSeats(tripId);
    const targetSeat = seats.find((s) => s.status === "available")!;

    // Launch two simultaneous competing booking promises
    const promiseUserA = testDb.createBookingAtomic({
      tripId,
      userId: "user-A",
      seatIds: [targetSeat.id],
      passengers: [
        {
          fullName: "User A",
          age: 30,
          gender: "male",
          seatNumber: targetSeat.seat_number,
        },
      ],
      contact: {
        name: "User A",
        email: "userA@example.com",
        phone: "+91 91111 11111",
      },
    });

    const promiseUserB = testDb.createBookingAtomic({
      tripId,
      userId: "user-B",
      seatIds: [targetSeat.id],
      passengers: [
        {
          fullName: "User B",
          age: 28,
          gender: "female",
          seatNumber: targetSeat.seat_number,
        },
      ],
      contact: {
        name: "User B",
        email: "userB@example.com",
        phone: "+91 92222 22222",
      },
    });

    const results = await Promise.allSettled([promiseUserA, promiseUserB]);

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    // Exactly one must succeed, and exactly one must fail with conflict
    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);

    const failureReason = (failed[0] as PromiseRejectedResult).reason.message;
    expect(failureReason).toContain("SEAT_NOT_AVAILABLE");

    // Invariant check: In the database, only ONE active booking seat exists for this trip_seat_id
    let activeSeatLinkCount = 0;
    for (const bs of testDb.bookingSeats.values()) {
      if (bs.trip_seat_id === targetSeat.id && (bs as any).is_active) {
        activeSeatLinkCount++;
      }
    }
    expect(activeSeatLinkCount).toBe(1);
  });

  // --------------------------------------------------------------------------
  // SCENARIO 3: PNR contains correct passenger, route, date, and seat info
  // --------------------------------------------------------------------------
  it("Scenario 3: PNR ticket contains correct passenger, route, date, and seat information", async () => {
    const tripId = "d1000000-0000-0000-0000-000000000001";
    const seats = testDb.getTripSeats(tripId);
    const targetSeat = seats[0];

    const result = await testDb.createBookingAtomic({
      tripId,
      userId: "demo-passenger-id",
      seatIds: [targetSeat.id],
      passengers: [
        {
          fullName: "Aditi Roy",
          age: 24,
          gender: "female",
          seatNumber: targetSeat.seat_number,
        },
      ],
      contact: {
        name: "Aditi Roy",
        email: "aditi@example.com",
        phone: "+91 98111 22334",
      },
    });

    const pnr = result.booking.pnr;
    const retrievedTicket = testDb.getBookingByPnr(pnr);

    expect(retrievedTicket).not.toBeNull();
    expect(retrievedTicket?.pnr).toBe(pnr);
    expect(retrievedTicket?.passengers?.[0].full_name).toBe("Aditi Roy");
    expect(retrievedTicket?.passengers?.[0].seat_number).toBe(targetSeat.seat_number);
    expect(retrievedTicket?.trip?.route?.origin_city).toBe("Mumbai");
    expect(retrievedTicket?.trip?.route?.destination_city).toBe("Pune");
    expect(retrievedTicket?.status).toBe("confirmed");
  });

  // --------------------------------------------------------------------------
  // SCENARIO 4: Idempotency Key Replay
  // --------------------------------------------------------------------------
  it("Scenario 4: Idempotency: Repeated request with same key returns original booking without duplicating records", async () => {
    const tripId = "d1000000-0000-0000-0000-000000000001";
    const seats = testDb.getTripSeats(tripId);
    const targetSeat = seats[1];
    const idempotencyKey = "idem-test-key-12345";

    const payload = {
      tripId,
      userId: "demo-passenger-id",
      seatIds: [targetSeat.id],
      passengers: [
        {
          fullName: "Ravi Ranjan",
          age: 26,
          gender: "male" as const,
          seatNumber: targetSeat.seat_number,
        },
      ],
      contact: {
        name: "Ravi Ranjan",
        email: "passenger@algions.com",
        phone: "+91 98765 00001",
      },
      idempotencyKey,
    };

    // First attempt
    const firstAttempt = await testDb.createBookingAtomic(payload);
    expect(firstAttempt.success).toBe(true);
    expect(firstAttempt.isIdempotentReplay).toBe(false);

    // Replay with exact same idempotency key
    const replayAttempt = await testDb.createBookingAtomic(payload);
    expect(replayAttempt.success).toBe(true);
    expect(replayAttempt.isIdempotentReplay).toBe(true);
    expect(replayAttempt.booking.id).toBe(firstAttempt.booking.id);
    expect(replayAttempt.booking.pnr).toBe(firstAttempt.booking.pnr);

    // Replay with modified payload must throw
    await expect(
      testDb.createBookingAtomic({
        ...payload,
        tripId: "d1000000-0000-0000-0000-000000000002",
      })
    ).rejects.toThrow("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
  });

  // --------------------------------------------------------------------------
  // SCENARIO 5: Cancellation & Seat Release
  // --------------------------------------------------------------------------
  it("Scenario 5: Cancellation updates seat availability to 'available' and calculates simulated refund", async () => {
    const tripId = "d1000000-0000-0000-0000-000000000001";
    const seats = testDb.getTripSeats(tripId);
    const targetSeat = seats[2];

    // 1. Create booking
    const bookingResult = await testDb.createBookingAtomic({
      tripId,
      userId: "demo-passenger-id",
      seatIds: [targetSeat.id],
      passengers: [
        {
          fullName: "Ravi Ranjan",
          age: 26,
          gender: "male",
          seatNumber: targetSeat.seat_number,
        },
      ],
      contact: {
        name: "Ravi Ranjan",
        email: "passenger@algions.com",
        phone: "+91 98765 00001",
      },
    });

    const bookingId = bookingResult.booking.id;

    // Verify seat is initially booked
    expect(testDb.tripSeats.get(targetSeat.id)?.status).toBe("booked");

    // 2. Cancel booking
    const cancelResult = await testDb.cancelBookingAtomic({
      bookingId,
      userId: "demo-passenger-id",
      reason: "Meeting rescheduled",
    });

    expect(cancelResult.success).toBe(true);
    expect(cancelResult.cancellation.refund_percentage).toBeGreaterThan(0);
    expect(cancelResult.cancellation.refund_status).toBe("simulated_processed");

    // Verify booking status is cancelled
    const bookingAfterCancel = testDb.getBookingById(bookingId);
    expect(bookingAfterCancel?.status).toBe("cancelled");

    // Verify seat is restored to available
    const seatAfterCancel = testDb.tripSeats.get(targetSeat.id);
    expect(seatAfterCancel?.status).toBe("available");

    // 3. Confirm that another passenger can now book this exact seat without conflict!
    const rebookResult = await testDb.createBookingAtomic({
      tripId,
      userId: "another-user",
      seatIds: [targetSeat.id],
      passengers: [
        {
          fullName: "New Passenger",
          age: 29,
          gender: "female",
          seatNumber: targetSeat.seat_number,
        },
      ],
      contact: {
        name: "New Passenger",
        email: "new@example.com",
        phone: "+91 98888 77777",
      },
    });

    expect(rebookResult.success).toBe(true);
    expect(rebookResult.booking.status).toBe("confirmed");
  });

  // --------------------------------------------------------------------------
  // SCENARIO 6: Operator Manifest & Occupancy Summaries Reconcile
  // --------------------------------------------------------------------------
  it("Scenario 6: Operator manifest and occupancy summaries reconcile with confirmed bookings", async () => {
    const tripId = "d1000000-0000-0000-0000-000000000001";
    const seats = testDb.getTripSeats(tripId);

    // Book 2 seats
    const bkg1 = await testDb.createBookingAtomic({
      tripId,
      userId: "demo-passenger-id",
      seatIds: [seats[3].id, seats[4].id],
      passengers: [
        { fullName: "Pax One", age: 25, gender: "male", seatNumber: seats[3].seat_number },
        { fullName: "Pax Two", age: 24, gender: "female", seatNumber: seats[4].seat_number },
      ],
      contact: { name: "Pax One", email: "pax1@test.com", phone: "+91 98765 11111" },
    });

    // Check Operator Manifest
    const manifest = testDb.getPassengerManifest(tripId);
    expect(manifest.length).toBeGreaterThanOrEqual(2);

    const pax1Entry = manifest.find((m) => m.pnr === bkg1.booking.pnr && m.seat_number === seats[3].seat_number);
    const pax2Entry = manifest.find((m) => m.pnr === bkg1.booking.pnr && m.seat_number === seats[4].seat_number);

    expect(pax1Entry).toBeDefined();
    expect(pax2Entry).toBeDefined();
    expect(pax1Entry?.booking_status).toBe("confirmed");

    // Check Occupancy Report
    const reports = testDb.getOccupancyReports();
    const tripReport = reports.find((r) => r.trip_id === tripId);

    expect(tripReport).toBeDefined();
    expect(tripReport?.booked_seats).toBeGreaterThanOrEqual(2);
    expect(tripReport?.total_seats).toBe(tripReport!.booked_seats + tripReport!.available_seats);
    expect(tripReport?.gross_revenue).toBeGreaterThanOrEqual(bkg1.booking.total_fare);
    expect(tripReport?.net_revenue).toBe(tripReport!.gross_revenue - tripReport!.cancelled_revenue);
  });
});

