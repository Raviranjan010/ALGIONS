import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/services/report-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get("operatorId") || undefined;

    const reports = await ReportService.getOccupancyReports(operatorId);
    return NextResponse.json({ success: true, count: reports.length, data: reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

