import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking-service";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { errorResponse } from "@/lib/auth/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pnr: string }> }
) {
  try {
    // 1. Rate limiting: Max 60 verification queries per minute per IP to prevent PNR enumeration
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`verify:${clientIp}`, 60, 60_000);
    if (!rateCheck.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        `Too many verification queries. Please retry in ${rateCheck.resetInSeconds} seconds.`,
        429
      );
    }

    const { pnr } = await params;
    if (!pnr || typeof pnr !== "string") {
      return errorResponse("INVALID_PNR", "Valid PNR parameter is required", 400);
    }

    const verification = await BookingService.verifyTicket(pnr.trim().toUpperCase());
    if (!verification) {
      return errorResponse("NOT_FOUND", "Ticket with specified PNR not found in system", 404);
    }

    // Return strictly non-PII operational boarding authenticity data
    return NextResponse.json(
      {
        success: true,
        data: verification,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    return errorResponse("VERIFICATION_FAILED", error.message || "Failed to verify boarding pass", 500);
  }
}
