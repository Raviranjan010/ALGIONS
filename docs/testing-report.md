# Automated Testing Report

## 1. Test Suite Summary
- **Test Runner**: Vitest 3.2.7
- **Test Environment**: Node v22.20.0 / jsdom
- **Total Test Files**: 5 passed (5)
- **Total Tests**: 17 passed (17)
- **Status**: ALL VERIFIED PASSED

```
 ✓ tests/unit/cancellation-policy.test.ts (4 tests)
 ✓ tests/unit/validation.test.ts (3 tests)
 ✓ tests/unit/pnr.test.ts (2 tests)
 ✓ tests/integration/booking-concurrency.test.ts (6 tests)
 ✓ tests/unit/fare.test.ts (2 tests)

Test Files  5 passed (5)
     Tests  17 passed (17)
```

---

## 2. Acceptance Scenarios Verification

### Scenario 1: Search & Booking
- **Status**: VERIFIED
- **Evidence**: `tests/integration/booking-concurrency.test.ts -> Scenario 1`
- **Result**: Successfully found Mumbai -> Pune scheduled departure, locked seat `ts-t1-L1A`, generated PNR, and updated seat status to `booked`.

### Scenario 2: Concurrency & Double-Booking Prevention
- **Status**: VERIFIED
- **Evidence**: `tests/integration/booking-concurrency.test.ts -> Scenario 2`
- **Result**: Two concurrent booking promises launched against the exact same seat simultaneously. Exactly ONE succeeded; the competing promise received `SEAT_NOT_AVAILABLE: Seat is already booked or reserved`. Invariant check confirmed exactly 1 active seat allocation in `booking_seats`.

### Scenario 3: PNR Ticket Accuracy
- **Status**: VERIFIED
- **Evidence**: `tests/integration/booking-concurrency.test.ts -> Scenario 3`
- **Result**: PNR ticket retrieved by PNR query confirmed exact passenger name, route, departure date, and seat number matching the booking request.

### Scenario 4: Idempotency Protection
- **Status**: VERIFIED
- **Evidence**: `tests/integration/booking-concurrency.test.ts -> Scenario 4`
- **Result**: Replaying an identical booking request with the same idempotency key returned the original booking with `isIdempotentReplay: true`. Modifying the payload with the same key threw `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.

### Scenario 5: Policy-Driven Cancellation & Seat Restoration
- **Status**: VERIFIED
- **Evidence**: `tests/integration/booking-concurrency.test.ts -> Scenario 5`
- **Result**: Cancellation calculated tiered refund amount, changed booking status to `cancelled`, and restored the seat status to `available`. A subsequent booking request for that newly released seat succeeded immediately without conflict.

### Scenario 6: Operator Manifest & Occupancy Reconciliation
- **Status**: VERIFIED
- **Evidence**: `tests/integration/booking-concurrency.test.ts -> Scenario 6`
- **Result**: Passenger manifest matched confirmed passenger records. Occupancy report calculated exact seat counts (`total_seats = booked_seats + available_seats`) and reconciled `net_revenue = gross_revenue - cancelled_revenue`.

