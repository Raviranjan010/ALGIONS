import { db } from "@/lib/database/in-memory-store";
import { OccupancyReport } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";

export class ReportService {
  public static async getOccupancyReports(operatorId?: string): Promise<OccupancyReport[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      let tripsQuery = supabase
        .from("trips")
        .select(`
          id,
          trip_code,
          departure_time,
          arrival_time,
          operator_id,
          route:routes(origin_city, destination_city),
          vehicle:vehicles(registration_number),
          seats:trip_seats(id, status, fare),
          bookings:bookings(id, total_fare, status, cancellation:cancellations(refund_amount))
        `);

      if (operatorId) {
        tripsQuery = tripsQuery.eq("operator_id", operatorId);
      }

      const { data, error } = await tripsQuery;
      if (error || !data) return [];

      return data.map((t: any) => {
        const seats = t.seats || [];
        const totalSeats = seats.length;
        const bookedSeats = seats.filter((s: any) => s.status === "booked").length;
        const availableSeats = totalSeats - bookedSeats;
        const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

        let grossRevenue = 0;
        let cancelledRevenue = 0;

        for (const b of (t.bookings || [])) {
          grossRevenue += Number(b.total_fare || 0);
          if (b.status === "cancelled" && b.cancellation?.[0]?.refund_amount) {
            cancelledRevenue += Number(b.cancellation[0].refund_amount);
          }
        }

        const netRevenue = Math.max(0, grossRevenue - cancelledRevenue);
        const routeName = t.route ? `${t.route.origin_city} → ${t.route.destination_city}` : "Intercity Transit";

        return {
          trip_id: t.id,
          trip_code: t.trip_code,
          departure_time: t.departure_time,
          arrival_time: t.arrival_time,
          route_name: routeName,
          vehicle_reg: t.vehicle?.registration_number || "MH-01",
          total_seats: totalSeats,
          booked_seats: bookedSeats,
          available_seats: availableSeats,
          occupancy_rate: occupancyRate,
          gross_revenue: grossRevenue,
          cancelled_revenue: cancelledRevenue,
          net_revenue: netRevenue,
        };
      });
    }

    return db.getOccupancyReports(operatorId);
  }
}
