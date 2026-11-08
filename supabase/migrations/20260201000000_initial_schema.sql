-- ============================================================================
-- ALGIONS BUS BOOKING MANAGEMENT SYSTEM
-- Migration: 20260201000000_initial_schema.sql
-- Description: Core tables, constraints, indexes, and Row Level Security (RLS)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'passenger' CHECK (role IN ('passenger', 'operator', 'admin')),
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ----------------------------------------------------------------------------
-- 2. OPERATORS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operators_code ON public.operators(code);
CREATE INDEX IF NOT EXISTS idx_operators_active ON public.operators(is_active);

-- ----------------------------------------------------------------------------
-- 3. OPERATOR MEMBERS (Staff & Role-based membership)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operator_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'dispatcher', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(operator_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_operator_members_user ON public.operator_members(user_id);
CREATE INDEX IF NOT EXISTS idx_operator_members_operator ON public.operator_members(operator_id);

-- ----------------------------------------------------------------------------
-- 4. VEHICLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    registration_number TEXT NOT NULL,
    model TEXT NOT NULL,
    total_capacity INTEGER NOT NULL CHECK (total_capacity > 0),
    layout_type TEXT NOT NULL CHECK (layout_type IN ('2x2', '2x1', 'sleeper_2x1', 'executive_2x2')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(operator_id, registration_number)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_operator ON public.vehicles(operator_id);

-- ----------------------------------------------------------------------------
-- 5. VEHICLE SEATS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    deck TEXT NOT NULL DEFAULT 'lower' CHECK (deck IN ('lower', 'upper')),
    seat_row INTEGER NOT NULL CHECK (seat_row >= 1),
    seat_column INTEGER NOT NULL CHECK (seat_column >= 1),
    seat_type TEXT NOT NULL CHECK (seat_type IN ('window', 'aisle', 'middle', 'sleeper')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(vehicle_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_seats_vehicle ON public.vehicle_seats(vehicle_id);

-- ----------------------------------------------------------------------------
-- 6. ROUTES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    route_number TEXT NOT NULL,
    origin_city TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    distance_km NUMERIC(8,2) NOT NULL CHECK (distance_km > 0),
    estimated_duration_mins INTEGER NOT NULL CHECK (estimated_duration_mins > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(operator_id, route_number)
);

CREATE INDEX IF NOT EXISTS idx_routes_cities ON public.routes(origin_city, destination_city);
CREATE INDEX IF NOT EXISTS idx_routes_operator ON public.routes(operator_id);

-- ----------------------------------------------------------------------------
-- 7. ROUTE STOPS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    stop_name TEXT NOT NULL,
    city TEXT NOT NULL,
    stop_order INTEGER NOT NULL CHECK (stop_order >= 1),
    duration_from_origin_mins INTEGER NOT NULL DEFAULT 0 CHECK (duration_from_origin_mins >= 0),
    distance_from_origin_km NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (distance_from_origin_km >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(route_id, stop_order)
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route ON public.route_stops(route_id);

-- ----------------------------------------------------------------------------
-- 8. TRIPS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    trip_code TEXT UNIQUE NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    base_fare NUMERIC(10,2) NOT NULL CHECK (base_fare >= 0),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'in_transit', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (arrival_time > departure_time)
);

CREATE INDEX IF NOT EXISTS idx_trips_search ON public.trips(route_id, departure_time, status);
CREATE INDEX IF NOT EXISTS idx_trips_operator ON public.trips(operator_id);

-- ----------------------------------------------------------------------------
-- 9. TRIP STOPS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    stop_name TEXT NOT NULL,
    city TEXT NOT NULL,
    stop_order INTEGER NOT NULL CHECK (stop_order >= 1),
    scheduled_departure TIMESTAMPTZ,
    scheduled_arrival TIMESTAMPTZ,
    fare_from_origin NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(trip_id, stop_order)
);

CREATE INDEX IF NOT EXISTS idx_trip_stops_trip ON public.trip_stops(trip_id);

-- ----------------------------------------------------------------------------
-- 10. TRIP SEATS (Trip-level seat inventory)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    vehicle_seat_id UUID NOT NULL REFERENCES public.vehicle_seats(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    seat_type TEXT NOT NULL CHECK (seat_type IN ('window', 'aisle', 'middle', 'sleeper')),
    fare NUMERIC(10,2) NOT NULL CHECK (fare >= 0),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'booked', 'blocked')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(trip_id, seat_number),
    UNIQUE(trip_id, vehicle_seat_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_seats_status ON public.trip_seats(trip_id, status);

-- ----------------------------------------------------------------------------
-- 11. BOOKINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pnr TEXT UNIQUE NOT NULL,
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    total_fare NUMERIC(10,2) NOT NULL CHECK (total_fare >= 0),
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON public.bookings(pnr);
CREATE INDEX IF NOT EXISTS idx_bookings_idempotency ON public.bookings(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 12. BOOKING PASSENGERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age <= 120),
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    seat_number TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(booking_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking ON public.booking_passengers(booking_id);

-- ----------------------------------------------------------------------------
-- 13. BOOKING SEATS (Link booking to specific trip_seats)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    trip_seat_id UUID NOT NULL REFERENCES public.trip_seats(id) ON DELETE RESTRICT,
    seat_number TEXT NOT NULL,
    fare NUMERIC(10,2) NOT NULL CHECK (fare >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(booking_id, trip_seat_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_seats_booking ON public.booking_seats(booking_id);

-- INVARIANT: A trip seat cannot be linked to multiple ACTIVE bookings!
-- This guarantees database-level double-booking prevention.
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_seats_active_trip_seat 
ON public.booking_seats(trip_seat_id) 
WHERE (is_active = true);

-- ----------------------------------------------------------------------------
-- 14. CANCELLATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
    cancelled_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    refund_percentage INTEGER NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
    refund_amount NUMERIC(10,2) NOT NULL CHECK (refund_amount >= 0),
    refund_status TEXT NOT NULL DEFAULT 'simulated_processed' CHECK (refund_status IN ('simulated_processed', 'simulated_pending', 'non_refundable')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cancellations_booking ON public.cancellations(booking_id);

-- ----------------------------------------------------------------------------
-- 15. AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ----------------------------------------------------------------------------
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_uid AND role = 'admin'
  );
$$;

-- Helper function to check operator member
CREATE OR REPLACE FUNCTION public.is_operator_member(user_uid UUID, op_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.operator_members 
    WHERE user_id = user_uid AND operator_id = op_id
  );
$$;

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by owner or admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- OPERATORS POLICIES
CREATE POLICY "Active operators are publicly readable"
    ON public.operators FOR SELECT
    USING (is_active = true OR public.is_operator_member(auth.uid(), id) OR public.is_admin(auth.uid()));

CREATE POLICY "Operators manageable by operator owners/admins"
    ON public.operators FOR ALL
    USING (public.is_operator_member(auth.uid(), id) OR public.is_admin(auth.uid()));

-- OPERATOR MEMBERS POLICIES
CREATE POLICY "Operator members readable by team or admin"
    ON public.operator_members FOR SELECT
    USING (user_id = auth.uid() OR public.is_operator_member(auth.uid(), operator_id) OR public.is_admin(auth.uid()));

-- VEHICLES & SEATS POLICIES
CREATE POLICY "Vehicles viewable publicly"
    ON public.vehicles FOR SELECT
    USING (is_active = true OR public.is_operator_member(auth.uid(), operator_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Vehicles manageable by operator staff"
    ON public.vehicles FOR ALL
    USING (public.is_operator_member(auth.uid(), operator_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Vehicle seats viewable publicly"
    ON public.vehicle_seats FOR SELECT
    USING (true);

-- ROUTES & STOPS POLICIES
CREATE POLICY "Routes publicly readable"
    ON public.routes FOR SELECT
    USING (is_active = true OR public.is_operator_member(auth.uid(), operator_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Routes manageable by operator staff"
    ON public.routes FOR ALL
    USING (public.is_operator_member(auth.uid(), operator_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Route stops publicly readable"
    ON public.route_stops FOR SELECT
    USING (true);

-- TRIPS & SEATS POLICIES
CREATE POLICY "Trips publicly readable"
    ON public.trips FOR SELECT
    USING (status != 'cancelled' OR public.is_operator_member(auth.uid(), operator_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Trips manageable by operator staff"
    ON public.trips FOR ALL
    USING (public.is_operator_member(auth.uid(), operator_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Trip stops publicly readable"
    ON public.trip_stops FOR SELECT
    USING (true);

CREATE POLICY "Trip seats publicly readable"
    ON public.trip_seats FOR SELECT
    USING (true);

-- BOOKINGS POLICIES
CREATE POLICY "Passengers can view own bookings"
    ON public.bookings FOR SELECT
    USING (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.trips t 
            WHERE t.id = bookings.trip_id 
            AND public.is_operator_member(auth.uid(), t.operator_id)
        )
        OR public.is_admin(auth.uid())
    );

CREATE POLICY "Booking passengers viewable by owner or operator"
    ON public.booking_passengers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = booking_passengers.booking_id 
            AND (b.user_id = auth.uid() OR public.is_admin(auth.uid()))
        )
        OR EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.trips t ON t.id = b.trip_id
            WHERE b.id = booking_passengers.booking_id
            AND public.is_operator_member(auth.uid(), t.operator_id)
        )
    );

-- CANCELLATIONS POLICIES
CREATE POLICY "Cancellations viewable by owner or operator"
    ON public.cancellations FOR SELECT
    USING (
        cancelled_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = cancellations.booking_id AND b.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.trips t ON t.id = b.trip_id
            WHERE b.id = cancellations.booking_id
            AND public.is_operator_member(auth.uid(), t.operator_id)
        )
        OR public.is_admin(auth.uid())
    );

-- AUDIT LOGS POLICIES
CREATE POLICY "Audit logs readable by admin or operator staff"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 17. PROFILE CREATION TRIGGER ON AUTH.SIGNUP
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'passenger'),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

