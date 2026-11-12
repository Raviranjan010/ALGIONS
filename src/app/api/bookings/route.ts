import { NextRequest, NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/validation/schemas";
import { BookingService } from "@/services/booking-service";
import { getAuthenticatedUser, errorResponse } from "@/lib/auth/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: Max 30 booking requests per 5 minutes per IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`booking:${clientIp}`, 30, 300_000);
    if (!rateCheck.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        `Too many booking attempts. Please retry in ${rateCheck.resetInSeconds} seconds.`,
        429
      );
    }

    // 2. Validate request body
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid booking payload", 400, parsed.error.format());
    }

    // A verified account session is required; never resolve an account from a submitted email.
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please sign in before booking a seat.", 401);
    }

    // 4. Create booking with verified user identity
    const result = await BookingService.createBooking(user.id, parsed.data);

    return NextResponse.json(
      {
        success: true,
        isIdempotentReplay: result.isIdempotentReplay,
        data: result.booking,
      },
      { status: result.isIdempotentReplay ? 200 : 201 }
    );
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    if (error.message?.includes("SEAT_NOT_AVAILABLE") || error.message?.includes("already booked")) {
      return errorResponse("SEAT_UNAVAILABLE", error.message, 409);
    }
    if (error.message?.includes("IDEMPOTENCY_KEY_REUSED")) {
      return errorResponse("IDEMPOTENCY_CONFLICT", error.message, 422);
    }
    if (error.message?.includes("PASSENGER_SEAT_COUNT_MISMATCH") || error.message?.includes("PASSENGER_SEAT_MISMATCH")) {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }
    return errorResponse("BOOKING_FAILED", error.message || "Failed to create booking", 500);
  }
}
