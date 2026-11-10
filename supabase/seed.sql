-- ============================================================================
-- RYDVANTA BUS BOOKING MANAGEMENT SYSTEM
-- Seed Data: supabase/seed.sql
-- Realistic bus operators, vehicles, seat layouts, routes, stops, trips, and demo bookings
-- ============================================================================

DO $$
DECLARE
    -- Operator IDs
    op_royal UUID := 'a1000000-0000-0000-0000-000000000001';
    op_deccan UUID := 'a1000000-0000-0000-0000-000000000002';
    op_western UUID := 'a1000000-0000-0000-0000-000000000003';

    -- Vehicle IDs
    veh_volvo1 UUID := 'b1000000-0000-0000-0000-000000000001';
    veh_sleeper1 UUID := 'b1000000-0000-0000-0000-000000000002';
    veh_scania1 UUID := 'b1000000-0000-0000-0000-000000000003';
    veh_benz1 UUID := 'b1000000-0000-0000-0000-000000000004';

    -- Route IDs
    rt_mum_pun UUID := 'c1000000-0000-0000-0000-000000000001';
    rt_blr_hyd UUID := 'c1000000-0000-0000-0000-000000000002';
    rt_del_jai UUID := 'c1000000-0000-0000-0000-000000000003';
    rt_chn_blr UUID := 'c1000000-0000-0000-0000-000000000004';

    -- Trip IDs
    trip_1 UUID := 'd1000000-0000-0000-0000-000000000001';
    trip_2 UUID := 'd1000000-0000-0000-0000-000000000002';
    trip_3 UUID := 'd1000000-0000-0000-0000-000000000003';
    trip_4 UUID := 'd1000000-0000-0000-0000-000000000004';

    -- Demo User Profile IDs
    user_passenger1 UUID := 'e1000000-0000-0000-0000-000000000001';
    user_operator1 UUID := 'e1000000-0000-0000-0000-000000000002';
    user_admin1 UUID := 'e1000000-0000-0000-0000-000000000003';

    r INT;
    c INT;
    s_num TEXT;
    s_type TEXT;
