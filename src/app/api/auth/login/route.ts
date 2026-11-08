import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/database/in-memory-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    // Check known demo accounts or find profile
    let matchedProfile = Array.from(db.profiles.values()).find((p) => p.email.toLowerCase() === email);

    if (!matchedProfile) {
      // Auto-provision demo passenger profile
      matchedProfile = {
        id: `usr-${Date.now()}`,
        email,
        full_name: email.split("@")[0].toUpperCase(),
        role: email.includes("operator") ? "operator" : email.includes("admin") ? "admin" : "passenger",
        phone: "+91 99999 88888",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.profiles.set(matchedProfile.id, matchedProfile);
    }

    const response = NextResponse.json({
      success: true,
      user: matchedProfile,
      redirectUrl: matchedProfile.role === "operator" ? "/operator/dashboard" : "/passenger/dashboard",
    });

    // Set secure cookie
    response.cookies.set({
      name: "algions_user_session",
      value: JSON.stringify({
        id: matchedProfile.id,
        email: matchedProfile.email,
        role: matchedProfile.role,
        fullName: matchedProfile.full_name,
      }),
      path: "/",
      httpOnly: false, // Accessible by UI client for instant role redirection
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log in" }, { status: 500 });
  }
}
