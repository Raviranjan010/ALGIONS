import { NextRequest, NextResponse } from "next/server";
import { TripService } from "@/services/trip-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const seats = await TripService.getTripSeats(id);
    return NextResponse.json({ success: true, count: seats.length, data: seats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

