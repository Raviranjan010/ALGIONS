import { db } from "@/lib/database/in-memory-store";
import { Cancellation } from "@/types";

export class CancellationService {
  public static async cancelBooking(params: {
    bookingId: string;
    userId: string;
    reason: string;
  }): Promise<{ success: boolean; cancellation: Cancellation; releasedSeatsCount: number }> {
    return db.cancelBookingAtomic(params);
  }
}
