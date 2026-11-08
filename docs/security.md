# Security & Access Control Documentation

## 1. Authentication & Session Handling
- **Supabase Auth Integration**: Supports email/password authentication and federated tokens.
- **Session Persistence**: HTTP cookies with `SameSite=Lax` and cryptographic user payload.
- **Server-Side Validation**: Role permissions are verified on the server side; client claims are never trusted for financial operations or seat inventory changes.

---

## 2. Row Level Security (RLS) Policies
PostgreSQL RLS is enabled on all tables in public schema:
- **`profiles`**: Viewable only by the account owner or verified system administrators.
- **`trips`, `routes`, `vehicles`**: Publicly readable for active trips to facilitate search; modifications restricted to operator staff who are verified members of that operator via `is_operator_member(auth.uid(), operator_id)`.
- **`bookings`, `booking_passengers`, `booking_seats`**:
  - Passenger can only query their own bookings (`user_id = auth.uid()`).
  - Operators can only query bookings for trips operated by their company.
  - Administrators have system-wide read access.
- **`cancellations`**: Can only be read and initiated by the booking owner or authorized operator staff.
- **`audit_logs`**: Append-only log readable solely by verified administrators.

---

## 3. Database Security & Transaction Safety
- **`SECURITY DEFINER` Functions**:
  - Both `create_booking_atomic` and `cancel_booking_atomic` are configured with `SET search_path = public` to prevent search-path injection exploits.
- **Double-Booking Prevention**:
  - Row-level lock: `SELECT ... FOR UPDATE` acquires an exclusive row lock on the requested seats.
  - Partial unique index: `CREATE UNIQUE INDEX idx_booking_seats_active_trip_seat ON public.booking_seats(trip_seat_id) WHERE (is_active = true)` prevents race conditions at the database constraint level.
- **Secrets Management**:
  - Service-role keys (`SUPABASE_SERVICE_ROLE_KEY`) are kept on the server only and never exposed in `NEXT_PUBLIC_*` environment variables.

