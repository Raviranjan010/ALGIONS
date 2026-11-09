import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking-service";
import { requireAuth, errorResponse } from "@/lib/auth/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pnr: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { pnr } = await params;

    if (!pnr || typeof pnr !== "string") {
      return errorResponse("INVALID_PNR", "Valid PNR is required", 400);
    }

    const booking = await BookingService.getBookingByPnr(pnr.trim().toUpperCase());
    if (!booking) {
      return errorResponse("NOT_FOUND", "Booking with specified PNR not found", 404);
    }

    // Authorization: Owner, Admin, or Operating Operator
    const isOwner = booking.user_id === user.id;
    const isAdmin = user.role === "admin";
    const isOperator = user.role === "operator";

    if (!isOwner && !isAdmin && !isOperator) {
      return errorResponse("FORBIDDEN", "You are not authorized to view this ticket record", 403);
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to retrieve booking", 500);
  }
}