BEGIN
    -- 1. OPERATORS
    INSERT INTO public.operators (id, name, slug, code, contact_email, contact_phone, address, is_active)
    VALUES 
        (op_royal, 'Royal Express Travels', 'royal-express', 'ROYAL', 'ops@royalexpress.in', '+91 98765 43210', '101 Transport Nagar, Mumbai, MH', true),
        (op_deccan, 'Deccan Highway Lines', 'deccan-highway', 'DECCAN', 'support@deccanhighway.com', '+91 98220 11223', '45 Ring Road, Bangalore, KA', true),
        (op_western, 'Western Fleet Express', 'western-fleet', 'WEST', 'dispatch@westernfleet.in', '+91 99112 33445', '78 Interstate Hub, Delhi, DL', true)
    ON CONFLICT (id) DO NOTHING;

    -- 2. VEHICLES
    INSERT INTO public.vehicles (id, operator_id, registration_number, model, total_capacity, layout_type, is_active)
    VALUES
        (veh_volvo1, op_royal, 'MH-01-AB-1234', 'Volvo 9600 Multi-Axle AC Sleeper', 30, 'sleeper_2x1', true),
        (veh_sleeper1, op_deccan, 'KA-01-CD-5678', 'Scania Metrolink HD Executive', 36, '2x2', true),
        (veh_scania1, op_western, 'DL-01-EF-9012', 'BharatBenz AC Executive', 32, '2x2', true),
        (veh_benz1, op_deccan, 'TN-01-GH-3456', 'Volvo B11R Multi-Axle 2x2', 36, '2x2', true)
    ON CONFLICT (id) DO NOTHING;

    -- 3. VEHICLE SEATS GENERATION FOR veh_volvo1 (30 Sleeper berths)
    FOR r IN 1..10 LOOP
        s_num := 'L' || r || 'A';
        INSERT INTO public.vehicle_seats (vehicle_id, seat_number, deck, seat_row, seat_column, seat_type, is_active)
        VALUES (veh_volvo1, s_num, 'lower', r, 1, 'sleeper', true)
        ON CONFLICT (vehicle_id, seat_number) DO NOTHING;

        s_num := 'L' || r || 'B';
        INSERT INTO public.vehicle_seats (vehicle_id, seat_number, deck, seat_row, seat_column, seat_type, is_active)
        VALUES (veh_volvo1, s_num, 'lower', r, 2, 'sleeper', true)
        ON CONFLICT (vehicle_id, seat_number) DO NOTHING;

        s_num := 'L' || r || 'C';
        INSERT INTO public.vehicle_seats (vehicle_id, seat_number, deck, seat_row, seat_column, seat_type, is_active)
        VALUES (veh_volvo1, s_num, 'lower', r, 3, 'sleeper', true)
        ON CONFLICT (vehicle_id, seat_number) DO NOTHING;
    END LOOP;

    -- VEHICLE SEATS FOR veh_sleeper1 (36 Seater: 9 rows x 4 seats: 2x2 layout)
    FOR r IN 1..9 LOOP
        FOR c IN 1..4 LOOP
            s_num := r || chr(64 + c);
            s_type := CASE WHEN c IN (1, 4) THEN 'window' ELSE 'aisle' END;
            INSERT INTO public.vehicle_seats (vehicle_id, seat_number, deck, seat_row, seat_column, seat_type, is_active)
            VALUES (veh_sleeper1, s_num, 'lower', r, c, s_type, true)
            ON CONFLICT (vehicle_id, seat_number) DO NOTHING;
        END LOOP;
    END LOOP;

    -- VEHICLE SEATS FOR veh_scania1 (32 Seater: 8 rows x 4 seats: 2x2 layout)
    FOR r IN 1..8 LOOP
        FOR c IN 1..4 LOOP
            s_num := r || chr(64 + c);
            s_type := CASE WHEN c IN (1, 4) THEN 'window' ELSE 'aisle' END;
            INSERT INTO public.vehicle_seats (vehicle_id, seat_number, deck, seat_row, seat_column, seat_type, is_active)
            VALUES (veh_scania1, s_num, 'lower', r, c, s_type, true)
            ON CONFLICT (vehicle_id, seat_number) DO NOTHING;
        END LOOP;
    END LOOP;

    -- VEHICLE SEATS FOR veh_benz1 (36 Seater: 9 rows x 4 seats: 2x2 layout)
    FOR r IN 1..9 LOOP
        FOR c IN 1..4 LOOP
            s_num := r || chr(64 + c);
            s_type := CASE WHEN c IN (1, 4) THEN 'window' ELSE 'aisle' END;
            INSERT INTO public.vehicle_seats (vehicle_id, seat_number, deck, seat_row, seat_column, seat_type, is_active)
            VALUES (veh_benz1, s_num, 'lower', r, c, s_type, true)
            ON CONFLICT (vehicle_id, seat_number) DO NOTHING;
        END LOOP;
    END LOOP;

    -- 4. ROUTES
    INSERT INTO public.routes (id, operator_id, route_number, origin_city, destination_city, distance_km, estimated_duration_mins, is_active)
    VALUES
        (rt_mum_pun, op_royal, 'EXP-101', 'Mumbai', 'Pune', 152.00, 210, true),
        (rt_blr_hyd, op_deccan, 'EXP-202', 'Bangalore', 'Hyderabad', 570.00, 540, true),
        (rt_del_jai, op_western, 'EXP-303', 'Delhi', 'Jaipur', 280.00, 315, true),
        (rt_chn_blr, op_deccan, 'EXP-404', 'Chennai', 'Bangalore', 350.00, 405, true)
    ON CONFLICT (id) DO NOTHING;

    -- 5. ROUTE STOPS
    INSERT INTO public.route_stops (route_id, stop_name, city, stop_order, duration_from_origin_mins, distance_from_origin_km)
    VALUES
        (rt_mum_pun, 'Borivali West (Gokul Hotel)', 'Mumbai', 1, 0, 0),
        (rt_mum_pun, 'Dadar Central (Pritam Hotel)', 'Mumbai', 2, 45, 22),
        (rt_mum_pun, 'Vashi Highway Plaza', 'Navi Mumbai', 3, 90, 48),
        (rt_mum_pun, 'Lonavala Expressway Exit', 'Lonavala', 4, 150, 95),
        (rt_mum_pun, 'Wakad Bridge', 'Pune', 5, 190, 140),
        (rt_mum_pun, 'Swargate Terminal', 'Pune', 6, 210, 152),
        (rt_blr_hyd, 'Majestic Bus Stand', 'Bangalore', 1, 0, 0),
        (rt_blr_hyd, 'Hebbal Flyover', 'Bangalore', 2, 40, 15),
        (rt_blr_hyd, 'Anantapur Toll', 'Anantapur', 3, 240, 215),
        (rt_blr_hyd, 'Kurnool Highway Rest', 'Kurnool', 4, 380, 360),
        (rt_blr_hyd, 'Shamshabad Airport Junction', 'Hyderabad', 5, 500, 545),
        (rt_blr_hyd, 'Ameerpet Metro Station', 'Hyderabad', 6, 540, 570)
    ON CONFLICT (route_id, stop_order) DO NOTHING;

    -- 6. TRIPS (Future departures relative to now)
    INSERT INTO public.trips (id, operator_id, route_id, vehicle_id, trip_code, departure_time, arrival_time, base_fare, status)
    VALUES
        (trip_1, op_royal, rt_mum_pun, veh_volvo1, 'RYL-101-MUMPUN', (now() + interval '1 day' + interval '6 hours'), (now() + interval '1 day' + interval '9 hours 30 mins'), 750.00, 'scheduled'),
        (trip_2, op_deccan, rt_blr_hyd, veh_sleeper1, 'DEC-202-BLRHYD', (now() + interval '1 day' + interval '21 hours'), (now() + interval '2 days' + interval '6 hours'), 1450.00, 'scheduled'),
        (trip_3, op_western, rt_del_jai, veh_scania1, 'WST-303-DELJAI', (now() + interval '1 day' + interval '7 hours'), (now() + interval '1 day' + interval '12 hours 15 mins'), 550.00, 'scheduled'),
        (trip_4, op_deccan, rt_chn_blr, veh_benz1, 'DEC-404-CHNBLR', (now() + interval '1 day' + interval '8 hours'), (now() + interval '1 day' + interval '14 hours 45 mins'), 650.00, 'scheduled')
    ON CONFLICT (id) DO NOTHING;

    -- 7. TRIP SEATS INVENTORY GENERATION FOR ALL 4 TRIPS
    -- Trip 1 seats (Mumbai -> Pune)
    INSERT INTO public.trip_seats (trip_id, vehicle_seat_id, seat_number, seat_type, fare, status)
    SELECT 
        trip_1,
        vs.id,
        vs.seat_number,
        vs.seat_type,
        750.00 + (CASE WHEN vs.seat_type = 'sleeper' THEN 100 ELSE 0 END),
        'available'
    FROM public.vehicle_seats vs
    WHERE vs.vehicle_id = veh_volvo1
    ON CONFLICT (trip_id, seat_number) DO NOTHING;

    -- Trip 2 seats (Bangalore -> Hyderabad)
    INSERT INTO public.trip_seats (trip_id, vehicle_seat_id, seat_number, seat_type, fare, status)
    SELECT 
        trip_2,
        vs.id,
        vs.seat_number,
        vs.seat_type,
        1450.00 + (CASE WHEN vs.seat_type = 'window' THEN 50 ELSE 0 END),
        'available'
    FROM public.vehicle_seats vs
    WHERE vs.vehicle_id = veh_sleeper1
    ON CONFLICT (trip_id, seat_number) DO NOTHING;

    -- Trip 3 seats (Delhi -> Jaipur)
    INSERT INTO public.trip_seats (trip_id, vehicle_seat_id, seat_number, seat_type, fare, status)
    SELECT 
        trip_3,
        vs.id,
        vs.seat_number,
        vs.seat_type,
        550.00 + (CASE WHEN vs.seat_type = 'window' THEN 50 ELSE 0 END),
        'available'
    FROM public.vehicle_seats vs
    WHERE vs.vehicle_id = veh_scania1
    ON CONFLICT (trip_id, seat_number) DO NOTHING;

    -- Trip 4 seats (Chennai -> Bangalore)
    INSERT INTO public.trip_seats (trip_id, vehicle_seat_id, seat_number, seat_type, fare, status)
    SELECT 
        trip_4,
        vs.id,
        vs.seat_number,
        vs.seat_type,
        650.00 + (CASE WHEN vs.seat_type = 'window' THEN 50 ELSE 0 END),
        'available'
    FROM public.vehicle_seats vs
    WHERE vs.vehicle_id = veh_benz1
    ON CONFLICT (trip_id, seat_number) DO NOTHING;

END $$;
