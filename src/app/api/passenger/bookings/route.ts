import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking-service";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") || "demo-passenger-id";
    const bookings = await BookingService.getPassengerBookings(userId);
    return NextResponse.json({ success: true, count: bookings.length, data: bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

