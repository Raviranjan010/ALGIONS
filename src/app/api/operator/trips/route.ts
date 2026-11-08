import { NextRequest, NextResponse } from "next/server";
import { OperatorService } from "@/services/operator-service";
import { createTripSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTripSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
    }

    const trip = await OperatorService.createTrip(parsed.data);
    return NextResponse.json({ success: true, data: trip }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

