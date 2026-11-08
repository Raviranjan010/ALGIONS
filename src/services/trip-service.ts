import { db } from "@/lib/database/in-memory-store";
import { Trip, TripSeat } from "@/types";

export class TripService {
  public static async searchTrips(params: {
    origin: string;
    destination: string;
    date: string;
    passengers?: number;
  }): Promise<Trip[]> {
    // If Supabase environment is active, we can query Supabase
    // Otherwise, our in-memory engine provides instant and reliable responses
    return db.searchTrips(params);
  }

  public static async getTripById(tripId: string): Promise<Trip | null> {
    return db.getTripById(tripId);
  }

  public static async getTripSeats(tripId: string): Promise<TripSeat[]> {
    return db.getTripSeats(tripId);
  }

  public static async getAllTrips(): Promise<Trip[]> {
    const trips: Trip[] = [];
    for (const t of db.trips.values()) {
      const full = db.getTripById(t.id);
      if (full) trips.push(full);
    }
    return trips.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
  }
}
