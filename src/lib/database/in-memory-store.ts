import {
  Profile,
  Operator,
  Vehicle,
  VehicleSeat,
  Route,
  RouteStop,
  Trip,
  TripSeat,
  Booking,
  BookingPassenger,
  BookingSeat,
  Cancellation,
  AuditLog,
  PassengerManifestItem,
  OccupancyReport,
  PublicTicketVerification,
} from "@/types";

// Seed Identifiers
export const SEED_OPERATORS: Operator[] = [
  {
    id: "a1000000-0000-0000-0000-000000000001",
    name: "Royal Express Travels",
    slug: "royal-express",
    code: "ROYAL",
    contact_email: "ops@royalexpress.in",
    contact_phone: "+91 98765 43210",
    address: "101 Transport Nagar, Mumbai, MH",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1000000-0000-0000-0000-000000000002",
    name: "Deccan Highway Lines",
    slug: "deccan-highway",
    code: "DECCAN",
    contact_email: "support@deccanhighway.com",
    contact_phone: "+91 98220 11223",
    address: "45 Ring Road, Bangalore, KA",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a1000000-0000-0000-0000-000000000003",
    name: "Western Fleet Express",
    slug: "western-fleet",
    code: "WEST",
    contact_email: "dispatch@westernfleet.in",
    contact_phone: "+91 99112 33445",
    address: "78 Interstate Hub, Delhi, DL",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: "b1000000-0000-0000-0000-000000000001",
    operator_id: "a1000000-0000-0000-0000-000000000001",
    registration_number: "MH-01-AB-1234",
    model: "Volvo 9600 Multi-Axle AC Sleeper",
    total_capacity: 30,
    layout_type: "sleeper_2x1",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "b1000000-0000-0000-0000-000000000002",
    operator_id: "a1000000-0000-0000-0000-000000000002",
    registration_number: "KA-01-CD-5678",
    model: "Scania Metrolink HD Executive 2x2",
    total_capacity: 36,
    layout_type: "2x2",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const SEED_ROUTES: Route[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    operator_id: "a1000000-0000-0000-0000-000000000001",
    route_number: "EXP-101",
    origin_city: "Mumbai",
    destination_city: "Pune",
    distance_km: 152,
    estimated_duration_mins: 210,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    operator_id: "a1000000-0000-0000-0000-000000000002",
    route_number: "EXP-202",
    origin_city: "Bangalore",
    destination_city: "Hyderabad",
    distance_km: 570,
    estimated_duration_mins: 540,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const SEED_ROUTE_STOPS: RouteStop[] = [
  {
    id: "s1000000-0000-0000-0000-000000000001",
    route_id: "c1000000-0000-0000-0000-000000000001",
    stop_name: "Borivali West",
    city: "Mumbai",
    stop_order: 1,
    duration_from_origin_mins: 0,
    distance_from_origin_km: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: "s1000000-0000-0000-0000-000000000002",
    route_id: "c1000000-0000-0000-0000-000000000001",
    stop_name: "Dadar Central",
    city: "Mumbai",
    stop_order: 2,
    duration_from_origin_mins: 45,
    distance_from_origin_km: 22,
    created_at: new Date().toISOString(),
  },
  {
    id: "s1000000-0000-0000-0000-000000000003",
    route_id: "c1000000-0000-0000-0000-000000000001",
    stop_name: "Vashi Highway",
    city: "Navi Mumbai",
    stop_order: 3,
    duration_from_origin_mins: 90,
    distance_from_origin_km: 48,
    created_at: new Date().toISOString(),
  },
  {
    id: "s1000000-0000-0000-0000-000000000004",
    route_id: "c1000000-0000-0000-0000-000000000001",
    stop_name: "Wakad Bridge",
    city: "Pune",
    stop_order: 4,
    duration_from_origin_mins: 190,
    distance_from_origin_km: 140,
    created_at: new Date().toISOString(),
  },
  {
    id: "s1000000-0000-0000-0000-000000000005",
    route_id: "c1000000-0000-0000-0000-000000000001",
    stop_name: "Swargate Terminal",
    city: "Pune",
    stop_order: 5,
    duration_from_origin_mins: 210,
    distance_from_origin_km: 152,
    created_at: new Date().toISOString(),
  },
];

// In-Memory Database State Container
export class InMemoryDatabase {
  public profiles: Map<string, Profile> = new Map();
  public operators: Map<string, Operator> = new Map();
  public vehicles: Map<string, Vehicle> = new Map();
  public vehicleSeats: Map<string, VehicleSeat> = new Map();
  public routes: Map<string, Route> = new Map();
  public routeStops: Map<string, RouteStop> = new Map();
  public trips: Map<string, Trip> = new Map();
  public tripSeats: Map<string, TripSeat> = new Map();
  public bookings: Map<string, Booking> = new Map();
  public bookingPassengers: Map<string, BookingPassenger> = new Map();
  public bookingSeats: Map<string, BookingSeat> = new Map();
  public cancellations: Map<string, Cancellation> = new Map();
  public auditLogs: AuditLog[] = [];

  // Concurrency Mutex for simulated transactions
  private lock = Promise.resolve();

  constructor() {
    this.seed();
  }

  public seed() {
    // 1. Operators
    SEED_OPERATORS.forEach((op) => this.operators.set(op.id, { ...op }));
    // 2. Vehicles
    SEED_VEHICLES.forEach((veh) => this.vehicles.set(veh.id, { ...veh }));
    // 3. Routes
    SEED_ROUTES.forEach((rt) => this.routes.set(rt.id, { ...rt }));
    // 4. Route Stops
    SEED_ROUTE_STOPS.forEach((st) => this.routeStops.set(st.id, { ...st }));

    // 5. Vehicle Seats for Volvo 9600 (30 sleeper berths)
    const veh1 = SEED_VEHICLES[0];
    for (let r = 1; r <= 10; r++) {
      ["A", "B", "C"].forEach((colChar, cIdx) => {
        const seatNum = `L${r}${colChar}`;
        const seatId = `vs-v1-${seatNum}`;
        this.vehicleSeats.set(seatId, {
          id: seatId,
          vehicle_id: veh1.id,
          seat_number: seatNum,
          deck: "lower",
          seat_row: r,
          seat_column: cIdx + 1,
          seat_type: "sleeper",
          is_active: true,
          created_at: new Date().toISOString(),
        });
      });
    }

    // 6. Vehicle Seats for Scania 2x2 (36 seats)
    const veh2 = SEED_VEHICLES[1];
    for (let r = 1; r <= 9; r++) {
      ["A", "B", "C", "D"].forEach((colChar, cIdx) => {
        const seatNum = `${r}${colChar}`;
        const seatId = `vs-v2-${seatNum}`;
        this.vehicleSeats.set(seatId, {
          id: seatId,
          vehicle_id: veh2.id,
          seat_number: seatNum,
          deck: "lower",
          seat_row: r,
          seat_column: cIdx + 1,
          seat_type: cIdx === 0 || cIdx === 3 ? "window" : "aisle",
          is_active: true,
          created_at: new Date().toISOString(),
        });
      });
    }

    // 7. Trips
    const now = new Date();
    // Departure tomorrow 08:00 AM
    const dep1 = new Date(now);
    dep1.setDate(dep1.getDate() + 1);
    dep1.setHours(8, 0, 0, 0);
    const arr1 = new Date(dep1);
    arr1.setMinutes(arr1.getMinutes() + 210);

    const trip1: Trip = {
      id: "d1000000-0000-0000-0000-000000000001",
      operator_id: SEED_OPERATORS[0].id,
      route_id: SEED_ROUTES[0].id,
      vehicle_id: veh1.id,
      trip_code: "RYL-101-MUMPUN",
      departure_time: dep1.toISOString(),
      arrival_time: arr1.toISOString(),
      base_fare: 850,
      status: "scheduled",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.trips.set(trip1.id, trip1);

    // Departure tomorrow 09:30 PM (Bangalore -> Hyderabad)
    const dep2 = new Date(now);
    dep2.setDate(dep2.getDate() + 1);
    dep2.setHours(21, 30, 0, 0);
    const arr2 = new Date(dep2);
    arr2.setMinutes(arr2.getMinutes() + 540);

    const trip2: Trip = {
      id: "d1000000-0000-0000-0000-000000000002",
      operator_id: SEED_OPERATORS[1].id,
      route_id: SEED_ROUTES[1].id,
      vehicle_id: veh2.id,
      trip_code: "DEC-202-BLRHYD",
      departure_time: dep2.toISOString(),
      arrival_time: arr2.toISOString(),
      base_fare: 1450,
      status: "scheduled",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.trips.set(trip2.id, trip2);

    // 8. Trip Seats Inventory for Trip 1
    this.vehicleSeats.forEach((vs) => {
      if (vs.vehicle_id === veh1.id) {
        const tsId = `ts-t1-${vs.seat_number}`;
        this.tripSeats.set(tsId, {
          id: tsId,
          trip_id: trip1.id,
          vehicle_seat_id: vs.id,
          seat_number: vs.seat_number,
          seat_type: vs.seat_type,
          fare: trip1.base_fare + 50,
          status: "available",
          updated_at: new Date().toISOString(),
          deck: vs.deck,
          seat_row: vs.seat_row,
          seat_column: vs.seat_column,
        });
      }
    });

    // Trip Seats Inventory for Trip 2
    this.vehicleSeats.forEach((vs) => {
      if (vs.vehicle_id === veh2.id) {
        const tsId = `ts-t2-${vs.seat_number}`;
        this.tripSeats.set(tsId, {
          id: tsId,
          trip_id: trip2.id,
          vehicle_seat_id: vs.id,
          seat_number: vs.seat_number,
          seat_type: vs.seat_type,
          fare: trip2.base_fare + (vs.seat_type === "window" ? 50 : 0),
          status: "available",
          updated_at: new Date().toISOString(),
          deck: vs.deck,
          seat_row: vs.seat_row,
          seat_column: vs.seat_column,
        });
      }
    });

    // 9. Demo Users
    this.profiles.set("demo-passenger-id", {
      id: "demo-passenger-id",
      email: "passenger@algions.com",
      full_name: "Ravi Ranjan",
      role: "passenger",
      phone: "+91 98765 00001",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.profiles.set("demo-operator-id", {
      id: "demo-operator-id",
      email: "operator@royalexpress.in",
      full_name: "Royal Express Dispatcher",
      role: "operator",
      phone: "+91 98765 00002",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.profiles.set("demo-admin-id", {
      id: "demo-admin-id",
      email: "admin@algions.com",
      full_name: "Algions System Admin",
      role: "admin",
      phone: "+91 98765 00003",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Mutex synchronized transaction runner
  public async runTransaction<T>(fn: () => Promise<T> | T): Promise<T> {
    const nextLock = this.lock.then(async () => {
      return await fn();
    });
    this.lock = nextLock.then(
      () => {},
      () => {}
    );
    return nextLock;
  }

  // Helper to generate PNR
  public generatePnr(): string {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let pnr = "ALG-";
    for (let i = 0; i < 6; i++) {
      pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pnr;
  }

  // Transactional Atomic Booking RPC implementation
  public async createBookingAtomic(params: {
    tripId: string;
    userId: string;
    seatIds: string[];
    passengers: Array<{ fullName: string; age: number; gender: "male" | "female" | "other"; seatNumber: string }>;
    contact: { name: string; email: string; phone: string };
    idempotencyKey?: string;
  }): Promise<{
    success: boolean;
    isIdempotentReplay: boolean;
    booking: Booking;
  }> {
    return this.runTransaction(async () => {
      // 1. Idempotency Check
      if (params.idempotencyKey) {
        for (const existing of this.bookings.values()) {
          if (existing.idempotency_key === params.idempotencyKey) {
            if (existing.trip_id === params.tripId && existing.user_id === params.userId) {
              const fullBooking = this.getBookingById(existing.id);
              if (fullBooking) {
                return {
                  success: true,
                  isIdempotentReplay: true,
                  booking: fullBooking,
                };
              }
            } else {
              throw new Error("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
            }
          }
        }
      }

      // 2. Validate Trip
      const trip = this.trips.get(params.tripId);
      if (!trip) {
        throw new Error("TRIP_NOT_FOUND");
      }
      if (trip.status !== "scheduled" && trip.status !== "boarding") {
        throw new Error("TRIP_NOT_BOOKABLE");
      }
      if (new Date(trip.departure_time) <= new Date()) {
        throw new Error("TRIP_ALREADY_DEPARTED");
      }

      // 3. Validate Seats
      if (!params.seatIds || params.seatIds.length === 0) {
        throw new Error("NO_SEATS_SELECTED");
      }
      const uniqueSeatIds = new Set(params.seatIds);
      if (uniqueSeatIds.size !== params.seatIds.length) {
        throw new Error("DUPLICATE_SEATS_IN_REQUEST");
      }

      // 4. Row Lock & Invariant Check: Confirm seats belong to trip and are 'available'
      let totalFare = 0;
      const lockedSeats: TripSeat[] = [];

      for (const seatId of params.seatIds) {
        const seat = this.tripSeats.get(seatId);
        if (!seat || seat.trip_id !== params.tripId) {
          throw new Error("SEAT_NOT_FOUND_ON_TRIP");
        }
        if (seat.status !== "available") {
          throw new Error(`SEAT_NOT_AVAILABLE: Seat ${seat.seat_number} is already booked or reserved`);
        }

        // Secondary invariant: Check active booking_seats
        for (const bs of this.bookingSeats.values()) {
          if (bs.trip_seat_id === seatId && bs.is_active) {
            throw new Error(`SEAT_NOT_AVAILABLE: Active booking exists for seat ${seat.seat_number}`);
          }
        }

        lockedSeats.push(seat);
        totalFare += Number(seat.fare);
      }

      // 5. Validate Passenger Count
      if (params.passengers.length !== params.seatIds.length) {
        throw new Error("PASSENGER_SEAT_COUNT_MISMATCH");
      }

      // 6. Generate Unique PNR
      let pnr = this.generatePnr();
      while (Array.from(this.bookings.values()).some((b) => b.pnr === pnr)) {
        pnr = this.generatePnr();
      }

      // 7. Insert Booking
      const bookingId = `bkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const nowIso = new Date().toISOString();

      const booking: Booking = {
        id: bookingId,
        pnr,
        trip_id: params.tripId,
        user_id: params.userId,
        contact_name: params.contact.name,
        contact_email: params.contact.email,
        contact_phone: params.contact.phone,
        total_fare: totalFare,
        status: "confirmed",
        idempotency_key: params.idempotencyKey || null,
        created_at: nowIso,
        updated_at: nowIso,
      };
      this.bookings.set(booking.id, booking);

      // 8. Insert Passengers & Seats
      const passengers: BookingPassenger[] = [];
      const seats: BookingSeat[] = [];

      params.passengers.forEach((p, idx) => {
        const bp: BookingPassenger = {
          id: `bp-${bookingId}-${idx}`,
          booking_id: bookingId,
          full_name: p.fullName,
          age: p.age,
          gender: p.gender,
          seat_number: p.seatNumber,
          created_at: nowIso,
        };
        this.bookingPassengers.set(bp.id, bp);
        passengers.push(bp);
      });

      lockedSeats.forEach((st) => {
        const bs: BookingSeat = {
          id: `bs-${bookingId}-${st.seat_number}`,
          booking_id: bookingId,
          trip_seat_id: st.id,
          seat_number: st.seat_number,
          fare: st.fare,
          created_at: nowIso,
        };
        // Mark active
        (bs as BookingSeat & { is_active: boolean }).is_active = true;
        this.bookingSeats.set(bs.id, bs);
        seats.push(bs);

        // Update trip_seat status
        st.status = "booked";
        st.updated_at = nowIso;
        this.tripSeats.set(st.id, st);
      });

      // 9. Audit Log
      this.auditLogs.push({
        id: `audit-${Date.now()}`,
        user_id: params.userId,
        action: "BOOKING_CREATED",
        entity_type: "booking",
        entity_id: bookingId,
        details: {
          pnr,
          trip_id: params.tripId,
          total_fare: totalFare,
          seats_count: params.seatIds.length,
        },
        created_at: nowIso,
      });

      const fullBooking = this.getBookingById(bookingId)!;
      return {
        success: true,
        isIdempotentReplay: false,
        booking: fullBooking,
      };
    });
  }

  // Transactional Atomic Cancellation RPC implementation
  public async cancelBookingAtomic(params: {
    bookingId: string;
    userId: string;
    reason: string;
  }): Promise<{
    success: boolean;
    cancellation: Cancellation;
    releasedSeatsCount: number;
  }> {
    return this.runTransaction(async () => {
      const booking = this.bookings.get(params.bookingId);
      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }
      if (booking.status === "cancelled") {
        throw new Error("BOOKING_ALREADY_CANCELLED");
      }
      if (booking.status === "completed") {
        throw new Error("BOOKING_ALREADY_COMPLETED");
      }

      // Authorization: Check owner or admin
      const profile = this.profiles.get(params.userId);
      const isOwner = booking.user_id === params.userId;
      const isAdmin = profile?.role === "admin";
      const isOperator = profile?.role === "operator";

      if (!isOwner && !isAdmin && !isOperator) {
        throw new Error("UNAUTHORIZED");
      }

      // Trip time calculation for cancellation policy
      const trip = this.trips.get(booking.trip_id);
      if (!trip) {
        throw new Error("TRIP_NOT_FOUND");
      }

      const departureTime = new Date(trip.departure_time).getTime();
      const now = Date.now();
      const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

      let refundPercentage = 0;
      let refundStatus: "simulated_processed" | "simulated_pending" | "non_refundable" = "non_refundable";

      if (hoursUntilDeparture >= 24) {
        refundPercentage = 90;
        refundStatus = "simulated_processed";
      } else if (hoursUntilDeparture >= 12) {
        refundPercentage = 75;
        refundStatus = "simulated_processed";
      } else if (hoursUntilDeparture >= 2) {
        refundPercentage = 50;
        refundStatus = "simulated_processed";
      } else {
        refundPercentage = 0;
        refundStatus = "non_refundable";
      }

      const refundAmount = Math.round((booking.total_fare * refundPercentage) / 100);

      // Release seats
      let releasedSeatsCount = 0;
      for (const bs of this.bookingSeats.values()) {
        if (bs.booking_id === booking.id) {
          (bs as BookingSeat & { is_active: boolean }).is_active = false;
          const ts = this.tripSeats.get(bs.trip_seat_id);
          if (ts) {
            ts.status = "available";
            ts.updated_at = new Date().toISOString();
            this.tripSeats.set(ts.id, ts);
            releasedSeatsCount++;
          }
        }
      }

      // Update booking status
      booking.status = "cancelled";
      booking.updated_at = new Date().toISOString();
      this.bookings.set(booking.id, booking);

      // Create cancellation record
      const cancellation: Cancellation = {
        id: `canc-${Date.now()}`,
        booking_id: booking.id,
        cancelled_by: params.userId,
        reason: params.reason,
        refund_percentage: refundPercentage,
        refund_amount: refundAmount,
        refund_status: refundStatus,
        created_at: new Date().toISOString(),
      };
      this.cancellations.set(cancellation.id, cancellation);

      // Audit Log
      this.auditLogs.push({
        id: `audit-${Date.now()}`,
        user_id: params.userId,
        action: "BOOKING_CANCELLED",
        entity_type: "booking",
        entity_id: booking.id,
        details: {
          pnr: booking.pnr,
          refund_percentage: refundPercentage,
          refund_amount: refundAmount,
          refund_status: refundStatus,
        },
        created_at: new Date().toISOString(),
      });

      return {
        success: true,
        cancellation,
        releasedSeatsCount,
      };
    });
  }

  // Queries
  public getBookingById(bookingId: string): Booking | null {
    const booking = this.bookings.get(bookingId);
    if (!booking) return null;

    const trip = this.getTripById(booking.trip_id);
    const passengers: BookingPassenger[] = [];
    const seats: BookingSeat[] = [];
    let cancellation: Cancellation | undefined;

    for (const p of this.bookingPassengers.values()) {
      if (p.booking_id === booking.id) passengers.push({ ...p });
    }
    for (const s of this.bookingSeats.values()) {
      if (s.booking_id === booking.id) seats.push({ ...s });
    }
    for (const c of this.cancellations.values()) {
      if (c.booking_id === booking.id) {
        cancellation = { ...c };
        break;
      }
    }

    return {
      ...booking,
      trip: trip || undefined,
      passengers,
      seats,
      cancellation,
    };
  }

  public getBookingByPnr(pnr: string): Booking | null {
    for (const b of this.bookings.values()) {
      if (b.pnr.toUpperCase() === pnr.toUpperCase()) {
        return this.getBookingById(b.id);
      }
    }
    return null;
  }

  public verifyTicketByPnr(pnr: string): PublicTicketVerification | null {
    const booking = this.getBookingByPnr(pnr);
    if (!booking) return null;

    const seatNumbers = (booking.seats || []).map((s) => s.seat_number).sort();
    return {
      found: true,
      pnr: booking.pnr,
      status: booking.status,
      isValidForBoarding: booking.status === "confirmed",
      originCity: booking.trip?.route?.origin_city || "Unknown",
      destinationCity: booking.trip?.route?.destination_city || "Unknown",
      departureTime: booking.trip?.departure_time || "",
      arrivalTime: booking.trip?.arrival_time || "",
      operatorName: booking.trip?.operator?.name || "ALGIONS Partner Operator",
      busModel: booking.trip?.vehicle?.model || "Standard Express",
      busRegistration: booking.trip?.vehicle?.registration_number,
      seats: seatNumbers,
      isCancelled: booking.status === "cancelled",
      cancelledAt: booking.cancellation?.created_at,
    };
  }

  public getTripById(tripId: string): Trip | null {
    const trip = this.trips.get(tripId);
    if (!trip) return null;

    const op = this.operators.get(trip.operator_id);
    const route = this.routes.get(trip.route_id);
    const veh = this.vehicles.get(trip.vehicle_id);

    let availableCount = 0;
    let totalCount = 0;
    for (const s of this.tripSeats.values()) {
      if (s.trip_id === trip.id) {
        totalCount++;
        if (s.status === "available") availableCount++;
      }
    }

    return {
      ...trip,
      operator: op,
      route,
      vehicle: veh,
      available_seats_count: availableCount,
      total_seats_count: totalCount,
    };
  }

  public searchTrips(params: {
    origin: string;
    destination: string;
    date: string; // YYYY-MM-DD
  }): Trip[] {
    const results: Trip[] = [];
    const originLower = params.origin.toLowerCase().trim();
    const destLower = params.destination.toLowerCase().trim();

    for (const trip of this.trips.values()) {
      const route = this.routes.get(trip.route_id);
      if (!route) continue;

      const originMatch = route.origin_city.toLowerCase().includes(originLower);
      const destMatch = route.destination_city.toLowerCase().includes(destLower);

      const tripDateStr = new Date(trip.departure_time).toISOString().split("T")[0];
      const dateMatch = !params.date || tripDateStr === params.date;

      if (originMatch && destMatch && dateMatch && trip.status !== "cancelled") {
        const fullTrip = this.getTripById(trip.id);
        if (fullTrip) results.push(fullTrip);
      }
    }

    return results;
  }

  public getTripSeats(tripId: string): TripSeat[] {
    const seats: TripSeat[] = [];
    for (const s of this.tripSeats.values()) {
      if (s.trip_id === tripId) {
        seats.push({ ...s });
      }
    }
    return seats.sort((a, b) => a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true }));
  }

  public getPassengerBookings(userId: string): Booking[] {
    const list: Booking[] = [];
    for (const b of this.bookings.values()) {
      if (b.user_id === userId) {
        const full = this.getBookingById(b.id);
        if (full) list.push(full);
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getPassengerManifest(tripId: string): PassengerManifestItem[] {
    const manifest: PassengerManifestItem[] = [];
    for (const booking of this.bookings.values()) {
      if (booking.trip_id === tripId) {
        for (const passenger of this.bookingPassengers.values()) {
          if (passenger.booking_id === booking.id) {
            manifest.push({
              booking_id: booking.id,
              pnr: booking.pnr,
              passenger_name: passenger.full_name,
              age: passenger.age,
              gender: passenger.gender,
              seat_number: passenger.seat_number,
              contact_phone: booking.contact_phone,
              contact_email: booking.contact_email,
              booking_status: booking.status,
              created_at: booking.created_at,
            });
          }
        }
      }
    }
    return manifest.sort((a, b) => a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true }));
  }

  public getOccupancyReports(operatorId?: string): OccupancyReport[] {
    const reports: OccupancyReport[] = [];

    for (const trip of this.trips.values()) {
      if (operatorId && trip.operator_id !== operatorId) continue;

      const route = this.routes.get(trip.route_id);
      const vehicle = this.vehicles.get(trip.vehicle_id);

      let totalSeats = 0;
      let bookedSeats = 0;
      let grossRevenue = 0;
      let cancelledRevenue = 0;

      for (const s of this.tripSeats.values()) {
        if (s.trip_id === trip.id) {
          totalSeats++;
          if (s.status === "booked") bookedSeats++;
        }
      }

      for (const b of this.bookings.values()) {
        if (b.trip_id === trip.id) {
          if (b.status === "confirmed") {
            grossRevenue += Number(b.total_fare);
          } else if (b.status === "cancelled") {
            for (const c of this.cancellations.values()) {
              if (c.booking_id === b.id) {
                cancelledRevenue += Number(c.refund_amount);
              }
            }
          }
        }
      }

      const netRevenue = grossRevenue - cancelledRevenue;
      const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

      reports.push({
        trip_id: trip.id,
        trip_code: trip.trip_code,
        departure_time: trip.departure_time,
        arrival_time: trip.arrival_time,
        route_name: `${route?.origin_city || "Unknown"} -> ${route?.destination_city || "Unknown"}`,
        vehicle_reg: vehicle?.registration_number || "Unknown",
        total_seats: totalSeats,
        booked_seats: bookedSeats,
        available_seats: totalSeats - bookedSeats,
        occupancy_rate: occupancyRate,
        gross_revenue: grossRevenue,
        cancelled_revenue: cancelledRevenue,
        net_revenue: netRevenue,
      });
    }

    return reports.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
  }
}

// Global Singleton Instance for shared in-memory state
const globalForDb = globalThis as unknown as { inMemoryDb?: InMemoryDatabase };
export const db = globalForDb.inMemoryDb || new InMemoryDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.inMemoryDb = db;

