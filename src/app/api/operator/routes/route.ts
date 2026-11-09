import { NextRequest, NextResponse } from "next/server";
import { OperatorService } from "@/services/operator-service";
import { createRouteSchema } from "@/lib/validation/schemas";
import { requireRole, errorResponse } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["operator", "admin"]);
    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get("operatorId") || undefined;
    const routes = await OperatorService.getRoutes(operatorId);
    return NextResponse.json({ success: true, count: routes.length, data: routes });
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to retrieve routes", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["operator", "admin"]);
    const body = await req.json();
    const parsed = createRouteSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid route creation payload", 400, parsed.error.format());
    }

    const route = await OperatorService.createRoute(parsed.data);
    return NextResponse.json({ success: true, data: route }, { status: 201 });
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to create route", 500);
  }
}
