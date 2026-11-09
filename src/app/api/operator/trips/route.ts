import { NextRequest, NextResponse } from "next/server";
import { OperatorService } from "@/services/operator-service";
import { createTripSchema } from "@/lib/validation/schemas";
import { requireRole, errorResponse } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["operator", "admin"]);
    const body = await req.json();
    const parsed = createTripSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid trip creation payload", 400, parsed.error.format());
    }

    const trip = await OperatorService.createTrip(parsed.data);
    return NextResponse.json({ success: true, data: trip }, { status: 201 });
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to create trip", 500);
  }
}
