# Booking Engine Specification & Concurrency Control

**Document:** `docs/BOOKING_ENGINE.md`  
**Core Responsibility:** Zero Double-Bookings, Atomic Execution, Tiered Cancellations & Rebooking  

---

## 1. Concurrency Architecture

The ALGIONS booking engine employs a **two-tier defense-in-depth architecture** to eliminate double bookings and race conditions:

```
[Incoming Concurrent Requests]
             │
             ▼
[Step 1: Deterministic Tuple Row-Level Lock]
PERFORM id FROM public.trip_seats 
WHERE id = ANY(p_seat_ids) AND trip_id = p_trip_id AND status = 'available'
ORDER BY id FOR UPDATE;
  ├── Session 1: Acquires ExclusiveLock on tuple
  └── Session 2: Enters PostgreSQL Wait Queue (wait_event = 'tuple')
             │
             ▼
[Step 2: Aggregate-Free Count & Fare Calculation]
SELECT count(*), coalesce(sum(fare), 0)
INTO v_locked_seats_count, v_total_fare
FROM public.trip_seats
WHERE id = ANY(p_seat_ids) AND trip_id = p_trip_id AND status = 'available';
  ├── If locked count matches requested: Proceed to insert
  └── If count mismatch: ABORT with SEAT_NOT_AVAILABLE
             │
             ▼
[Step 3: Storage-Level Constraint Verification]
UNIQUE INDEX idx_booking_seats_active_trip_seat 
ON public.booking_seats (trip_seat_id) WHERE (is_active = true);
  └── Catches any application-level or race-condition bypass at disk storage
```

---

## 2. Hardened Idempotency Guarantee

Every booking request accepts an optional `idempotencyKey`:
1. When a key is received, the engine checks for existing bookings with that key.
2. If found, the engine verifies the complete payload fingerprint:
   - Trip ID matches.
   - User ID matches.
   - Allocated seat IDs match the requested seat IDs.
3. If the fingerprint matches: the original booking is returned with `isIdempotentReplay: true`.
4. If a different seat selection or different trip reuses the key: the transaction aborts with `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.

---

## 3. Passenger-to-Seat Validation

Before creating records, the engine validates:
1. `length(p_passengers) == length(p_seat_ids)`.
2. Each passenger's `seatNumber` exists in the set of locked seats.
3. No two passengers share the same seat number within the request.
4. All passenger full names are non-empty, ages are between 1 and 120, and genders are valid.

---

## 4. Policy-Driven Cancellation & Seat Restoration

Cancellations execute atomically via `cancel_booking_atomic`:
1. **Ownership Check**: Verifies caller is booking owner, operator member, or admin.
2. **Refund Calculation**:
   - `> 24 hours` before departure: **90% refund** (`simulated_processed`).
   - `12 to 24 hours` before departure: **75% refund** (`simulated_processed`).
   - `2 to 12 hours` before departure: **50% refund** (`simulated_processed`).
   - `< 2 hours` before departure: **0% refund** (`non_refundable`).
3. **Seat Deactivation**: Sets `is_active = false` on `booking_seats`.
4. **Inventory Restoration**: Updates `trip_seats` setting `status = 'available'`.
5. **Immediate Re-booking**: Because `is_active = false`, the partial unique index allows subsequent sessions to immediately book the released seat.
