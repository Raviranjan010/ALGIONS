import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pnr: string }> }
) {
  try {
    const { pnr } = await params;
    const booking = await BookingService.getBookingByPnr(pnr);
    if (!booking) {
      return NextResponse.json({ error: "Booking with specified PNR not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
