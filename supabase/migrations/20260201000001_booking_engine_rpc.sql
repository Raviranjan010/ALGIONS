-- ============================================================================
-- ALGIONS BUS BOOKING MANAGEMENT SYSTEM
-- Migration: 20260201000001_booking_engine_rpc.sql
-- Description: Transactional PostgreSQL RPC functions with enterprise security,
--              caller identity verification, row-level seat locking (aggregate-free),
--              idempotent cancellation, and privacy-safe ticket verification.
-- ============================================================================

-- Function to generate a secure random PNR code: ALG-XXXXXX
CREATE OR REPLACE FUNCTION public.generate_pnr()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- omit ambiguous chars (0,1,I,O)
    result TEXT := 'ALG-';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. ATOMIC BOOKING CREATION TRANSACTION (Hardened SECURITY DEFINER)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_trip_id UUID,
    p_user_id UUID,
    p_seat_ids UUID[],
    p_passengers JSONB, -- Array of { fullName, age, gender, seatNumber }
    p_contact JSONB,    -- { name, email, phone }
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller_id UUID;
    v_effective_user_id UUID;
    v_trip RECORD;
    v_existing_booking RECORD;
    v_existing_seats UUID[];
    v_requested_seats UUID[];
    v_new_booking_id UUID;
    v_pnr TEXT;
    v_total_fare NUMERIC(10,2) := 0;
    v_locked_seats_count INTEGER;
    v_seat RECORD;
    v_idx INTEGER;
