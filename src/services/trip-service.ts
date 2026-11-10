import { db } from "@/lib/database/in-memory-store";
import { Trip, TripSeat } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";

export class TripService {
  public static async searchTrips(params: {
    origin: string;
    destination: string;
    date: string;
    passengers?: number;
  }): Promise<Trip[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      let query = supabase
        .from("trips")
        .select(`
          *,
          route:routes!inner(*),
          operator:operators(*),
          vehicle:vehicles(*),
          seats:trip_seats(id, status)
        `)
        .ilike("route.origin_city", `%${params.origin.trim()}%`)
        .ilike("route.destination_city", `%${params.destination.trim()}%`)
        .in("status", ["scheduled", "boarding"]);

      if (params.date && params.date.trim()) {
        const dayStart = `${params.date.trim()}T00:00:00.000Z`;
        const dayEnd = `${params.date.trim()}T23:59:59.999Z`;
        query = query.gte("departure_time", dayStart).lte("departure_time", dayEnd);
      }

      let { data, error } = await query;

      // Fallback: If no departures found on the exact day, retrieve upcoming scheduled trips on this route
      if (!error && (!data || data.length === 0) && params.date) {
        const fallbackRes = await supabase
          .from("trips")
          .select(`
            *,
            route:routes!inner(*),
            operator:operators(*),
            vehicle:vehicles(*),
            seats:trip_seats(id, status)
          `)
          .ilike("route.origin_city", `%${params.origin.trim()}%`)
          .ilike("route.destination_city", `%${params.destination.trim()}%`)
          .in("status", ["scheduled", "boarding"])
          .order("departure_time", { ascending: true })
          .limit(10);

        if (!fallbackRes.error && fallbackRes.data) {
          data = fallbackRes.data;
        }
      }

      if (error || !data) return [];

      return data.map((t: any) => {
        const availableSeats = (t.seats || []).filter((s: any) => s.status === "available").length;
        const totalSeats = (t.seats || []).length;
        return {
          id: t.id,
          operator_id: t.operator_id,
          route_id: t.route_id,
          vehicle_id: t.vehicle_id,
          trip_code: t.trip_code,
          departure_time: t.departure_time,
          arrival_time: t.arrival_time,
          base_fare: Number(t.base_fare),
          status: t.status,
          created_at: t.created_at,
          updated_at: t.updated_at,
          operator: t.operator,
          route: t.route,
          vehicle: t.vehicle,
          available_seats_count: availableSeats,
          total_seats_count: totalSeats,
        };
      });
    }

    return db.searchTrips(params);
  }

  public static async getTripById(tripId: string): Promise<Trip | null> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data: t, error } = await supabase
        .from("trips")
        .select(`
          *,
          route:routes(*),
          operator:operators(*),
          vehicle:vehicles(*),
          seats:trip_seats(id, status)
        `)
        .eq("id", tripId)
        .single();

      if (error || !t) return null;

      const availableSeats = (t.seats || []).filter((s: any) => s.status === "available").length;
      const totalSeats = (t.seats || []).length;

      return {
        id: t.id,
        operator_id: t.operator_id,
        route_id: t.route_id,
        vehicle_id: t.vehicle_id,
        trip_code: t.trip_code,
        departure_time: t.departure_time,
        arrival_time: t.arrival_time,
        base_fare: Number(t.base_fare),
        status: t.status,
        created_at: t.created_at,
        updated_at: t.updated_at,
        operator: t.operator,
        route: t.route,
        vehicle: t.vehicle,
        available_seats_count: availableSeats,
        total_seats_count: totalSeats,
      };
    }

    return db.getTripById(tripId);
  }

  public static async getTripSeats(tripId: string): Promise<TripSeat[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("trip_seats")
        .select(`
          *,
          vehicle_seat:vehicle_seats(deck, seat_row, seat_column)
        `)
        .eq("trip_id", tripId);

      if (error || !data) return [];

      return data.map((s: any) => ({
        id: s.id,
        trip_id: s.trip_id,
        vehicle_seat_id: s.vehicle_seat_id,
        seat_number: s.seat_number,
        seat_type: s.seat_type,
        fare: Number(s.fare),
        status: s.status,
        updated_at: s.updated_at,
        deck: s.vehicle_seat?.deck || "lower",
        seat_row: s.vehicle_seat?.seat_row || 1,
        seat_column: s.vehicle_seat?.seat_column || 1,
      }));
    }

    return db.getTripSeats(tripId);
  }

  public static async getAllTrips(): Promise<Trip[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          route:routes(*),
          operator:operators(*),
          vehicle:vehicles(*),
          seats:trip_seats(id, status)
        `)
        .order("departure_time", { ascending: true });

      if (error || !data) return [];

      return data.map((t: any) => ({
        id: t.id,
        operator_id: t.operator_id,
        route_id: t.route_id,
        vehicle_id: t.vehicle_id,
        trip_code: t.trip_code,
        departure_time: t.departure_time,
        arrival_time: t.arrival_time,
        base_fare: Number(t.base_fare),
        status: t.status,
        created_at: t.created_at,
        updated_at: t.updated_at,
        operator: t.operator,
        route: t.route,
        vehicle: t.vehicle,
        available_seats_count: (t.seats || []).filter((s: any) => s.status === "available").length,
        total_seats_count: (t.seats || []).length,
      }));
    }

    const trips: Trip[] = [];
    for (const t of db.trips.values()) {
      const full = db.getTripById(t.id);
      if (full) trips.push(full);
    }
    return trips.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
  }
}
