# ALGIONS Bus Booking Management System

Production-Style Full-Stack Bus Booking Management System developed for the **ALGIONS AI LABS PRIVATE LIMITED Full-Stack Web Development Assessment**.

---

## 🚌 System Overview
An enterprise-grade intercity bus booking and fleet management system engineered with strict PostgreSQL row-level locks, zero double-booking concurrency guarantees, deterministic idempotency, server-side RBAC, privacy-safe QR boarding pass verification, policy-driven simulated refunds, and real-time passenger manifest reconciliation.

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (Strict Mode), Tailwind CSS, Radix UI, Lucide React, QR Code Generator.
- **Backend**: Next.js Route Handlers, Application Service Layer, Supabase SSR & Admin SDK, Zod Schema Validation, Serverless Sliding-Window Rate Limiting.
- **Database**: Supabase PostgreSQL, SQL Migrations, Deterministic `ORDER BY id FOR UPDATE` Row-Level Locking, Partial Unique Storage Invariant Indexes, Row Level Security (RLS) on all 15 tables.
- **Testing**: Vitest 3.2, Real PostgreSQL Multi-Session Concurrency Suite, Playwright E2E.
- **Deployment**: Vercel (Frontend & Serverless Edge) + Supabase (Managed PostgreSQL & Auth).

---

## 🎯 Mandatory Acceptance Scenarios Verified

| Acceptance Scenario | Implementation & Verification Status | Test Evidence |
| :--- | :--- | :--- |
| **1. Passenger searches for a valid trip and books an available seat** | **VERIFIED** • Interactive blueprint seat selection with live price calculation and instant PNR issuance. | `tests/integration/booking-concurrency.test.ts` (Scenario 1) |
| **2. Two users cannot confirm the same seat on one trip** | **VERIFIED** • Guaranteed by `ORDER BY id FOR UPDATE` row locking in `create_booking_atomic` + storage invariant index `idx_booking_seats_active_trip_seat`. | `tests/integration/postgres-concurrency-multi-session.test.ts` (Tests 1 & 2) |
| **3. PNR contains correct passenger, route, date, and seat information** | **VERIFIED** • Printable digital boarding pass / e-ticket with scannable QR pass and verified manifest details. | `tests/integration/booking-concurrency.test.ts` (Scenario 3) |
| **4. Public QR verification protects passenger privacy** | **VERIFIED** • Public `/verify?pnr=ALG-XXXXXX` endpoint displays boarding validity, vehicle model, and seats while withholding all passenger PII. | `tests/unit/ticket-verification.test.ts` |
| **5. Cancellation updates seat availability and simulated refund status** | **VERIFIED** • Tiered lead-time policy (>24h: 90%, 12-24h: 75%, 2-12h: 50%, <2h: 0%) and immediate seat release. | `tests/unit/cancellation-policy.test.ts` |
| **6. Operator manifest and occupancy summaries reconcile with confirmed bookings** | **VERIFIED** • Real-time passenger boarding manifest, load factors, gross ticket sales, refund deductions, and net revenue. | `tests/integration/booking-concurrency.test.ts` (Scenario 6) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- `npm` or `pnpm`

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Raviranjan010/ALGIONS.git
cd ALGIONS

# Install dependencies
pnpm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Running the Development Server
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Running Automated Tests & Verification
```bash
# Type checking
npm run type-check

# ESLint code quality
npm run lint

# Automated test suite (Vitest)
npm run test

# Production build
npm run build
```

---

## 🔒 Security & Access Control Highlights

1. **Server-Side Authentication**: Integrated with Supabase Auth using secure `HttpOnly`, `SameSite=Lax`, and `Secure` cookies. Zero trust for caller-supplied headers.
2. **Server-Side RBAC**: Strict role boundaries enforced on every API route (`Passenger`, `Operator`, `Admin`). Public registrations strictly default to `passenger`.
3. **Double-Booking Elimination**:
   - Tuple lock: `PERFORM id FROM trip_seats ... ORDER BY id FOR UPDATE` eliminates race conditions and deadlocks.
   - Database constraint: Partial unique index `idx_booking_seats_active_trip_seat` prevents duplicate active bookings at the physical storage level.
4. **Zero-PII Public Verification**: Ticket QR codes resolve to `/verify?pnr=ALG-XXXXXX`, serving boarding authenticity without exposing passenger names, phone numbers, emails, or fares.
5. **Rate Limiting**: Sliding window rate limits protect authentication, booking creation, and ticket verification endpoints.

---

## 📚 Technical Documentation Index

- [Production Audit Report](docs/PRODUCTION_AUDIT.md)
- [Final Release Report](docs/FINAL_RELEASE_REPORT.md)
- [Authentication & RBAC Architecture](docs/AUTHENTICATION.md)
- [Database Schema & Architecture](docs/DATABASE_ARCHITECTURE.md)
- [Booking Engine & Concurrency Control](docs/BOOKING_ENGINE.md)
- [Concurrency Testing Methodology](docs/CONCURRENCY_TESTING.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Security Guidelines & Credential Protection](docs/SECURITY.md)
- [Deployment Guide (Vercel & Supabase)](docs/DEPLOYMENT.md)
- [Environment Variables Specification](docs/ENVIRONMENT_VARIABLES.md)
- [Production Deployment Checklist](docs/PRODUCTION_CHECKLIST.md)
- [Known Limitations & Architecture Roadmap](docs/KNOWN_LIMITATIONS.md)

---

## 👥 Demo Accounts (Development / Sandbox)

> [!WARNING]
> Rotate passwords in the Supabase Dashboard prior to making the application publicly accessible in production.

- **Passenger Portal**: `passenger@algions.com` / `Passenger@123`
- **Operator Portal**: `operator@royalexpress.in` / `Operator@123`
- **Administrator Portal**: `admin@algions.com` / `Admin@123`
