# Database Schema Documentation

## 1. Architectural Invariants
The database schema is designed for PostgreSQL on Supabase, enforcing:
- Strict UUID primary keys.
- Foreign keys with referential integrity (`ON DELETE CASCADE` or `ON DELETE RESTRICT`).
- High-concurrency row locking support via transactional RPC functions.
- Partial unique indexes that guarantee that a single trip seat cannot belong to more than one active booking:
  ```sql
  CREATE UNIQUE INDEX idx_booking_seats_active_trip_seat 
  ON public.booking_seats(trip_seat_id) 
  WHERE (is_active = true);
  ```

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    PROFILES ||--o{ BOOKINGS : places
    PROFILES ||--o{ OPERATOR_MEMBERS : belongs_to
    OPERATORS ||--|{ OPERATOR_MEMBERS : employs
    OPERATORS ||--|{ VEHICLES : owns
    OPERATORS ||--|{ ROUTES : operates
    OPERATORS ||--|{ TRIPS : schedules
    VEHICLES ||--|{ VEHICLE_SEATS : contains
    VEHICLES ||--o{ TRIPS : assigned_to
    ROUTES ||--|{ ROUTE_STOPS : contains
    ROUTES ||--|{ TRIPS : has
    TRIPS ||--|{ TRIP_SEATS : inventory
    TRIPS ||--o{ BOOKINGS : has
    TRIPS ||--|{ TRIP_STOPS : stops
    BOOKINGS ||--|{ BOOKING_PASSENGERS : includes
    BOOKINGS ||--|{ BOOKING_SEATS : reserves
    TRIP_SEATS ||--o{ BOOKING_SEATS : allocated_to
    BOOKINGS ||--o| CANCELLATIONS : cancels
    PROFILES ||--o{ AUDIT_LOGS : triggers

    PROFILES {
        uuid id PK
        text email
        text full_name
        text role
        text phone
        timestamptz created_at
        timestamptz updated_at
    }

    OPERATORS {
        uuid id PK
        text name
        text slug
        text code
        text contact_email
        text contact_phone
        boolean is_active
        timestamptz created_at
    }

    VEHICLES {
        uuid id PK
        uuid operator_id FK
        text registration_number
        text model
        integer total_capacity
        text layout_type
        boolean is_active
    }

    VEHICLE_SEATS {
        uuid id PK
        uuid vehicle_id FK
        text seat_number
        text deck
        integer seat_row
        integer seat_column
        text seat_type
        boolean is_active
    }

    ROUTES {
        uuid id PK
        uuid operator_id FK
        text route_number
        text origin_city
        text destination_city
        numeric distance_km
        integer estimated_duration_mins
        boolean is_active
    }

    TRIPS {
        uuid id PK
        uuid operator_id FK
        uuid route_id FK
        uuid vehicle_id FK
        text trip_code
        timestamptz departure_time
        timestamptz arrival_time
        numeric base_fare
        text status
    }

    TRIP_SEATS {
        uuid id PK
        uuid trip_id FK
        uuid vehicle_seat_id FK
        text seat_number
        text seat_type
        numeric fare
        text status
    }

    BOOKINGS {
        uuid id PK
        text pnr
        uuid trip_id FK
        uuid user_id FK
        text contact_name
        text contact_email
        text contact_phone
        numeric total_fare
        text status
        text idempotency_key
        timestamptz created_at
    }

    BOOKING_PASSENGERS {
        uuid id PK
        uuid booking_id FK
        text full_name
        integer age
        text gender
        text seat_number
    }

    BOOKING_SEATS {
        uuid id PK
        uuid booking_id FK
        uuid trip_seat_id FK
        text seat_number
        numeric fare
        boolean is_active
    }

    CANCELLATIONS {
        uuid id PK
        uuid booking_id FK
        uuid cancelled_by FK
        text reason
        integer refund_percentage
        numeric refund_amount
        text refund_status
        timestamptz created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        text action
        text entity_type
        text entity_id
        jsonb details
        timestamptz created_at
    }
```

---

## 3. Database Functions & Triggers

### 3.1 `create_booking_atomic`
- **Security**: `SECURITY DEFINER`, `SET search_path = pg_catalog, public`
- **Permissions**: `REVOKE ALL FROM PUBLIC, anon; GRANT EXECUTE TO authenticated, service_role;`
- **Parameters**: `p_trip_id UUID, p_user_id UUID, p_seat_ids UUID[], p_passengers JSONB, p_contact JSONB, p_idempotency_key TEXT`
- **Execution Flow**:
  1. Enforces caller identity: verifies `auth.uid() = p_user_id` or caller is admin; blocks anonymous callers with `UNAUTHENTICATED`.
  2. Checks idempotency: if key exists and payload matches, replays previous booking; if payload differs, raises error.
  3. Validates trip status (`scheduled` / `boarding`) and departure time > `now()`.
  4. Validates seat selections (rejects duplicates within request).
  5. **Deterministic Row-Level Lock**: Executes `PERFORM id FROM public.trip_seats WHERE id = ANY(p_seat_ids) AND trip_id = p_trip_id AND status = 'available' ORDER BY id FOR UPDATE` to avoid PostgreSQL aggregate `FOR UPDATE` restrictions and prevent deadlocks.
  6. Calculates count and fare from locked tuples; verifies count matches requested count; throws `SEAT_NOT_AVAILABLE` on conflict.
  7. Generates unique PNR (`ALG-XXXXXX`).
  8. Inserts `bookings`, `booking_passengers`, and `booking_seats` (with `is_active = true`).
  9. Updates `trip_seats` status to `booked`.
  10. Inserts `audit_logs` record.
  11. Returns confirmed booking record.

### 3.2 `cancel_booking_atomic`
- **Security**: `SECURITY DEFINER`, `SET search_path = pg_catalog, public`
- **Permissions**: `REVOKE ALL FROM PUBLIC, anon; GRANT EXECUTE TO authenticated, service_role;`
- **Parameters**: `p_booking_id UUID, p_user_id UUID, p_reason TEXT`
- **Execution Flow**:
  1. Enforces caller identity check.
  2. Acquires row lock on booking record `FOR UPDATE`.
  3. Verifies ownership (passenger owns ticket or user is operator/admin).
  4. Verifies status is `confirmed`.
  5. Calculates hours until departure and applies tiered refund policy (>24h: 90%, 12-24h: 75%, 2-12h: 50%, <2h: 0%).
  6. Updates `booking_seats` setting `is_active = false`.
  7. Updates `trip_seats` setting `status = 'available'`.
  8. Updates `bookings` status to `cancelled`.
  9. Inserts `cancellations` record.
  10. Inserts `audit_logs` record.
  11. Returns cancellation details.

### 3.3 `verify_ticket_by_pnr`
- **Security**: `SECURITY DEFINER`, `SET search_path = pg_catalog, public`, `STABLE`
- **Permissions**: `GRANT EXECUTE TO anon, authenticated, service_role;`
- **Parameters**: `p_pnr TEXT`
- **Execution Flow**:
  1. Queries booking, trip, route, operator, vehicle, and active assigned seat numbers for the given PNR.
  2. Formats sanitized operational boarding metadata (`found`, `pnr`, `status`, `isValidForBoarding`, `originCity`, `destinationCity`, `departureTime`, `arrivalTime`, `operatorName`, `busModel`, `seats`, `isCancelled`).
  3. Omits all passenger PII, contact info, and pricing to protect user privacy during public QR verification.


