import { NextRequest, NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/validation/schemas";
import { BookingService } from "@/services/booking-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
    }

    // Default to demo passenger if unauthenticated
    const userId = req.headers.get("x-user-id") || "demo-passenger-id";

    const result = await BookingService.createBooking(userId, parsed.data);
    return NextResponse.json(
      {
        success: true,
        isIdempotentReplay: result.isIdempotentReplay,
        data: result.booking,
      },
      { status: result.isIdempotentReplay ? 200 : 201 }
    );
  } catch (error: any) {
    if (error.message?.includes("SEAT_NOT_AVAILABLE") || error.message?.includes("already booked")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error.message?.includes("IDEMPOTENCY_KEY_REUSED")) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
  }
}
