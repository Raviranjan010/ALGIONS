# ALGIONS Bus Booking Management System — Production Architecture & Security Audit

**Document:** `docs/PRODUCTION_AUDIT.md`  
**Date:** November 2026  
**Auditor:** Principal Software Architect, Application Security & Database Engineering Team  
**Audit Target:** Repository `https://github.com/Raviranjan010/ALGIONS`  
**Status:** Audit Completed & Implementation Underway  

---

## 1. Executive Summary

A comprehensive, deep-level audit was conducted across the ALGIONS codebase, covering:
1. Application routes and Next.js 15 App Router architecture.
2. Authentication, cookie session management, and server-side RBAC.
3. PostgreSQL migrations, triggers, constraints, indexes, and stored procedures (RPCs).
4. Service layers and data-access isolation.
5. Automated test harnesses (Vitest unit/integration, Playwright E2E, PostgreSQL concurrency).
6. Tooling, ESLint configuration, TypeScript compilation, and Vercel/Supabase deployment pipelines.

The audit revealed 12 distinct issues ranging from Critical security vulnerabilities (unauthenticated endpoints, client-side role injection, and unassigned PL/pgSQL record exceptions) to data integrity and testing deficiencies.

---

## 2. Detailed Findings Register

### ISSUE-01: Runtime Exception in `verify_ticket_by_pnr` on Confirmed Bookings
- **Severity**: CRITICAL (Database Crash / Verification Failure)
- **File**: `supabase/migrations/20260201000001_booking_engine_rpc.sql`
- **Affected Function**: `public.verify_ticket_by_pnr(p_pnr TEXT)`
- **Vulnerability / Flaw**:
  The function declares `v_cancellation RECORD;`. Inside the function, the query to populate `v_cancellation` is wrapped inside `IF v_booking.status = 'cancelled' THEN ... END IF;`. However, the return statement attempts to construct JSON containing `'cancelledAt', v_cancellation.created_at`. When a booking is in `confirmed` status, `v_cancellation` is unassigned. In PL/pgSQL, dereferencing an unassigned RECORD variable causes an immediate runtime exception: `record "v_cancellation" is not assigned yet`.
- **Impact**: All scannable QR verification checks crash for valid, confirmed tickets.
- **Proposed Correction**: Declare `v_cancelled_at TIMESTAMPTZ := NULL;`. Inside the cancelled branch, populate `SELECT created_at INTO v_cancelled_at FROM public.cancellations ...`. Construct JSON with `'cancelledAt', v_cancelled_at`.
- **Status**: Fixed in Migration 20260201000001.

---

### ISSUE-02: Authentication Bypass, Passwordless Login & Role Inference
- **Severity**: CRITICAL (Authentication / Authorization)
- **File**: `src/app/api/auth/login/route.ts`
- **Affected Function**: `POST(req: NextRequest)`
- **Vulnerability / Flaw**:
  1. Login does not verify submitted passwords against any database hash.
  2. If an email is not found, it auto-provisions a new profile in memory without password hashing.
  3. User role is inferred from email string pattern matching: `email.includes("operator") ? "operator" : email.includes("admin") ? "admin" : "passenger"`. Anyone typing `admin@domain.com` receives the administrative role.
  4. Session cookie `algions_user_session` is written with `httpOnly: false`, allowing client-side scripts to read/modify credentials.
- **Impact**: Complete authentication bypass and unauthorized privilege escalation.
- **Proposed Correction**: Integrate Supabase Auth (`supabase.auth.signInWithPassword`), verify password hashes, set `httpOnly: true, secure: true, sameSite: 'lax'`, query the user's role from the verified `profiles` table, and reject arbitrary email pattern matching.
- **Status**: Fixed in Phase 2.

---

### ISSUE-03: Self-Assigned Administrative Roles at Registration
- **Severity**: CRITICAL (Privilege Escalation)
- **File**: `src/app/api/auth/register/route.ts`
- **Affected Function**: `POST(req: NextRequest)`
- **Vulnerability / Flaw**:
  The registration schema and route accept `role: parsed.data.role` directly from the client request body. Any attacker can POST `{ "role": "admin" }` to register as an administrator.
- **Impact**: Complete compromise of platform oversight and operator boundaries.
- **Proposed Correction**: Public registration must strictly default to `passenger`. Elevated roles (`operator`, `admin`) can only be assigned through trusted server-side procedures or database administrative migration.
- **Status**: Fixed in Phase 2.

---

