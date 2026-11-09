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

## 4. Hardened RPC Security & Least-Privilege Execution Model

### 4.1 Strict Caller Identity Enforcement
- The booking engine function `public.create_booking_atomic` enforces authenticated caller verification via `auth.uid()`.
- If an authenticated user attempts to pass a different `p_user_id`, the function verifies whether the caller is a system administrator (`is_admin(auth.uid())`). If not, it aborts with `UNAUTHORIZED_CALLER_IDENTITY`.
- Anonymous callers (`auth.uid() IS NULL` and JWT claim role ≠ `'service_role'`) are immediately rejected with `UNAUTHENTICATED`.
- The passenger identity recorded in `bookings` is derived directly from `auth.uid()`, preventing client-side user spoofing.

### 4.2 Least-Privilege Function Permissions
- `REVOKE ALL ON FUNCTION public.create_booking_atomic FROM PUBLIC, anon;`
- `GRANT EXECUTE ON FUNCTION public.create_booking_atomic TO authenticated, service_role;`
- `REVOKE ALL ON FUNCTION public.cancel_booking_atomic FROM PUBLIC, anon;`
- `GRANT EXECUTE ON FUNCTION public.cancel_booking_atomic TO authenticated, service_role;`
- `REVOKE ALL ON FUNCTION public.generate_pnr FROM PUBLIC, anon, authenticated;`
- `GRANT EXECUTE ON FUNCTION public.generate_pnr TO service_role;` (Internal helper called by `SECURITY DEFINER`).

### 4.3 Search-Path Injection Defense
- All database functions explicitly define `SET search_path = pg_catalog, public` to prevent schema hijacking and unauthorized object overrides in `SECURITY DEFINER` execution contexts.

---

## 5. Privacy-Preserving Public Ticket Verification (`/verify`)

A scannable QR code on a boarding pass must permit verification by conductors or transit authorities without leaking sensitive passenger PII (Personally Identifiable Information).

### Architecture:
1. **Public Read-Only RPC (`verify_ticket_by_pnr`)**:
   - Granted to `anon`, `authenticated`, and `service_role`.
   - Returns ONLY operational boarding status:
     - `pnr`: Unique alphanumeric booking code.
     - `status`: Booking state (`confirmed` / `cancelled`).
     - `isValidForBoarding`: Boolean flag.
     - `originCity` & `destinationCity`: Route corridor.
     - `departureTime` & `arrivalTime`: Timestamps.
     - `operatorName` & `busModel`: Vehicle details.
     - `seats`: Array of allocated seat numbers (e.g., `["1A", "1B"]`).
     - `cancelledAt`: Timestamp if revoked.
2. **Strict PII Exclusion**:
   - Passenger full names, ages, and genders are **completely omitted**.
   - Contact phone numbers and email addresses are **completely omitted**.
   - Transaction pricing, base fares, and total amounts paid are **completely omitted**.
3. **Public API Endpoint (`/api/bookings/verify/[pnr]`)**:
   - Lightweight, rate-limited public endpoint serving the sanitized verification JSON.

---

## 6. Concurrency & Double-Booking Elimination Architecture

### 6.1 Row-Level Exclusive Locking (`FOR UPDATE`)
- In PostgreSQL, `FOR UPDATE` cannot be applied directly to aggregate queries (`count(*)`, `sum(fare)`).
- The ALGIONS engine solves this with a two-phase transaction sequence:
  1. **Phase 1: Deterministic Tuple Locking**:
     ```sql
     PERFORM id FROM public.trip_seats
     WHERE id = ANY(p_seat_ids) AND trip_id = p_trip_id AND status = 'available'
     ORDER BY id
     FOR UPDATE;
     ```
     Locking rows individually with deterministic `ORDER BY id` prevents deadlocks when concurrent transactions request overlapping sets of seats.
  2. **Phase 2: Availability & Fare Calculation**:
     ```sql
     SELECT count(*), coalesce(sum(fare), 0)
     INTO v_locked_seats_count, v_total_fare
     FROM public.trip_seats
     WHERE id = ANY(p_seat_ids) AND trip_id = p_trip_id AND status = 'available';
     ```
     If `v_locked_seats_count <> array_length(p_seat_ids, 1)`, the transaction aborts with `SEAT_NOT_AVAILABLE`.

### 6.2 Storage-Level Defense-in-Depth Invariant
- Even if an application bug or direct SQL bypass attempts a concurrent write, PostgreSQL enforces a partial unique index:
  ```sql
  CREATE UNIQUE INDEX idx_booking_seats_active_trip_seat 
  ON public.booking_seats (trip_seat_id) 
  WHERE (is_active = true);
  ```
- This guarantees that two active bookings can never reference the same seat simultaneously under any isolation level.