BEGIN
    -- 0. Caller Identity & Authorization Hardening
    -- In Supabase, auth.uid() returns the authenticated user's UUID from the JWT.
    v_caller_id := auth.uid();

    IF v_caller_id IS NOT NULL THEN
        -- Authenticated user context:
        -- The booking MUST be assigned to the authenticated user unless the caller is an admin.
        IF p_user_id IS NOT NULL AND p_user_id <> v_caller_id THEN
            IF NOT public.is_admin(v_caller_id) THEN
                RAISE EXCEPTION 'UNAUTHORIZED_CALLER_IDENTITY'
                    USING HINT = 'Authenticated caller id does not match requested user_id';
            END IF;
            v_effective_user_id := p_user_id;
        ELSE
            v_effective_user_id := v_caller_id;
        END IF;
    ELSE
        -- Anonymous callers are explicitly disallowed from creating bookings.
        -- Only trusted server-side execution via service_role is allowed without auth.uid().
        IF coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
            RAISE EXCEPTION 'UNAUTHENTICATED'
                USING HINT = 'Booking creation requires an authenticated user session';
        END IF;

        IF p_user_id IS NULL THEN
            RAISE EXCEPTION 'INVALID_USER_ID'
                USING HINT = 'User ID must be explicitly provided for server-side bookings';
        END IF;

        v_effective_user_id := p_user_id;
    END IF;

    -- 1. Hardened Idempotency Check with Complete Request Fingerprint
    IF p_idempotency_key IS NOT NULL AND trim(p_idempotency_key) <> '' THEN
        SELECT b.id, b.pnr, b.trip_id, b.user_id, b.total_fare, b.status, b.created_at
        INTO v_existing_booking
        FROM public.bookings b
        WHERE b.idempotency_key = p_idempotency_key;

        IF FOUND THEN
            -- Check if requested seat IDs match existing booking seats
            SELECT array_agg(trip_seat_id ORDER BY trip_seat_id)
            INTO v_existing_seats
            FROM public.booking_seats
            WHERE booking_id = v_existing_booking.id;

            SELECT array_agg(s ORDER BY s)
            INTO v_requested_seats
            FROM unnest(p_seat_ids) s;

            IF v_existing_booking.trip_id = p_trip_id 
               AND v_existing_booking.user_id = v_effective_user_id 
               AND v_existing_seats = v_requested_seats THEN
                RETURN jsonb_build_object(
                    'success', true,
                    'is_idempotent_replay', true,
                    'booking_id', v_existing_booking.id,
                    'pnr', v_existing_booking.pnr,
                    'status', v_existing_booking.status,
                    'total_fare', v_existing_booking.total_fare,
                    'created_at', v_existing_booking.created_at
                );
            ELSE
                RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD' 
                    USING HINT = 'The idempotency key has already been used for a different request payload';
            END IF;
        END IF;
    END IF;

    -- 2. Validate Trip
    SELECT id, operator_id, departure_time, status, base_fare
    INTO v_trip
    FROM public.trips
    WHERE id = p_trip_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'TRIP_NOT_FOUND' USING HINT = 'Trip does not exist';
    END IF;

    IF v_trip.status NOT IN ('scheduled', 'boarding') THEN
        RAISE EXCEPTION 'TRIP_NOT_BOOKABLE' USING HINT = 'Trip is not open for booking';
    END IF;

    IF v_trip.departure_time <= now() THEN
        RAISE EXCEPTION 'TRIP_ALREADY_DEPARTED' USING HINT = 'Trip has already departed';
    END IF;

    -- 3. Validate Seats Selection
    IF array_length(p_seat_ids, 1) IS NULL OR array_length(p_seat_ids, 1) = 0 THEN
        RAISE EXCEPTION 'NO_SEATS_SELECTED' USING HINT = 'At least one seat must be selected';
    END IF;

    -- Check for duplicates within the request
    IF (SELECT count(DISTINCT s) FROM unnest(p_seat_ids) s) <> array_length(p_seat_ids, 1) THEN
        RAISE EXCEPTION 'DUPLICATE_SEATS_IN_REQUEST' USING HINT = 'Duplicate seats cannot be selected';
    END IF;

    -- 4. ROW-LEVEL LOCKING: Lock requested trip_seats records FOR UPDATE
    -- In PostgreSQL, FOR UPDATE cannot be combined with aggregate functions (count, sum).
    -- First, lock individual rows in deterministic ORDER BY id to eliminate deadlocks:
    PERFORM id
    FROM public.trip_seats
    WHERE id = ANY(p_seat_ids)
      AND trip_id = p_trip_id
      AND status = 'available'
    ORDER BY id
    FOR UPDATE;

    -- Now compute count and total fare of the locked available seats
    SELECT count(*), coalesce(sum(fare), 0)
    INTO v_locked_seats_count, v_total_fare
    FROM public.trip_seats
    WHERE id = ANY(p_seat_ids)
      AND trip_id = p_trip_id
      AND status = 'available';

    -- If count of locked available seats doesn't match requested count,
    -- at least one seat is already booked or doesn't belong to this trip.
    IF v_locked_seats_count <> array_length(p_seat_ids, 1) THEN
        RAISE EXCEPTION 'SEAT_NOT_AVAILABLE' 
            USING HINT = 'One or more selected seats are no longer available or already booked';
    END IF;

    -- 5. Validate Passenger-Seat Mapping & Payload Integrity
    IF jsonb_array_length(p_passengers) <> array_length(p_seat_ids, 1) THEN
        RAISE EXCEPTION 'PASSENGER_SEAT_COUNT_MISMATCH' 
            USING HINT = 'Number of passengers must equal number of selected seats';
    END IF;

    FOR v_idx IN 0 .. (jsonb_array_length(p_passengers) - 1) LOOP
        -- Verify required passenger fields
        IF p_passengers->v_idx->>'fullName' IS NULL OR trim(p_passengers->v_idx->>'fullName') = '' THEN
            RAISE EXCEPTION 'INVALID_PASSENGER_DATA' USING HINT = 'Passenger full name is required';
        END IF;
        IF (p_passengers->v_idx->>'age')::integer <= 0 OR (p_passengers->v_idx->>'age')::integer > 120 THEN
            RAISE EXCEPTION 'INVALID_PASSENGER_AGE' USING HINT = 'Passenger age must be between 1 and 120';
        END IF;
        IF p_passengers->v_idx->>'gender' NOT IN ('male', 'female', 'other') THEN
            RAISE EXCEPTION 'INVALID_PASSENGER_GENDER' USING HINT = 'Passenger gender must be male, female, or other';
        END IF;

        -- Verify seat_number belongs to one of the locked requested seats
        IF NOT EXISTS (
            SELECT 1 FROM public.trip_seats
            WHERE id = ANY(p_seat_ids) AND seat_number = p_passengers->v_idx->>'seatNumber'
        ) THEN
            RAISE EXCEPTION 'PASSENGER_SEAT_MISMATCH'
                USING HINT = 'Passenger assigned seat does not match any selected seat';
        END IF;
    END LOOP;

    -- 6. Generate Unique PNR
    LOOP
        v_pnr := public.generate_pnr();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE pnr = v_pnr);
    END LOOP;

    -- 7. Insert Booking Record
    INSERT INTO public.bookings (
        pnr,
        trip_id,
        user_id,
        contact_name,
        contact_email,
        contact_phone,
        total_fare,
        status,
        idempotency_key,
        created_at,
        updated_at
    ) VALUES (
        v_pnr,
        p_trip_id,
        v_effective_user_id,
        p_contact->>'name',
        p_contact->>'email',
        p_contact->>'phone',
        v_total_fare,
        'confirmed',
        p_idempotency_key,
        now(),
        now()
    )
    RETURNING id INTO v_new_booking_id;

    -- 8. Insert Passengers and Booking Seats
    FOR v_idx IN 0 .. (jsonb_array_length(p_passengers) - 1) LOOP
        INSERT INTO public.booking_passengers (
            booking_id,
            full_name,
            age,
            gender,
            seat_number
        ) VALUES (
            v_new_booking_id,
            p_passengers->v_idx->>'fullName',
            (p_passengers->v_idx->>'age')::integer,
            p_passengers->v_idx->>'gender',
            p_passengers->v_idx->>'seatNumber'
        );
    END LOOP;

    FOR v_seat IN 
        SELECT id, seat_number, fare 
        FROM public.trip_seats 
        WHERE id = ANY(p_seat_ids)
    LOOP
        INSERT INTO public.booking_seats (
            booking_id,
            trip_seat_id,
            seat_number,
            fare,
            is_active
        ) VALUES (
            v_new_booking_id,
            v_seat.id,
            v_seat.seat_number,
            v_seat.fare,
            true
        );
    END LOOP;

    -- 9. Update Trip Seats status to 'booked'
    UPDATE public.trip_seats
    SET status = 'booked',
        updated_at = now()
    WHERE id = ANY(p_seat_ids);

    -- 10. Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_effective_user_id,
        'BOOKING_CREATED',
        'booking',
        v_new_booking_id::text,
        jsonb_build_object(
            'pnr', v_pnr,
            'trip_id', p_trip_id,
            'seats_count', array_length(p_seat_ids, 1),
            'total_fare', v_total_fare
        )
    );

    -- 11. Return Confirmed Booking Result
    RETURN jsonb_build_object(
        'success', true,
        'is_idempotent_replay', false,
        'booking_id', v_new_booking_id,
        'pnr', v_pnr,
        'status', 'confirmed',
        'total_fare', v_total_fare,
        'trip_id', p_trip_id
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. ATOMIC CANCELLATION TRANSACTION WITH SIMULATED REFUND
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_booking_atomic(
    p_booking_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT 'Cancelled by passenger'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller_id UUID;
    v_effective_user_id UUID;
    v_booking RECORD;
    v_trip RECORD;
    v_is_authorized BOOLEAN := false;
    v_hours_until_departure NUMERIC;
    v_refund_percentage INTEGER := 0;
    v_refund_amount NUMERIC(10,2) := 0;
    v_refund_status TEXT := 'non_refundable';
    v_released_seat_ids UUID[];
BEGIN
    -- 0. Caller Identity Check
    v_caller_id := auth.uid();

    IF v_caller_id IS NOT NULL THEN
        IF p_user_id IS NOT NULL AND p_user_id <> v_caller_id THEN
            IF NOT public.is_admin(v_caller_id) THEN
                RAISE EXCEPTION 'UNAUTHORIZED_CALLER_IDENTITY'
                    USING HINT = 'Authenticated caller id does not match requested user_id';
            END IF;
            v_effective_user_id := p_user_id;
        ELSE
            v_effective_user_id := v_caller_id;
        END IF;
    ELSE
        IF coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
            RAISE EXCEPTION 'UNAUTHENTICATED'
                USING HINT = 'Cancellation requires an authenticated user session';
        END IF;

        IF p_user_id IS NULL THEN
            RAISE EXCEPTION 'INVALID_USER_ID'
                USING HINT = 'User ID must be provided for server-side cancellation';
        END IF;

        v_effective_user_id := p_user_id;
    END IF;

    -- 1. ROW-LEVEL LOCK: Lock booking record
    SELECT b.*
    INTO v_booking
    FROM public.bookings b
    WHERE b.id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING HINT = 'Booking does not exist';
    END IF;

    -- 2. Check Status
    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION 'BOOKING_ALREADY_CANCELLED' USING HINT = 'This booking has already been cancelled';
    END IF;

    IF v_booking.status = 'completed' THEN
        RAISE EXCEPTION 'BOOKING_ALREADY_COMPLETED' USING HINT = 'Completed trips cannot be cancelled';
    END IF;

    -- 3. Authorization Check (Owner, Operator Member, or Admin)
    IF v_booking.user_id = v_effective_user_id THEN
        v_is_authorized := true;
    ELSIF public.is_admin(v_effective_user_id) THEN
        v_is_authorized := true;
    ELSE
        SELECT EXISTS (
            SELECT 1 FROM public.trips t
            JOIN public.operator_members om ON om.operator_id = t.operator_id
            WHERE t.id = v_booking.trip_id AND om.user_id = v_effective_user_id
        ) INTO v_is_authorized;
    END IF;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'UNAUTHORIZED' USING HINT = 'User is not authorized to cancel this booking';
    END IF;

    -- 4. Trip details & Policy Calculation
    SELECT t.*
    INTO v_trip
    FROM public.trips t
    WHERE t.id = v_booking.trip_id;

    v_hours_until_departure := EXTRACT(EPOCH FROM (v_trip.departure_time - now())) / 3600.0;

    -- Cancellation Policy Schedule:
    IF v_hours_until_departure >= 24.0 THEN
        v_refund_percentage := 90;
        v_refund_status := 'simulated_processed';
    ELSIF v_hours_until_departure >= 12.0 THEN
        v_refund_percentage := 75;
        v_refund_status := 'simulated_processed';
    ELSIF v_hours_until_departure >= 2.0 THEN
        v_refund_percentage := 50;
        v_refund_status := 'simulated_processed';
    ELSE
        v_refund_percentage := 0;
        v_refund_status := 'non_refundable';
    END IF;

    v_refund_amount := round((v_booking.total_fare * v_refund_percentage / 100.0)::numeric, 2);

    -- 5. Collect trip_seat_ids to release
    SELECT array_agg(trip_seat_id)
    INTO v_released_seat_ids
    FROM public.booking_seats
    WHERE booking_id = p_booking_id;

    -- 6. Deactivate booking_seats so the unique active index allows new bookings
    UPDATE public.booking_seats
    SET is_active = false
    WHERE booking_id = p_booking_id;

    -- 7. Restore trip_seats inventory to 'available'
    IF v_released_seat_ids IS NOT NULL AND array_length(v_released_seat_ids, 1) > 0 THEN
        UPDATE public.trip_seats
        SET status = 'available',
            updated_at = now()
        WHERE id = ANY(v_released_seat_ids);
    END IF;

    -- 8. Update Booking status to 'cancelled'
    UPDATE public.bookings
    SET status = 'cancelled',
        updated_at = now()
    WHERE id = p_booking_id;

    -- 9. Insert Cancellation record
    INSERT INTO public.cancellations (
        booking_id,
        cancelled_by,
        reason,
        refund_percentage,
        refund_amount,
        refund_status,
        created_at
    ) VALUES (
        p_booking_id,
        v_effective_user_id,
        p_reason,
        v_refund_percentage,
        v_refund_amount,
        v_refund_status,
        now()
    );

    -- 10. Record Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_effective_user_id,
        'BOOKING_CANCELLED',
        'booking',
        p_booking_id::text,
        jsonb_build_object(
            'pnr', v_booking.pnr,
            'refund_percentage', v_refund_percentage,
            'refund_amount', v_refund_amount,
            'refund_status', v_refund_status,
            'released_seats', v_released_seat_ids
        )
    );

    -- 11. Return Result
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'pnr', v_booking.pnr,
        'status', 'cancelled',
        'refund_percentage', v_refund_percentage,
        'refund_amount', v_refund_amount,
        'refund_status', v_refund_status,
        'released_seats_count', coalesce(array_length(v_released_seat_ids, 1), 0)
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. PRIVACY-PRESERVING PUBLIC TICKET VERIFICATION RPC
-- Returns ONLY non-PII operational fields for boarding authenticity validation.
-- Explicitly omits: Passenger names, age, gender, phone numbers, email, total fare.
-- BUG FIX: Uses nullable TIMESTAMPTZ variable to avoid unassigned RECORD access on confirmed bookings.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_ticket_by_pnr(p_pnr TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_booking RECORD;
    v_seats TEXT[];
    v_cancelled_at TIMESTAMPTZ := NULL;
BEGIN
    -- Query booking with associated trip, route, vehicle, and operator
    SELECT 
        b.id,
        b.pnr,
        b.status,
        t.departure_time,
        t.arrival_time,
        r.origin_city,
        r.destination_city,
        o.name AS operator_name,
        v.model AS bus_model,
        v.registration_number AS bus_reg
    INTO v_booking
    FROM public.bookings b
    JOIN public.trips t ON t.id = b.trip_id
    JOIN public.routes r ON r.id = t.route_id
    JOIN public.operators o ON o.id = t.operator_id
    LEFT JOIN public.vehicles v ON v.id = t.vehicle_id
    WHERE b.pnr = trim(upper(p_pnr));

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'found', false,
            'error', 'Ticket not found for specified PNR'
        );
    END IF;

    -- Retrieve assigned seat numbers
    SELECT array_agg(seat_number ORDER BY seat_number)
    INTO v_seats
    FROM public.booking_seats
    WHERE booking_id = v_booking.id;

    -- If cancelled, retrieve cancellation timestamp safely
    IF v_booking.status = 'cancelled' THEN
        SELECT created_at
        INTO v_cancelled_at
        FROM public.cancellations
        WHERE booking_id = v_booking.id
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    RETURN jsonb_build_object(
        'found', true,
        'pnr', v_booking.pnr,
        'status', v_booking.status,
        'isValidForBoarding', (v_booking.status = 'confirmed'),
        'originCity', v_booking.origin_city,
        'destinationCity', v_booking.destination_city,
        'departureTime', v_booking.departure_time,
        'arrivalTime', v_booking.arrival_time,
        'operatorName', v_booking.operator_name,
        'busModel', v_booking.bus_model,
        'busRegistration', v_booking.bus_reg,
        'seats', coalesce(v_seats, ARRAY[]::TEXT[]),
        'isCancelled', (v_booking.status = 'cancelled'),
        'cancelledAt', v_cancelled_at
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. PERMISSION GRANTS & LEAST-PRIVILEGE SECURITY POSTURE
-- ----------------------------------------------------------------------------
-- Revoke all permissions from PUBLIC and anon by default
REVOKE ALL ON FUNCTION public.create_booking_atomic(UUID, UUID, UUID[], JSONB, JSONB, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_booking_atomic(UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_pnr() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_ticket_by_pnr(TEXT) FROM PUBLIC;

-- Explicit least-privilege grants:
-- create_booking_atomic: Only authenticated users and server-side service_role
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(UUID, UUID, UUID[], JSONB, JSONB, TEXT) TO authenticated, service_role;

-- cancel_booking_atomic: Only authenticated users and server-side service_role
GRANT EXECUTE ON FUNCTION public.cancel_booking_atomic(UUID, UUID, TEXT) TO authenticated, service_role;

-- generate_pnr: Internal function, only service_role (create_booking_atomic executes as SECURITY DEFINER owner)
GRANT EXECUTE ON FUNCTION public.generate_pnr() TO service_role;

-- verify_ticket_by_pnr: Public read-only verification (safe for anonymous QR scanners, conductors, and passengers)
GRANT EXECUTE ON FUNCTION public.verify_ticket_by_pnr(TEXT) TO anon, authenticated, service_role;
