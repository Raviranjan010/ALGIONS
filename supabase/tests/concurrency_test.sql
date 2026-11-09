-- ============================================================================
-- ALGIONS BUS BOOKING MANAGEMENT SYSTEM
-- PostgreSQL Concurrency Verification Suite & Multi-Session Test Harness
-- File: supabase/tests/concurrency_test.sql
-- Description: Interactive and automated tests proving that concurrent database
--              sessions competing for the same seat lock correctly, queue,
--              and reject double-bookings at the row-lock and storage levels.
--              Also validates fix for ISSUE-01 (v_cancellation unassigned record bug).
-- ============================================================================

-- ============================================================================
-- SECTION A: TWO-TERMINAL INTERACTIVE REPRODUCTION HARNESS
-- To observe PostgreSQL lock queuing in real time between 2 independent sessions:
-- ============================================================================
/*
  TERMINAL 1 (Session A - Passenger in Mumbai):
  ---------------------------------------------
  psql -d postgres -U postgres

  -- 1. Begin explicit transaction and acquire exclusive row lock on seat
  BEGIN;
  
  -- Step 1.1: Lock the seat row (deterministic ORDER BY id FOR UPDATE)
  PERFORM id FROM public.trip_seats
  WHERE id = 's1000000-0000-0000-0000-000000000001' AND status = 'available'
  ORDER BY id
  FOR UPDATE;
  
  -- Session A now holds ExclusiveLock on tuple (trip_seats row).
  -- Keep this transaction OPEN without committing yet!

  ---------------------------------------------
  TERMINAL 2 (Session B - Competing Passenger in Pune):
  ---------------------------------------------
  psql -d postgres -U postgres

  -- 2. Attempt to lock the EXACT SAME seat simultaneously
  BEGIN;

  PERFORM id FROM public.trip_seats
  WHERE id = 's1000000-0000-0000-0000-000000000001' AND status = 'available'
  ORDER BY id
  FOR UPDATE;

  -- OBSERVE: Terminal 2 HANGS / BLOCKS!
  -- In PostgreSQL pg_stat_activity:
  --   SELECT pid, wait_event_type, wait_event, state, query
  --   FROM pg_stat_activity WHERE wait_event_type = 'Lock';
  -- Session B's state shows wait_event_type = 'Lock', wait_event = 'tuple'.

  ---------------------------------------------
  BACK TO TERMINAL 1 (Session A):
  ---------------------------------------------
  -- Step 1.2: Complete booking and commit
  UPDATE public.trip_seats 
  SET status = 'booked', updated_at = now()
  WHERE id = 's1000000-0000-0000-0000-000000000001';

  COMMIT;
  -- The commit releases the ExclusiveLock on the seat tuple.

  ---------------------------------------------
  OBSERVE TERMINAL 2 (Session B):
  ---------------------------------------------
  -- Terminal 2 immediately unblocks!
  -- PostgreSQL re-evaluates the query condition (status = 'available') on the
  -- updated tuple. Since Session A set status = 'booked', the query returns 0 rows!
  -- The booking function catches count <> 1 and raises SEAT_NOT_AVAILABLE.
  ROLLBACK;
*/

-- ============================================================================
-- SECTION B: AUTOMATED DATABASE VERIFICATION SCRIPT
-- Executes transactional RPC validations and asserts partial unique index invariants.
-- ============================================================================

