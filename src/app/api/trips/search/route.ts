import { NextRequest, NextResponse } from "next/server";
import { searchTripsSchema } from "@/lib/validation/schemas";
import { TripService } from "@/services/trip-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get("origin") || "";
    const destination = searchParams.get("destination") || "";
    const date = searchParams.get("date") || "";
    const passengers = searchParams.get("passengers") || "1";

    const parsed = searchTripsSchema.safeParse({ origin, destination, date, passengers });
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
    }

    const trips = await TripService.searchTrips(parsed.data);
    return NextResponse.json({ success: true, count: trips.length, data: trips });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
