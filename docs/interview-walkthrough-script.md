# ALGIONS Technical Interview — 3 to 5 Minute System Walkthrough Script

Use this script during your technical interview to demonstrate the system clearly and professionally.

---

## 0:00 - 0:45 | Introduction & Architectural Overview
> "Good morning/afternoon! Today I am presenting the **ALGIONS Full-Stack Bus Booking Management System**, engineered as a high-performance modular monolith with Next.js 15, TypeScript, Tailwind CSS, and Supabase PostgreSQL.
>
> The system addresses the core challenge of intercity passenger booking: guaranteeing **absolute seat uniqueness under high concurrency**, eliminating double-bookings, ensuring **idempotent retries**, and reconciling **fleet occupancy and dispatch manifests in real-time**."

---

## 0:45 - 1:45 | Public Search & Interactive Seat Booking Flow
> "Let's begin with the passenger experience:
> 1. On the landing page, we see popular routes and a search form. If I search for **Mumbai to Pune**, the system queries scheduled departures and displays matching services like the **Royal Express Volvo Multi-Axle AC Sleeper**.
> 2. Clicking **Select Seats** takes us to the interactive seat blueprint. Here, we can visualize the lower and upper deck sleeper berths. As I select seats, the real-time fare calculator updates automatically.
> 3. I fill in the passenger names and contact details, and click **Confirm Booking**.
> 4. Under the hood, this invokes our transactional PostgreSQL function `create_booking_atomic` with `FOR UPDATE` row-level locks on the selected seat inventory. Within milliseconds, we receive our confirmed ticket with a unique PNR code like **`ALG-XXXXXX`**."

---

## 1:45 - 2:45 | Concurrency & Anti-Double Booking Invariant
> "The defining architectural strength of this platform is our **double-booking protection**:
> - We never trust the client to guarantee seat availability.
> - When two users simultaneously attempt to book the exact same seat, our PostgreSQL transaction uses row-level locking so that only the first committer acquires the lock; the competing request is rejected with a 409 Conflict.
> - Furthermore, at the database storage engine level, we have a partial unique index:
>   `CREATE UNIQUE INDEX idx_booking_seats_active_trip_seat ON booking_seats(trip_seat_id) WHERE (is_active = true)`.
>   This guarantees that mathematically, two active bookings can never own the same seat.
> - We verified this with Vitest integration concurrency tests where parallel promises competed for the same seat, and exactly one succeeded while the other received `SEAT_NOT_AVAILABLE`."

---

## 2:45 - 3:45 | Cancellation Policy & Seat Restoration
> "Now let's view ticket cancellation:
> - If a passenger needs to cancel, our `cancel_booking_atomic` transaction checks the time remaining until departure.
> - If more than 24 hours remain, it automatically computes a **90% simulated refund** (10% cancellation charge).
> - The booking is marked as `cancelled`, and the seat status is immediately returned to `available`.
> - Another user can instantly book that newly released seat without delay."

---

## 3:45 - 4:45 | Operator Portal, Dispatch Manifests & Occupancy Reconciliation
> "Lastly, let's navigate to the **Operator Portal**:
> 1. In **Passenger Manifests**, dispatchers select any scheduled departure and see the complete verified passenger list with emergency contacts and seat allocations.
> 2. In **Occupancy Reports**, operators get trip-by-trip analytics showing load factor, gross ticket sales, refund deductions, and net retained operational earnings. Every single rupee reconciles with confirmed tickets in the database.
> 3. Operators can also manage fleet vehicles, seat layouts, routes, and schedule new departures."

---

## 4:45 - 5:00 | Conclusion & Q&A
> "In summary, the platform delivers all five mandatory acceptance scenarios with zero double-booking risk, full automated test coverage, strict type safety, and production build readiness. I'm now excited to dive into any specific code or SQL implementation questions you may have!"
