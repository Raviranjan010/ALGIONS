import { NextRequest, NextResponse } from "next/server";
import { cancelBookingSchema } from "@/lib/validation/schemas";
import { CancellationService } from "@/services/cancellation-service";
import { requireAuth, errorResponse } from "@/lib/auth/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`cancel:${clientIp}`, 20, 300_000);
    if (!rateCheck.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        `Too many cancellation requests. Please retry in ${rateCheck.resetInSeconds} seconds.`,
        429
      );
    }

    // 2. Server-side session authentication
    const user = await requireAuth(req);

    // 3. Request body validation
    const body = await req.json();
    const parsed = cancelBookingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid cancellation request", 400, parsed.error.format());
    }

    // 4. Atomic cancellation with authorization check
    const result = await CancellationService.cancelBooking({
      bookingId: parsed.data.bookingId,
      userId: user.id,
      reason: parsed.data.reason,
    });

    return NextResponse.json({
      success: true,
      data: result.cancellation,
      releasedSeats: result.releasedSeatsCount,
    });
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    if (error.message?.includes("BOOKING_ALREADY_CANCELLED")) {
      return errorResponse("ALREADY_CANCELLED", error.message, 400);
    }
    if (error.message?.includes("UNAUTHORIZED") || error.message?.includes("User is not authorized")) {
      return errorResponse("FORBIDDEN", "You are not authorized to cancel this booking", 403);
    }
    return errorResponse("CANCELLATION_FAILED", error.message || "Failed to cancel booking", 500);
  }
}
