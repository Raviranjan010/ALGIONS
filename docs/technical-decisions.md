# Technical Decisions Log

## Decision 1: Modular Monolith Architecture
- **Context**: The assignment required delivering a complete, robust, full-stack booking system with complex transactions.
- **Decision**: Implemented as a Next.js 15 App Router modular monolith.
- **Rationale**: Eliminates unnecessary network hops and distributed transaction overhead (e.g. Saga patterns or 2PC) between separate microservices, while maintaining clean separation of concerns in `src/services`, `src/app/api`, and `src/components`.

## Decision 2: Zero Double-Booking Guarantee via Row-Level Locking & Storage Invariant
- **Context**: In bus ticketing, two users must never be able to book the same seat simultaneously under high load.
- **Decision**: Implemented a two-tiered defense:
  1. Transactional RPC function `create_booking_atomic` with `SELECT ... FOR UPDATE` row locks on `trip_seats`.
  2. Partial unique index: `CREATE UNIQUE INDEX idx_booking_seats_active_trip_seat ON public.booking_seats(trip_seat_id) WHERE (is_active = true)`.
- **Rationale**: Relying only on application-level checks or read-then-write logic leaves a race window. The PostgreSQL row lock prevents concurrent transactions from reading an available seat while another transaction is committing it. The partial unique index provides a mathematical guarantee at the database storage engine layer.

## Decision 3: Idempotency Key Implementation
- **Context**: Mobile or spotty network connections may cause double-submissions from passengers clicking "Book Now" repeatedly or network retries.
- **Decision**: Included `idempotency_key` parameter in booking creation.
- **Rationale**: If the exact same idempotency key and payload are submitted, the server re-returns the existing confirmed booking without charging or altering seat states. If the key is reused with a different payload, the request is rejected with `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.

## Decision 4: Policy-Driven Tiered Simulated Cancellation Refunds
- **Context**: Realistic transport systems enforce cancellation fee schedules based on lead time.
- **Decision**:
  - `> 24 hours` before departure: 90% refund (10% cancellation charge)
  - `12 to 24 hours` before departure: 75% refund (25% cancellation charge)
  - `2 to 12 hours` before departure: 50% refund (50% cancellation charge)
  - `< 2 hours` before departure: 0% refund (non-refundable)
- **Rationale**: Clear, transparent, deterministic cancellation rules with historical record preservation in `cancellations` and `audit_logs`.
