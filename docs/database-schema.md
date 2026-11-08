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
- **Security**: `SECURITY DEFINER`
- **Parameters**: `p_trip_id UUID, p_user_id UUID, p_seat_ids UUID[], p_passengers JSONB, p_contact JSONB, p_idempotency_key TEXT`
- **Execution Flow**:
  1. Checks idempotency: if key exists and payload matches, replays previous booking; if payload differs, raises error.
  2. Validates trip status (`scheduled` / `boarding`) and departure time > `now()`.
  3. Validates seat selections (rejects duplicates within request).
  4. Locks `trip_seats` using `SELECT ... WHERE id = ANY(p_seat_ids) AND trip_id = p_trip_id AND status = 'available' FOR UPDATE`.
  5. Verifies locked seats count matches requested count; throws `SEAT_NOT_AVAILABLE` if conflict.
  6. Generates unique PNR (`ALG-XXXXXX`).
  7. Inserts `bookings`, `booking_passengers`, and `booking_seats` (with `is_active = true`).
  8. Updates `trip_seats` status to `booked`.
  9. Inserts `audit_logs` record.
  10. Returns confirmed booking record.

### 3.2 `cancel_booking_atomic`
- **Security**: `SECURITY DEFINER`
- **Parameters**: `p_booking_id UUID, p_user_id UUID, p_reason TEXT`
- **Execution Flow**:
  1. Acquires row lock on booking record `FOR UPDATE`.
  2. Verifies ownership (passenger owns ticket or user is operator/admin).
  3. Verifies status is `confirmed`.
  4. Calculates hours until departure and applies tiered refund policy (>24h: 90%, 12-24h: 75%, 2-12h: 50%, <2h: 0%).
  5. Updates `booking_seats` setting `is_active = false`.
  6. Updates `trip_seats` setting `status = 'available'`.
  7. Updates `bookings` status to `cancelled`.
  8. Inserts `cancellations` record.
  9. Inserts `audit_logs` record.
  10. Returns cancellation details.

