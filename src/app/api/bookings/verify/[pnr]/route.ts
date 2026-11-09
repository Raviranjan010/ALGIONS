import { NextRequest, NextResponse } from "next/server";
import { BookingService } from "@/services/booking-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pnr: string }> }
) {
  try {
    const { pnr } = await params;
    if (!pnr || typeof pnr !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid PNR parameter is required" },
        { status: 400 }
      );
    }

    const verification = await BookingService.verifyTicket(pnr.trim().toUpperCase());
    if (!verification) {
      return NextResponse.json(
        { success: false, error: "Ticket with specified PNR not found in system" },
        { status: 404 }
      );
    }

    // Return strictly non-PII operational boarding authenticity data
    return NextResponse.json({
      success: true,
      data: verification,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify boarding pass" },
      { status: 500 }
    );
  }
}
