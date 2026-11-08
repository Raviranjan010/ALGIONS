import { db } from "@/lib/database/in-memory-store";
import { Operator, Vehicle, Route, Trip } from "@/types";

export class OperatorService {
  public static async getOperators(): Promise<Operator[]> {
    return Array.from(db.operators.values());
  }

  public static async getVehicles(operatorId?: string): Promise<Vehicle[]> {
    const list = Array.from(db.vehicles.values());
    return operatorId ? list.filter((v) => v.operator_id === operatorId) : list;
  }

  public static async getRoutes(operatorId?: string): Promise<Route[]> {
    const list = Array.from(db.routes.values());
    return operatorId ? list.filter((r) => r.operator_id === operatorId) : list;
  }

  public static async createVehicle(params: {
    operatorId: string;
    registrationNumber: string;
    model: string;
    layoutType: "2x2" | "2x1" | "sleeper_2x1" | "executive_2x2";
    totalCapacity: number;
  }): Promise<Vehicle> {
    const id = `veh-${Date.now()}`;
    const vehicle: Vehicle = {
      id,
      operator_id: params.operatorId,
      registration_number: params.registrationNumber,
      model: params.model,
      layout_type: params.layoutType,
      total_capacity: params.totalCapacity,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.vehicles.set(id, vehicle);

    // Auto-generate vehicle seats according to layout
    const rows = Math.ceil(params.totalCapacity / (params.layoutType.includes("2x1") ? 3 : 4));
    let count = 0;
    const cols = params.layoutType.includes("2x1") ? ["A", "B", "C"] : ["A", "B", "C", "D"];

    for (let r = 1; r <= rows; r++) {
      for (let c = 0; c < cols.length; c++) {
        if (count >= params.totalCapacity) break;
        count++;
        const sNum = `${r}${cols[c]}`;
        const seatId = `vs-${id}-${sNum}`;
        db.vehicleSeats.set(seatId, {
          id: seatId,
          vehicle_id: id,
          seat_number: sNum,
          deck: "lower",
          seat_row: r,
          seat_column: c + 1,
          seat_type: c === 0 || c === cols.length - 1 ? "window" : "aisle",
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
    }

    return vehicle;
  }

  public static async createRoute(params: {
    operatorId: string;
    routeNumber: string;
    originCity: string;
    destinationCity: string;
    distanceKm: number;
    estimatedDurationMins: number;
  }): Promise<Route> {
    const id = `rt-${Date.now()}`;
    const route: Route = {
      id,
      operator_id: params.operatorId,
      route_number: params.routeNumber,
      origin_city: params.originCity,
      destination_city: params.destinationCity,
      distance_km: params.distanceKm,
      estimated_duration_mins: params.estimatedDurationMins,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.routes.set(id, route);
    return route;
  }

  public static async createTrip(params: {
    operatorId: string;
    routeId: string;
    vehicleId: string;
    tripCode: string;
    departureTime: string;
    arrivalTime: string;
    baseFare: number;
  }): Promise<Trip> {
    const id = `trip-${Date.now()}`;
    const trip: Trip = {
      id,
      operator_id: params.operatorId,
      route_id: params.routeId,
      vehicle_id: params.vehicleId,
      trip_code: params.tripCode,
      departure_time: params.departureTime,
      arrival_time: params.arrivalTime,
      base_fare: params.baseFare,
      status: "scheduled",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.trips.set(id, trip);

    // Initialize trip seats from vehicle seats
    for (const vs of db.vehicleSeats.values()) {
      if (vs.vehicle_id === params.vehicleId) {
        const tsId = `ts-${id}-${vs.seat_number}`;
        db.tripSeats.set(tsId, {
          id: tsId,
          trip_id: id,
          vehicle_seat_id: vs.id,
          seat_number: vs.seat_number,
          seat_type: vs.seat_type,
          fare: params.baseFare + (vs.seat_type === "window" || vs.seat_type === "sleeper" ? 50 : 0),
          status: "available",
          updated_at: new Date().toISOString(),
          deck: vs.deck,
          seat_row: vs.seat_row,
          seat_column: vs.seat_column,
        });
      }
    }

    return db.getTripById(id)!;
  }
}
