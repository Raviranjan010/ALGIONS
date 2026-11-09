# Pre-Flight Production Deployment Checklist

**Document:** `docs/PRODUCTION_CHECKLIST.md`  
**Target:** Vercel + Supabase Production Environment  

---

## 1. Database & Schema Verification (Supabase)

- [x] Run `supabase/migrations/20260201000000_initial_schema.sql` (15 tables, constraints, partial unique indexes, RLS).
- [x] Run `supabase/migrations/20260201000001_booking_engine_rpc.sql` (`create_booking_atomic`, `cancel_booking_atomic`, `verify_ticket_by_pnr`).
- [x] Run `supabase/seed.sql` (Seed operators, luxury vehicles, routes, trips, seats).
- [x] Verify partial unique index `idx_booking_seats_active_trip_seat` exists on `booking_seats`.
- [x] Verify RLS is enabled on all 15 public tables.
- [x] Verify execution grants: `REVOKE ALL FROM PUBLIC, anon` on `create_booking_atomic` and `cancel_booking_atomic`.
- [x] Verify `verify_ticket_by_pnr` has `v_cancelled_at TIMESTAMPTZ` fix (ISSUE-01).

---

## 2. Authentication & Security Verification

- [x] Public registration defaults strictly to `passenger` role.
- [x] Login strictly validates credentials via Supabase Auth / password hash (zero auto-creation).
- [x] Session cookie configured as `HttpOnly`, `SameSite=Lax`, and `Secure` (production).
- [x] APIs reject untrusted `x-user-id` headers, extracting verified session server-side.
- [x] Public QR verification endpoint `/api/bookings/verify/[pnr]` returns strictly zero passenger PII.
- [x] Rate limiting active on login, registration, booking, and ticket verification.

---

## 3. Tooling & Build Verification

- [x] `node ./node_modules/typescript/bin/tsc --noEmit` passes with 0 type errors.
- [x] `node ./node_modules/next/dist/bin/next lint` passes with 0 ESLint warnings or errors.
- [x] `node ./node_modules/vitest/vitest.mjs run` passes 100% of tests.
- [x] `node ./node_modules/next/dist/bin/next build` compiles all 28 routes with 0 errors.

---

## 4. Post-Deployment Verification (Smoke Tests)

- [ ] Homepage loads with 200 OK at production URL.
- [ ] User can register a new passenger account on `/register`.
- [ ] User can log in with valid credentials; invalid credentials return 401.
- [ ] Search returns scheduled trips from Supabase database.
- [ ] Passenger can select a seat, book, and receive confirmed PNR.
- [ ] Scannable QR code opens `/verify?pnr=ALG-XXXXXX` and displays verified boarding status.
- [ ] Operator dashboard displays manifests and financial reports strictly for that operator.
- [ ] Rotate demo passwords in Supabase Auth before sharing public URL.
