import { describe, it, expect, beforeAll } from "vitest";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Genuine Multi-Session PostgreSQL Concurrency Test Suite
 * Executes simultaneous transactions across independent Supabase clients/connections
 * against the PostgreSQL database engine to verify row-level locks and constraint invariants.
 */
describe("PostgreSQL Engine: Live Multi-Session Concurrency & Invariant Suite", () => {
  const isConfigured = isSupabaseConfigured();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Dedicated test trip from seed.sql
  const TEST_TRIP_ID = "d1000000-0000-0000-0000-000000000001";

  beforeAll(() => {
    if (!isConfigured) {
      console.log(
        "INFO: Live Supabase environment variables not configured. Skipping live network concurrency tests. Offline multi-session simulation is verified in postgres-concurrency-multi-session.test.ts."
      );
    }
  });

  // TEST 1: Two Independent Clients Competing for the Exact Same Seat
  it.runIf(isConfigured)("TEST 1: Two independent PostgreSQL sessions compete for same seat - exactly one succeeds", async () => {
    // Instantiate two completely independent Supabase client connections
    const clientA = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const clientB = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Find an available seat
    const { data: seats } = await clientA
      .from("trip_seats")
      .select("id, seat_number")
      .eq("trip_id", TEST_TRIP_ID)
      .eq("status", "available")
      .order("seat_number", { ascending: true })
      .limit(1);

    if (!seats || seats.length === 0) {
      console.warn("No available seat found on test trip to run concurrency test");
      return;
    }

    const targetSeat = seats[0];

    // Fire two simultaneous competing booking RPCs
    const [resA, resB] = await Promise.allSettled([
      clientA.rpc("create_booking_atomic", {
        p_trip_id: TEST_TRIP_ID,
        p_user_id: "e1000000-0000-0000-0000-000000000001",
        p_seat_ids: [targetSeat.id],
        p_passengers: [{ fullName: "Passenger A", age: 30, gender: "male", seatNumber: targetSeat.seat_number }],
        p_contact: { name: "Passenger A", email: "a@live-test.com", phone: "+91 91111 00001" },
        p_idempotency_key: `live-concurrency-A-${Date.now()}`,
      }),
      clientB.rpc("create_booking_atomic", {
        p_trip_id: TEST_TRIP_ID,
        p_user_id: "e1000000-0000-0000-0000-000000000002",
        p_seat_ids: [targetSeat.id],
        p_passengers: [{ fullName: "Passenger B", age: 28, gender: "female", seatNumber: targetSeat.seat_number }],
        p_contact: { name: "Passenger B", email: "b@live-test.com", phone: "+91 92222 00002" },
        p_idempotency_key: `live-concurrency-B-${Date.now()}`,
      }),
    ]);

    const aSuccess = resA.status === "fulfilled" && !resA.value.error;
    const bSuccess = resB.status === "fulfilled" && !resB.value.error;

    // Exactly one must succeed, and exactly one must fail
    expect(aSuccess !== bSuccess).toBe(true);

    // Verify database state: exactly 1 active booking_seats record exists
    const { data: activeAllocations } = await clientA
      .from("booking_seats")
      .select("id, booking_id")
      .eq("trip_seat_id", targetSeat.id)
      .eq("is_active", true);

    expect(activeAllocations?.length).toBe(1);
  });

  // TEST 2: High Concurrency Stampede - 10 Independent Clients
  it.runIf(isConfigured)("TEST 2: Ten independent sessions compete for single seat - exactly 1 wins, 9 rejected", async () => {
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: seats } = await admin
      .from("trip_seats")
      .select("id, seat_number")
      .eq("trip_id", TEST_TRIP_ID)
      .eq("status", "available")
      .limit(1);

    if (!seats || seats.length === 0) return;
    const targetSeat = seats[0];

    // Create 10 independent clients
    const clients = Array.from({ length: 10 }, () =>
      createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    );

    const promises = clients.map((client, idx) =>
      client.rpc("create_booking_atomic", {
        p_trip_id: TEST_TRIP_ID,
        p_user_id: `e1000000-0000-0000-0000-00000000000${(idx % 9) + 1}`,
        p_seat_ids: [targetSeat.id],
        p_passengers: [{ fullName: `Stampede ${idx}`, age: 25, gender: "male", seatNumber: targetSeat.seat_number }],
        p_contact: { name: `Stampede ${idx}`, email: `stampede${idx}@test.com`, phone: "+91 90000 00000" },
        p_idempotency_key: `live-stampede-${idx}-${Date.now()}`,
      })
    );

    const results = await Promise.all(promises);
    const successes = results.filter((r) => !r.error);
    const failures = results.filter((r) => r.error);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(9);

    failures.forEach((f) => {
      expect(f.error?.message).toContain("SEAT_NOT_AVAILABLE");
    });
  });

  // TEST 3: Cancellation and Immediate Seat Re-booking Invariant
  it.runIf(isConfigured)("TEST 3: Cancellation restores seat and allows immediate re-booking without constraint violation", async () => {
    const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // 1. Find seat
    const { data: seats } = await client
      .from("trip_seats")
      .select("id, seat_number")
      .eq("trip_id", TEST_TRIP_ID)
      .eq("status", "available")
      .limit(1);

    if (!seats || seats.length === 0) return;
    const targetSeat = seats[0];

    // 2. Book
    const { data: bookRes } = await client.rpc("create_booking_atomic", {
      p_trip_id: TEST_TRIP_ID,
      p_user_id: "e1000000-0000-0000-0000-000000000001",
      p_seat_ids: [targetSeat.id],
      p_passengers: [{ fullName: "Cancel Test", age: 30, gender: "male", seatNumber: targetSeat.seat_number }],
      p_contact: { name: "Cancel Test", email: "cancel@test.com", phone: "+91 93333 00001" },
    });

    const bookingId = bookRes.booking_id;

    // 3. Cancel
    const { data: cancelRes } = await client.rpc("cancel_booking_atomic", {
      p_booking_id: bookingId,
      p_user_id: "e1000000-0000-0000-0000-000000000001",
      p_reason: "Rescheduling travel",
    });

    expect(cancelRes.status).toBe("cancelled");

    // 4. Verify trip_seat is restored to 'available'
    const { data: updatedSeat } = await client
      .from("trip_seats")
      .select("status")
      .eq("id", targetSeat.id)
      .single();

    expect(updatedSeat?.status).toBe("available");

    // 5. Re-book the same seat
    const { data: rebookRes } = await client.rpc("create_booking_atomic", {
      p_trip_id: TEST_TRIP_ID,
      p_user_id: "e1000000-0000-0000-0000-000000000002",
      p_seat_ids: [targetSeat.id],
      p_passengers: [{ fullName: "New Passenger", age: 24, gender: "female", seatNumber: targetSeat.seat_number }],
      p_contact: { name: "New Passenger", email: "new@test.com", phone: "+91 93333 00002" },
    });

    expect(rebookRes.status).toBe("confirmed");
  });

  // TEST 4: Zero-PII Public Verification for Confirmed Ticket (Verifies Bug Fix ISSUE-01)
  it.runIf(isConfigured)("TEST 4: verify_ticket_by_pnr executes without unassigned RECORD error and omits PII", async () => {
    const client = createClient(supabaseUrl, anonKey);

    // Call verify on an existing confirmed booking PNR
    const { data: verifyRes, error } = await client.rpc("verify_ticket_by_pnr", {
      p_pnr: "ALG-ROYAL1",
    });

    expect(error).toBeNull();
    if (verifyRes && verifyRes.found) {
      expect(verifyRes.isValidForBoarding).toBe(true);
      expect(verifyRes.pnr).toBe("ALG-ROYAL1");
      expect(verifyRes.originCity).toBeDefined();
      expect(verifyRes.destinationCity).toBeDefined();

      // STRICT PII OMISSION ASSERTION
      const keys = Object.keys(verifyRes);
      expect(keys).not.toContain("contact_name");
      expect(keys).not.toContain("contact_email");
      expect(keys).not.toContain("contact_phone");
      expect(keys).not.toContain("passengers");
      expect(keys).not.toContain("total_fare");
    }
  });
});
