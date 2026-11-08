import { NextRequest, NextResponse } from "next/server";
import { OperatorService } from "@/services/operator-service";
import { createVehicleSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get("operatorId") || undefined;
    const vehicles = await OperatorService.getVehicles(operatorId);
    return NextResponse.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
    }

    const vehicle = await OperatorService.createVehicle(parsed.data);
    return NextResponse.json({ success: true, data: vehicle }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

