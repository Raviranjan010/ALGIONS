# ALGIONS Bus Booking Management System

Production-Style Full-Stack Bus Booking Management System developed for the **ALGIONS AI LABS PRIVATE LIMITED Full-Stack Web Development Assessment**.

---

## 🚌 System Overview
An enterprise-grade intercity bus booking and fleet management system engineered with strict PostgreSQL row-level locks, zero double-booking concurrency guarantees, deterministic idempotency, policy-driven simulated refunds, and real-time passenger manifest reconciliation.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (Strict Mode), Tailwind CSS, Radix UI (shadcn/ui compatible), Lucide React.
- **Backend**: Next.js Route Handlers, Application Service Layer, Supabase JavaScript SDK, Zod Schema Validation.
- **Database**: Supabase PostgreSQL, SQL Migrations, `FOR UPDATE` Row-Level Locking, Partial Unique Storage Invariant Indexes, Row Level Security (RLS).
- **Testing**: Vitest 3.2, Integration Concurrency Tests, Policy Unit Tests.

---

## 🎯 Mandatory Acceptance Scenarios Verified

| Acceptance Scenario | Implementation & Verification Status | Test Evidence |
| :--- | :--- | :--- |
| **1. Passenger searches for a valid trip and books an available seat** | **VERIFIED** • Interactive blueprint seat selection with live price calculation and instant PNR issuance. | `tests/integration/booking-concurrency.test.ts` (Scenario 1) |
| **2. Two users cannot confirm the same seat on one trip** | **VERIFIED** • Guaranteed by `FOR UPDATE` row locking in `create_booking_atomic` + storage invariant index `idx_booking_seats_active_trip_seat`. | `tests/integration/booking-concurrency.test.ts` (Scenario 2) |
| **3. PNR contains correct passenger, route, date, and seat information** | **VERIFIED** • Printable digital boarding pass / e-ticket with QR placeholder and verified manifest details. | `tests/integration/booking-concurrency.test.ts` (Scenario 3) |
| **4. Cancellation updates seat availability and simulated refund status** | **VERIFIED** • Tiered lead-time policy (>24h: 90%, 12-24h: 75%, 2-12h: 50%, <2h: 0%) and immediate seat release. | `tests/integration/booking-concurrency.test.ts` (Scenario 5) |
| **5. Operator manifest and occupancy summaries reconcile with confirmed bookings** | **VERIFIED** • Real-time passenger boarding manifest, load factors, gross ticket sales, refund deductions, and net revenue. | `tests/integration/booking-concurrency.test.ts` (Scenario 6) |

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
Configure your Supabase URL and keys (optional for local mock testing; the system has an integrated in-memory fallback database engine):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Running the Development Server
```bash
pnpm dev
# or: node ./node_modules/next/dist/bin/next dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Automated Tests
```bash
# Execute unit and integration concurrency test suite
pnpm test
# or: node ./node_modules/vitest/vitest.mjs run
```

### 6. Production Build
```bash
pnpm build
# or: node ./node_modules/next/dist/bin/next build
```

---

## 🗄️ Database Migrations & Seed Data

SQL migrations and seed files are located in `supabase/`:
- **`supabase/migrations/20260201000000_initial_schema.sql`**: 15 core normalized tables, indexes, and full RLS policies.
- **`supabase/migrations/20260201000001_booking_engine_rpc.sql`**: `create_booking_atomic` and `cancel_booking_atomic` PostgreSQL functions.
- **`supabase/seed.sql`**: Realistic operators (Royal Express, Deccan Highway), sleeper & seater buses, routes (Mumbai-Pune, Bangalore-Hyderabad, Delhi-Jaipur), and future trips.

To apply directly to your Supabase project:
1. Navigate to your Supabase SQL Editor.
2. Run `supabase/migrations/20260201000000_initial_schema.sql`.
3. Run `supabase/migrations/20260201000001_booking_engine_rpc.sql`.
4. Run `supabase/seed.sql`.

---

## 👥 Demo Accounts

The system includes pre-configured demo personas with instant one-click login on `/login`:
- **Passenger**: `passenger@algions.com` (Password: `algions2026`)
- **Operator**: `operator@royalexpress.in` (Password: `algions2026`)
- **Administrator**: `admin@algions.com` (Password: `algions2026`)

---

## 📚 Documentation Links
- [Architecture & Mermaid Diagrams](docs/architecture.md)
- [Database Schema & ERD](docs/database-schema.md)
- [API Documentation](docs/api-documentation.md)
- [Security & RLS Specifications](docs/security.md)
- [Automated Testing Report](docs/testing-report.md)
- [Technical Decisions Log](docs/technical-decisions.md)
- [3–5 Minute Interview Walkthrough Script](docs/interview-walkthrough-script.md)
