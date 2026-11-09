import { NextRequest, NextResponse } from "next/server";
import { OperatorService } from "@/services/operator-service";
import { createVehicleSchema } from "@/lib/validation/schemas";
import { requireRole, errorResponse } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["operator", "admin"]);
    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get("operatorId") || undefined;
    const vehicles = await OperatorService.getVehicles(operatorId);
    return NextResponse.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to retrieve vehicles", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["operator", "admin"]);
    const body = await req.json();
    const parsed = createVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid vehicle creation payload", 400, parsed.error.format());
    }

    const vehicle = await OperatorService.createVehicle(parsed.data);
    return NextResponse.json({ success: true, data: vehicle }, { status: 201 });
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to create vehicle", 500);
  }
}
