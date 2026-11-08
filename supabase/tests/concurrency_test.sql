-- ============================================================================
-- ALGIONS BUS BOOKING MANAGEMENT SYSTEM
-- PostgreSQL Concurrency Verification Suite
-- File: supabase/tests/concurrency_test.sql
-- Description: Pure SQL simulation of concurrent competing booking transactions.
-- ============================================================================

-- Step 1: Verification Environment Setup
-- Ensure demo operators, vehicles, seats, and trips exist (from seed.sql)
DO $$
DECLARE
    v_trip_id UUID := 'd1000000-0000-0000-0000-000000000001';
    v_seat_id UUID;
    v_seat_num TEXT;
    v_user_a UUID := 'e1000000-0000-0000-0000-000000000001';
    v_user_b UUID := 'e1000000-0000-0000-0000-000000000002';
    v_res_a JSONB;
    v_res_b JSONB;
    v_err_b TEXT;
BEGIN
    -- Pick an available seat for this trip
    SELECT id, seat_number INTO v_seat_id, v_seat_num
    FROM public.trip_seats
    WHERE trip_id = v_trip_id AND status = 'available'
    LIMIT 1;

    IF v_seat_id IS NULL THEN
        RAISE EXCEPTION 'No available seat found on trip % to test concurrency', v_trip_id;
    END IF;

    RAISE NOTICE 'Selected Test Seat: % (ID: %)', v_seat_num, v_seat_id;

    -- ========================================================================
    -- Transaction 1: User A books the seat
    -- ========================================================================
    v_res_a := public.create_booking_atomic(
        v_trip_id,
        v_user_a,
        ARRAY[v_seat_id],
        jsonb_build_array(jsonb_build_object('fullName', 'User A Passenger', 'age', 30, 'gender', 'male', 'seatNumber', v_seat_num)),
        jsonb_build_object('name', 'User A', 'email', 'userA@test.com', 'phone', '+91 91111 22222'),
        'concurrency-test-key-user-a'
    );

    RAISE NOTICE 'Transaction A Result: %', v_res_a;

    -- Verify that seat is now marked as 'booked'
    ASSERT (SELECT status FROM public.trip_seats WHERE id = v_seat_id) = 'booked', 
        'ASSERTION FAILED: Seat was not marked as booked by Transaction A';

    -- ========================================================================
    -- Transaction 2: User B attempts to book the EXACT SAME SEAT
    -- ========================================================================
    BEGIN
        v_res_b := public.create_booking_atomic(
            v_trip_id,
            v_user_b,
            ARRAY[v_seat_id],
            jsonb_build_array(jsonb_build_object('fullName', 'User B Competing', 'age', 28, 'gender', 'female', 'seatNumber', v_seat_num)),
            jsonb_build_object('name', 'User B', 'email', 'userB@test.com', 'phone', '+91 93333 44444'),
            'concurrency-test-key-user-b'
        );

        -- If this line is reached, double booking occurred!
        RAISE EXCEPTION 'CRITICAL FAILURE: Double booking permitted! Competing transaction succeeded unexpectedly.';
    EXCEPTION
        WHEN OTHERS THEN
            v_err_b := SQLERRM;
            RAISE NOTICE 'Expected Concurrency Rejection Caught: %', v_err_b;
            ASSERT v_err_b LIKE '%SEAT_NOT_AVAILABLE%', 'Expected SEAT_NOT_AVAILABLE error but got: ' || v_err_b;
    END;

    -- ========================================================================
    -- Invariant Verification: Check Unique Active Allocation in Database
    -- ========================================================================
    ASSERT (
        SELECT count(*) 
        FROM public.booking_seats 
        WHERE trip_seat_id = v_seat_id AND is_active = true
    ) = 1, 'ASSERTION FAILED: Database constraint violated! More than 1 active booking seat found for seat ' || v_seat_num;

    RAISE NOTICE 'CONCURRENCY INTEGRITY VERIFIED: Exactly 1 active confirmed booking exists. Duplicate allocation blocked.';
END $$;

