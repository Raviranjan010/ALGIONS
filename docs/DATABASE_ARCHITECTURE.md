# PostgreSQL Database Architecture & Schema Specification

**Document:** `docs/DATABASE_ARCHITECTURE.md`  
**Target Platform:** PostgreSQL 15+ / Supabase  

---

## 1. Architectural Invariants

The ALGIONS database schema is engineered for strict relational integrity, concurrent transaction serialization, and multi-tenant isolation:

1. **UUID Primary Keys**: Every table uses a `UUID` primary key (`gen_random_uuid()` or references `auth.users(id)`).
2. **Deterministic Row Locks**: Concurrent seat allocations acquire row-level locks sorted by `id` (`PERFORM id FROM trip_seats ... ORDER BY id FOR UPDATE`) to prevent deadlocks.
3. **Storage-Level Double-Booking Invariant**:
   ```sql
   CREATE UNIQUE INDEX idx_booking_seats_active_trip_seat 
   ON public.booking_seats (trip_seat_id) 
   WHERE (is_active = true);
   ```
   This partial unique index guarantees that under no isolation level or race condition can two active bookings allocate the same seat.
4. **Row Level Security (RLS)**: Enforced across all 15 public tables, preventing unauthorized multi-tenant data access.

---

## 2. Table Specifications

### 2.1 Identity & Multi-Tenancy
- **`public.profiles`**: Extends `auth.users(id)` with `email`, `full_name`, `role` (`passenger`, `operator`, `admin`), `phone`.
- **`public.operators`**: Bus transport companies (`name`, `slug`, `code`, `contact_email`, `contact_phone`, `is_active`).
- **`public.operator_members`**: Operator staff authorization mapping users to operators with roles (`owner`, `admin`, `dispatcher`, `staff`).

### 2.2 Fleet & Routes
- **`public.vehicles`**: Fleet assets (`registration_number`, `model`, `total_capacity`, `layout_type`, `is_active`).
- **`public.vehicle_seats`**: Physical vehicle blueprints (`seat_number`, `deck`, `seat_row`, `seat_column`, `seat_type`).
- **`public.routes`**: Intercity corridors (`route_number`, `origin_city`, `destination_city`, `distance_km`, `estimated_duration_mins`).
- **`public.route_stops`**: Intermediate boarding and dropping waypoints (`stop_name`, `city`, `stop_order`).

### 2.3 Schedule & Seat Inventory
- **`public.trips`**: Scheduled departures (`trip_code`, `departure_time`, `arrival_time`, `base_fare`, `status`).
- **`public.trip_seats`**: Trip-level dynamic seat inventory (`trip_id`, `vehicle_seat_id`, `seat_number`, `fare`, `status`: `'available'`, `'reserved'`, `'booked'`, `'blocked'`).

### 2.4 Bookings, Tickets & Audit
- **`public.bookings`**: Confirmed passenger reservations (`pnr`, `trip_id`, `user_id`, `contact_name`, `contact_email`, `contact_phone`, `total_fare`, `status`, `idempotency_key`).
- **`public.booking_passengers`**: Individual passenger details (`booking_id`, `full_name`, `age`, `gender`, `seat_number`).
- **`public.booking_seats`**: Allocated seats linked to trip seats (`booking_id`, `trip_seat_id`, `seat_number`, `fare`, `is_active`).
- **`public.cancellations`**: Revocation records (`booking_id`, `cancelled_by`, `reason`, `refund_percentage`, `refund_amount`, `refund_status`).
- **`public.audit_logs`**: Immutable security audit trail (`user_id`, `action`, `entity_type`, `entity_id`, `details`).

---

## 3. Stored Procedures (RPCs)

### 3.1 `create_booking_atomic`
- **Security**: `SECURITY DEFINER`, `SET search_path = pg_catalog, public`
- **Permissions**: Revoked from `PUBLIC` & `anon`; Granted to `authenticated` and `service_role`.
- **Key Enhancements**:
  - Enforces `auth.uid() = p_user_id` (or caller is admin).
  - Validates full idempotency fingerprint (trip, user, and seat array match).
  - Acquires deterministic row lock without aggregate functions: `PERFORM id ... ORDER BY id FOR UPDATE`.
  - Asserts passenger count and passenger seat mapping before booking insertion.

### 3.2 `cancel_booking_atomic`
- **Security**: `SECURITY DEFINER`, `SET search_path = pg_catalog, public`
- **Permissions**: Revoked from `PUBLIC` & `anon`; Granted to `authenticated` and `service_role`.
- **Key Enhancements**:
  - Locks booking row `FOR UPDATE`.
  - Enforces ownership: only passenger owner, operating operator member, or admin can cancel.
  - Deactivates `booking_seats(is_active = false)`, restoring `trip_seats` status to `'available'`.
  - Applies tiered refund schedule (>24h: 90%, 12-24h: 75%, 2-12h: 50%, <2h: 0%).

### 3.3 `verify_ticket_by_pnr`
- **Security**: `SECURITY DEFINER`, `STABLE`, `SET search_path = pg_catalog, public`
- **Permissions**: Granted to `anon`, `authenticated`, and `service_role`.
- **Bug Fix Applied (ISSUE-01)**: Declares nullable `v_cancelled_at TIMESTAMPTZ := NULL;`, eliminating unassigned RECORD dereference on confirmed tickets.
- **Privacy Assurance**: Returns operational boarding pass status while withholding all passenger PII.