DO $$
DECLARE
    v_trip_id UUID := 'd1000000-0000-0000-0000-000000000001';
    v_seat_id UUID;
    v_seat_num TEXT;
    v_user_a UUID := 'e1000000-0000-0000-0000-000000000001';
    v_user_b UUID := 'e1000000-0000-0000-0000-000000000002';
    v_res_a JSONB;
    v_res_b JSONB;
    v_res_replay JSONB;
    v_err_b TEXT;
    v_err_conflict TEXT;
    v_active_seats_count INTEGER;
    v_verify_res JSONB;
    v_cancel_res JSONB;
    v_verify_cancel_res JSONB;
    v_idem_key TEXT := 'concurrency-test-key-' || extract(epoch from now())::text;
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'ALGIONS CONCURRENCY & INTEGRITY VERIFICATION STARTED';
    RAISE NOTICE '=======================================================';

    -- 1. Identify an available seat on the seed trip
    SELECT id, seat_number INTO v_seat_id, v_seat_num
    FROM public.trip_seats
    WHERE trip_id = v_trip_id AND status = 'available'
    ORDER BY seat_number ASC
    LIMIT 1;

    IF v_seat_id IS NULL THEN
        RAISE EXCEPTION 'No available seat found on trip % to test concurrency', v_trip_id;
    END IF;

    RAISE NOTICE 'Selected Test Target Seat: % (ID: %)', v_seat_num, v_seat_id;

    -- ========================================================================
    -- Transaction 1: User A books the seat via create_booking_atomic
    -- ========================================================================
    v_res_a := public.create_booking_atomic(
        v_trip_id,
        v_user_a,
        ARRAY[v_seat_id],
        jsonb_build_array(jsonb_build_object('fullName', 'User A Passenger', 'age', 30, 'gender', 'male', 'seatNumber', v_seat_num)),
        jsonb_build_object('name', 'User A', 'email', 'userA@test.com', 'phone', '+91 91111 22222'),
        v_idem_key
    );

    RAISE NOTICE 'Transaction A Succeeded: Booking ID %, PNR %', v_res_a->>'booking_id', v_res_a->>'pnr';

    -- Verify seat status in trip_seats table
    ASSERT (SELECT status FROM public.trip_seats WHERE id = v_seat_id) = 'booked', 
        'ASSERTION FAILED: Seat was not updated to booked status';

    -- ========================================================================
    -- Transaction 2: User B attempts to book the EXACT SAME SEAT (Double-Booking Blocked)
    -- ========================================================================
    BEGIN
        v_res_b := public.create_booking_atomic(
            v_trip_id,
            v_user_b,
            ARRAY[v_seat_id],
            jsonb_build_array(jsonb_build_object('fullName', 'User B Competing', 'age', 28, 'gender', 'female', 'seatNumber', v_seat_num)),
            jsonb_build_object('name', 'User B', 'email', 'userB@test.com', 'phone', '+91 93333 44444'),
            'concurrency-test-key-user-b-' || extract(epoch from now())::text
        );

        -- If this line is reached, double booking occurred!
        RAISE EXCEPTION 'CRITICAL INTEGRITY FAILURE: Competing transaction succeeded unexpectedly. Double booking allowed!';
    EXCEPTION
        WHEN OTHERS THEN
            v_err_b := SQLERRM;
            RAISE NOTICE 'Transaction B Expected Conflict Caught: %', v_err_b;
            ASSERT v_err_b LIKE '%SEAT_NOT_AVAILABLE%', 'Expected SEAT_NOT_AVAILABLE error but got: ' || v_err_b;
    END;

    -- ========================================================================
    -- Invariant Verification 1: Partial Unique Index Invariant
    -- In PostgreSQL, idx_booking_seats_active_trip_seat guarantees exactly 1
    -- active record per trip_seat_id.
    -- ========================================================================
    SELECT count(*) INTO v_active_seats_count
    FROM public.booking_seats 
    WHERE trip_seat_id = v_seat_id AND is_active = true;

    ASSERT v_active_seats_count = 1, 
        'ASSERTION FAILED: Database constraint violated! Active booking seats count = ' || v_active_seats_count;

    RAISE NOTICE 'INVARIANT 1 VERIFIED: Exactly 1 active booking seat exists for target seat.';

    -- ========================================================================
    -- Transaction 3: Idempotency Replay with Identical Payload
    -- ========================================================================
    v_res_replay := public.create_booking_atomic(
        v_trip_id,
        v_user_a,
        ARRAY[v_seat_id],
        jsonb_build_array(jsonb_build_object('fullName', 'User A Passenger', 'age', 30, 'gender', 'male', 'seatNumber', v_seat_num)),
        jsonb_build_object('name', 'User A', 'email', 'userA@test.com', 'phone', '+91 91111 22222'),
        v_idem_key
    );

    ASSERT (v_res_replay->>'is_idempotent_replay')::boolean = true, 'Expected is_idempotent_replay = true';
    ASSERT v_res_replay->>'booking_id' = v_res_a->>'booking_id', 'Replay returned different booking_id';
    RAISE NOTICE 'INVARIANT 2 VERIFIED: Idempotent replay returned original booking consistently.';

    -- ========================================================================
    -- Invariant Verification 3: Privacy-Preserving Public Ticket Verification
    -- Verifies Bug Fix ISSUE-01: Confirmed ticket verification does NOT crash
    -- on unassigned v_cancellation record!
    -- ========================================================================
    v_verify_res := public.verify_ticket_by_pnr(v_res_a->>'pnr');
    
    ASSERT (v_verify_res->>'found')::boolean = true, 'Verification failed to find booking by PNR';
    ASSERT (v_verify_res->>'isValidForBoarding')::boolean = true, 'Ticket not marked valid for boarding';
    ASSERT v_verify_res ? 'pnr' = true, 'Verification missing PNR';
    ASSERT v_verify_res ? 'seats' = true, 'Verification missing seats';
    ASSERT v_verify_res ? 'originCity' = true, 'Verification missing originCity';
    ASSERT v_verify_res ? 'destinationCity' = true, 'Verification missing destinationCity';

    -- Ensure sensitive PII is NEVER leaked in public verification output
    ASSERT NOT (v_verify_res ? 'contact_name'), 'LEAK: verification exposed contact_name!';
    ASSERT NOT (v_verify_res ? 'contact_email'), 'LEAK: verification exposed contact_email!';
    ASSERT NOT (v_verify_res ? 'contact_phone'), 'LEAK: verification exposed contact_phone!';
    ASSERT NOT (v_verify_res ? 'passengers'), 'LEAK: verification exposed passengers array!';
    ASSERT NOT (v_verify_res ? 'total_fare'), 'LEAK: verification exposed total_fare!';

    RAISE NOTICE 'INVARIANT 3 VERIFIED: Confirmed ticket verification executed without error and with zero PII leaks.';

    -- ========================================================================
    -- Transaction 4: Cancellation and Restoration of Seat
    -- ========================================================================
    v_cancel_res := public.cancel_booking_atomic(
        (v_res_a->>'booking_id')::uuid,
        v_user_a,
        'Test cancellation verification'
    );

    ASSERT (v_cancel_res->>'status') = 'cancelled', 'Booking cancellation failed';
    ASSERT (SELECT status FROM public.trip_seats WHERE id = v_seat_id) = 'available', 'Seat was not restored to available';

    -- Verify cancelled boarding pass check
    v_verify_cancel_res := public.verify_ticket_by_pnr(v_res_a->>'pnr');
    ASSERT (v_verify_cancel_res->>'isValidForBoarding')::boolean = false, 'Cancelled ticket should not be valid for boarding';
    ASSERT (v_verify_cancel_res->>'isCancelled')::boolean = true, 'Cancelled ticket should have isCancelled = true';

    RAISE NOTICE 'INVARIANT 4 VERIFIED: Cancellation and inventory restoration confirmed.';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'ALL CONCURRENCY, IDEMPOTENCY & PRIVACY INVARIANTS VERIFIED';
    RAISE NOTICE '=======================================================';
END $$;
