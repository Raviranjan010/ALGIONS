import { db } from "@/lib/database/in-memory-store";
import { Cancellation } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";

export class CancellationService {
  public static async cancelBooking(params: {
    bookingId: string;
    userId: string;
    reason: string;
  }): Promise<{ success: boolean; cancellation: Cancellation; releasedSeatsCount: number }> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc("cancel_booking_atomic", {
        p_booking_id: params.bookingId,
        p_user_id: params.userId,
        p_reason: params.reason,
      });

      if (error) {
        throw new Error(error.message || "Failed to cancel booking");
      }

      // Fetch the created cancellation record
      const { data: canc } = await supabase
        .from("cancellations")
        .select("*")
        .eq("booking_id", params.bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        success: true,
        cancellation: canc as Cancellation,
        releasedSeatsCount: Number(data.released_seats_count || 0),
      };
    }

    return db.cancelBookingAtomic(params);
  }
}
