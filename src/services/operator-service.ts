import { db } from "@/lib/database/in-memory-store";
import { Operator, Vehicle, Route, Trip } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";

export class OperatorService {
  public static async getOperators(): Promise<Operator[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from("operators").select("*").eq("is_active", true);
      if (error || !data) return [];
      return data as Operator[];
    }
    return Array.from(db.operators.values());
  }

  public static async getVehicles(operatorId?: string): Promise<Vehicle[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      let query = supabase.from("vehicles").select("*, operator:operators(*)");
      if (operatorId) query = query.eq("operator_id", operatorId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data as Vehicle[];
    }
    const list = Array.from(db.vehicles.values());
    return operatorId ? list.filter((v) => v.operator_id === operatorId) : list;
  }

  public static async getRoutes(operatorId?: string): Promise<Route[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      let query = supabase.from("routes").select("*, stops:route_stops(*)");
      if (operatorId) query = query.eq("operator_id", operatorId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data as Route[];
    }
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
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          operator_id: params.operatorId,
          registration_number: params.registrationNumber,
          model: params.model,
          layout_type: params.layoutType,
          total_capacity: params.totalCapacity,
        })
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || "Failed to create vehicle");
      return data as Vehicle;
    }

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
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("routes")
        .insert({
          operator_id: params.operatorId,
          route_number: params.routeNumber,
          origin_city: params.originCity,
          destination_city: params.destinationCity,
          distance_km: params.distanceKm,
          estimated_duration_mins: params.estimatedDurationMins,
        })
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || "Failed to create route");
      return data as Route;
    }

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
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("trips")
        .insert({
          operator_id: params.operatorId,
          route_id: params.routeId,
          vehicle_id: params.vehicleId,
          trip_code: params.tripCode,
          departure_time: params.departureTime,
          arrival_time: params.arrivalTime,
          base_fare: params.baseFare,
          status: "scheduled",
        })
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || "Failed to create trip");
      return data as Trip;
    }

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
    return db.getTripById(id)!;
  }
}
