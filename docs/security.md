# Security, Access Control & Credential Protection

## 1. Authentication & Session Handling
- **Supabase Auth Integration**: Supports email/password authentication, password hashing via bcrypt/Argon2, and federated tokens.
- **Session Persistence**: HTTP cookies with `SameSite=Lax` and cryptographic user payload.
- **Server-Side Authorization**: Role permissions are verified exclusively on the server; client claims are never trusted for financial operations or seat inventory changes.

---

## 2. Production Credential Rotation & Protection Guidelines

> [!WARNING]
> The demo accounts (`passenger@algions.com`, `operator@royalexpress.in`, `admin@algions.com`) are provided strictly for local interview demonstration and evaluation sandbox testing.

### Mandatory Production Checklist:
1. **Rotate Default Passwords Immediately**:
   - In production deployments on Supabase, navigate to **Authentication -> Users** and trigger password resets or set strong, random 20+ character passwords.
   - Never use default or predictable passwords for the `admin` role in public production.
2. **Restrict Administrative Profiles**:
   - The `admin` role grants system-wide oversight of all operators, vehicles, and audit logs.
   - In production, set `role = 'admin'` only for verified corporate operations staff through the Supabase Dashboard SQL Editor, never through public registration forms.
3. **Protect Service Role Secrets**:
   - `SUPABASE_SERVICE_ROLE_KEY` must be configured strictly in server environment variables on Vercel.
   - It must NEVER be prefixed with `NEXT_PUBLIC_` or bundled in client-side JavaScript.

---

## 3. Row Level Security (RLS) Policies
PostgreSQL RLS is enabled on all 15 tables in the public schema:
- **`profiles`**: Viewable only by the account owner (`auth.uid() = id`) or verified system administrators (`is_admin(auth.uid())`).
- **`trips`, `routes`, `vehicles`**: Publicly readable for active trips to facilitate search; modifications restricted to operator staff who are verified members of that operator via `is_operator_member(auth.uid(), operator_id)`.
- **`bookings`, `booking_passengers`, `booking_seats`**:
  - Passenger can only query their own bookings (`user_id = auth.uid()`).
  - Operators can only query bookings for trips operated by their company.
  - Administrators have system-wide read access.
- **`cancellations`**: Can only be read and initiated by the booking owner or authorized operator staff.
- **`audit_logs`**: Append-only log readable solely by verified administrators.

---

## 4. Database Security & Transaction Safety
- **`SECURITY DEFINER` Functions**:
  - Both `create_booking_atomic` and `cancel_booking_atomic` are configured with `SET search_path = public` to prevent search-path injection exploits.
- **Double-Booking Prevention**:
  - Row-level lock: `SELECT ... FOR UPDATE` acquires an exclusive row lock on the requested seats.
  - Partial unique index: `CREATE UNIQUE INDEX idx_booking_seats_active_trip_seat ON public.booking_seats(trip_seat_id) WHERE (is_active = true)` prevents race conditions at the database constraint level.
