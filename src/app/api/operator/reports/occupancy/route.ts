import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/services/report-service";
import { requireRole, errorResponse } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Enforce operator or admin role
    await requireRole(req, ["operator", "admin"]);

    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get("operatorId") || undefined;

    const reports = await ReportService.getOccupancyReports(operatorId);
    return NextResponse.json({ success: true, count: reports.length, data: reports });
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to retrieve reports", 500);
  }
}
