import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/database/in-memory-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const existing = Array.from(db.profiles.values()).find((p) => p.email.toLowerCase() === email);
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const newProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: parsed.data.fullName,
      role: parsed.data.role,
      phone: parsed.data.phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.profiles.set(newProfile.id, newProfile);

    const response = NextResponse.json({
      success: true,
      user: newProfile,
      redirectUrl: newProfile.role === "operator" ? "/operator/dashboard" : "/passenger/dashboard",
    }, { status: 201 });

    response.cookies.set({
      name: "algions_user_session",
      value: JSON.stringify({
        id: newProfile.id,
        email: newProfile.email,
        role: newProfile.role,
        fullName: newProfile.full_name,
      }),
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to register" }, { status: 500 });
  }
}

