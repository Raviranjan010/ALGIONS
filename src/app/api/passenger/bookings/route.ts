import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking-service";
import { requireAuth, errorResponse } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    // Enforce verified server-side session authentication
    const user = await requireAuth(req);

    // Retrieve bookings strictly for authenticated user
    const bookings = await BookingService.getPassengerBookings(user.id);

    return NextResponse.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to retrieve bookings", 500);
  }
}
