import { db } from "@/lib/database/in-memory-store";
import { PassengerManifestItem } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";

export class ManifestService {
  public static async getManifestForTrip(tripId: string): Promise<PassengerManifestItem[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          pnr,
          contact_phone,
          contact_email,
          status,
          created_at,
          passengers:booking_passengers(*)
        `)
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true });

      if (error || !data) return [];

      const manifest: PassengerManifestItem[] = [];
      for (const b of data) {
        for (const p of (b.passengers || [])) {
          manifest.push({
            booking_id: b.id,
            pnr: b.pnr,
            passenger_name: p.full_name,
            age: p.age,
            gender: p.gender,
            seat_number: p.seat_number,
            contact_phone: b.contact_phone,
            contact_email: b.contact_email,
            booking_status: b.status,
            created_at: b.created_at,
          });
        }
      }

      return manifest;
    }

    return db.getPassengerManifest(tripId);
  }
}
