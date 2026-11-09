import { NextRequest, NextResponse } from "next/server";
import { ManifestService } from "@/services/manifest-service";
import { requireRole, errorResponse } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Enforce operator or admin role
    await requireRole(req, ["operator", "admin"]);

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");
    if (!tripId) {
      return errorResponse("VALIDATION_ERROR", "tripId parameter is required", 400);
    }

    const manifest = await ManifestService.getManifestForTrip(tripId);
    return NextResponse.json({ success: true, count: manifest.length, data: manifest });
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to retrieve manifest", 500);
  }
}