### ISSUE-04: Insecure API Authorization & Caller Identity Spoofing (`x-user-id`)
- **Severity**: CRITICAL (Access Control)
- **Files**:
  - `src/app/api/bookings/route.ts`
  - `src/app/api/cancellations/route.ts`
  - `src/app/api/passenger/bookings/route.ts`
- **Affected Functions**: `POST / GET` handlers
- **Vulnerability / Flaw**:
  The endpoints read `const userId = req.headers.get("x-user-id") || "demo-passenger-id";`. Any client can set `x-user-id: <victim-uuid>` to book tickets, cancel reservations, or retrieve confidential travel history on behalf of another user.
- **Impact**: Broken object-level authorization (BOLA) and arbitrary booking hijacking.
- **Proposed Correction**: Create centralized authentication session resolver (`getAuthenticatedUser(req)`) that extracts and cryptographically validates the Supabase session token or HTTP-only session cookie. Reject requests where caller identity is unverified with `401 UNAUTHORIZED`.
- **Status**: Fixed in Phase 2.

---

### ISSUE-05: Missing Authorization on Operator Manifests & Financial Endpoints
- **Severity**: CRITICAL (Data Exposure / Privacy)
- **Files**:
  - `src/app/api/operator/manifests/route.ts`
  - `src/app/api/operator/reports/occupancy/route.ts`
  - `src/app/api/operator/routes/route.ts`
  - `src/app/api/operator/trips/route.ts`
  - `src/app/api/operator/vehicles/route.ts`
- **Affected Functions**: `GET / POST` handlers
- **Vulnerability / Flaw**:
  These endpoints contain zero authorization checks. Any anonymous visitor or malicious actor can query passenger manifests (full names, seat numbers, contact phone, contact email) and financial revenue reports for any trip or operator.
- **Impact**: Massive passenger PII leak and business intelligence exposure violating data privacy regulations.
- **Proposed Correction**: Require verified session with `role IN ('operator', 'admin')`. Enforce multi-tenant boundary: verify that the authenticated operator owns the requested trip/operator ID via `operator_members` membership check. Return `403 FORBIDDEN` on unauthorized access.
- **Status**: Fixed in Phase 2 & Phase 7.

---

### ISSUE-06: PII Exposure on Public PNR Lookup Endpoint
- **Severity**: HIGH (Privacy / Information Disclosure)
- **File**: `src/app/api/bookings/pnr/[pnr]/route.ts`
- **Affected Function**: `GET(req, { params })`
- **Vulnerability / Flaw**:
  Returns the complete booking record including passenger full names, age, gender, contact email, contact phone, and total fare without requiring user authentication.
- **Impact**: Anyone guessing or intercepting a PNR can scrape personal identity and contact details.
- **Proposed Correction**: Require authentication to access `/api/bookings/pnr/[pnr]`, ensuring only the booking owner, operator member, or admin can read it. Direct all public QR scans to `/api/bookings/verify/[pnr]`, which returns strictly non-PII operational fields.
- **Status**: Fixed in Phase 6.

---

### ISSUE-07: Incomplete Idempotency Verification in Booking RPC
- **Severity**: HIGH (Data Integrity)
- **File**: `supabase/migrations/20260201000001_booking_engine_rpc.sql`
- **Affected Function**: `public.create_booking_atomic`
- **Vulnerability / Flaw**:
  The idempotency check compared only `trip_id` and `user_id`. If a client re-used an idempotency token with different seats or passengers on the same trip, the RPC treated it as an idempotent replay rather than rejecting it.
- **Impact**: Silent discrepancy between requested seats and confirmed booking.
- **Proposed Correction**: Validate the requested seat array against the existing booking's seats (`v_existing_seats = v_requested_seats`). If they do not match, abort with `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.
- **Status**: Fixed in Phase 5.

---

### ISSUE-08: Silent In-Memory Mock Fallback in Production
- **Severity**: HIGH (Reliability / Architecture)
- **Files**: `src/services/*`, `src/lib/supabase/config.ts`
- **Vulnerability / Flaw**:
  When Supabase environment variables were missing or invalid, services silently fell back to in-memory mock data without alerting operations.
- **Impact**: Production could boot in an isolated memory state where bookings disappear upon serverless cold restart.
- **Proposed Correction**: Implement strict environment variable validation (`src/lib/env.ts`). In production (`NODE_ENV === 'production'`), fail fast on startup if `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` are missing or set to placeholder values.
- **Status**: Fixed in Phase 3.

---

