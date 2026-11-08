import { NextRequest, NextResponse } from "next/server";
import { ManifestService } from "@/services/manifest-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");
    if (!tripId) {
      return NextResponse.json({ error: "tripId parameter is required" }, { status: 400 });
    }

    const manifest = await ManifestService.getManifestForTrip(tripId);
    return NextResponse.json({ success: true, count: manifest.length, data: manifest });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
