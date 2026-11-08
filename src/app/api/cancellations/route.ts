import { NextRequest, NextResponse } from "next/server";
import { cancelBookingSchema } from "@/lib/validation/schemas";
import { CancellationService } from "@/services/cancellation-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cancelBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
    }

    const userId = req.headers.get("x-user-id") || "demo-passenger-id";
    const result = await CancellationService.cancelBooking({
      bookingId: parsed.data.bookingId,
      userId,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ success: true, data: result.cancellation, releasedSeats: result.releasedSeatsCount });
  } catch (error: any) {
    if (error.message?.includes("BOOKING_ALREADY_CANCELLED")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message?.includes("UNAUTHORIZED")) {
      return NextResponse.json({ error: "Unauthorized to cancel this booking" }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Failed to cancel booking" }, { status: 500 });
  }
}