### ISSUE-09: Concurrency Test Harness Mocking PostgreSQL
- **Severity**: HIGH (Testing Validity)
- **File**: `tests/integration/postgres-concurrency-multi-session.test.ts`
- **Vulnerability / Flaw**:
  The test suite imported `InMemoryDatabase` rather than executing concurrent SQL transactions over independent database sessions.
- **Impact**: False confidence that PostgreSQL locking queries and partial unique indexes behave correctly under high concurrency.
- **Proposed Correction**: Build a genuine multi-session PostgreSQL test harness (`tests/integration/real-postgres-concurrency.test.ts` / `supabase/tests/concurrency_test.sql`) using independent Supabase/pg client connections executing simultaneous `create_booking_atomic` RPCs.
- **Status**: Fixed in Phase 9.

---

### ISSUE-10: Missing ESLint Configuration & Interactive Prompts
- **Severity**: MEDIUM (Tooling / CI/CD)
- **File**: `.eslintrc.json` (missing)
- **Vulnerability / Flaw**:
  Running `npm run lint` triggered an interactive prompt because no ESLint configuration existed.
- **Impact**: Automated CI/CD build scripts hung indefinitely.
- **Proposed Correction**: Create standard `.eslintrc.json` extending `next/core-web-vitals` and add `"type-check": "tsc --noEmit"` to `package.json`.
- **Status**: Fixed in Phase 10.

---

### ISSUE-11: Rate Limiting Omission on Sensitive Public Endpoints
- **Severity**: MEDIUM (Security / DoS / Enumeration)
- **Files**: `src/app/api/auth/*`, `src/app/api/bookings/verify/*`
- **Vulnerability / Flaw**:
  No rate limiting on login, registration, or ticket verification endpoints.
- **Impact**: Susceptible to credential stuffing and brute-force PNR enumeration.
- **Proposed Correction**: Implement a serverless-compatible sliding window rate limiter utility (`src/lib/security/rate-limit.ts`) returning `429 Too Many Requests` with `Retry-After` headers.
- **Status**: Fixed in Phase 6.

---

### ISSUE-12: Missing Passenger-to-Seat Validation Constraints
- **Severity**: MEDIUM (Data Consistency)
- **File**: `supabase/migrations/20260201000001_booking_engine_rpc.sql`
- **Affected Function**: `public.create_booking_atomic`
- **Vulnerability / Flaw**:
  The function checked only that the passenger array length matched the seat array length, but did not assert that each passenger's `seatNumber` existed in the locked seat set.
- **Impact**: Passengers could theoretically be allocated seat numbers not requested or paid for.
- **Proposed Correction**: Validate that every passenger's `seatNumber` exists in `trip_seats` where `id = ANY(p_seat_ids)`.
- **Status**: Fixed in Phase 5.

---

## 3. Remediation Matrix

| Issue ID | Severity | Area | Status | Verification Target |
| :--- | :---: | :--- | :---: | :--- |
| **ISSUE-01** | CRITICAL | Database RPC | **FIXED** | SQL test passes for confirmed & cancelled tickets |
| **ISSUE-02** | CRITICAL | Auth / Session | **FIXED** | Supabase Auth login, HttpOnly cookies, bcrypt hash check |
| **ISSUE-03** | CRITICAL | Authorization | **FIXED** | Registration role defaults strictly to passenger |
| **ISSUE-04** | CRITICAL | API Security | **FIXED** | Server-side session verification; reject `x-user-id` |
| **ISSUE-05** | CRITICAL | Operator RBAC | **FIXED** | Operator/admin ownership checks on manifests/reports |
| **ISSUE-06** | HIGH | Data Privacy | **FIXED** | Authenticated PNR lookup; zero-PII public verify |
| **ISSUE-07** | HIGH | Idempotency | **FIXED** | Replay checks complete seat & passenger fingerprint |
| **ISSUE-08** | HIGH | Environment | **FIXED** | Strict Zod env validation; fail-fast in production |
| **ISSUE-09** | HIGH | Concurrency | **FIXED** | Independent multi-session PostgreSQL concurrency test |
| **ISSUE-10** | MEDIUM | Tooling | **FIXED** | Non-interactive ESLint & type-check npm scripts |
| **ISSUE-11** | MEDIUM | Security / DoS | **FIXED** | Serverless sliding-window rate limiting on auth & verify |
| **ISSUE-12** | MEDIUM | Business Logic | **FIXED** | Strict passenger seat mapping validation in RPC |

---
