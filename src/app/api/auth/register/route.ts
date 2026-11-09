import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/database/in-memory-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { errorResponse, successResponse } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: Max 10 registrations per 5 minutes per IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`register:${clientIp}`, 10, 300_000);
    if (!rateCheck.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        `Too many registration attempts. Please retry in ${rateCheck.resetInSeconds} seconds.`,
        429
      );
    }

    // 2. Request body validation
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid registration payload", 400, parsed.error.format());
    }

    const email = parsed.data.email.toLowerCase().trim();
    const fullName = parsed.data.fullName.trim();
    const password = parsed.data.password;
    const phone = parsed.data.phone || null;

    // SECURITY INVARIANT: Public registration strictly defaults to passenger.
    // Elevated roles (operator, admin) can NEVER be self-assigned from the client.
    const assignedRole = "passenger";

    let createdUserId: string;

    // 3. Supabase Auth Registration
    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();

      // Check if user already exists
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingProfile) {
        return errorResponse("CONFLICT", "An account with this email address already exists", 409);
      }

      // Create Supabase Auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: assignedRole,
          phone,
        },
      });

      if (authError || !authData.user) {
        return errorResponse("REGISTRATION_FAILED", authError?.message || "Failed to create authentication user", 400);
      }

      createdUserId = authData.user.id;

      // Upsert profile in public schema
      await adminClient.from("profiles").upsert({
        id: createdUserId,
        email,
        full_name: fullName,
        role: assignedRole,
        phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      // Offline / Local Mock Registration
      const existing = Array.from(db.profiles.values()).find((p) => p.email.toLowerCase() === email);
      if (existing) {
        return errorResponse("CONFLICT", "An account with this email address already exists", 409);
      }

      createdUserId = `usr-${Date.now()}`;
      const newProfile = {
        id: createdUserId,
        email,
        full_name: fullName,
        role: "passenger" as const,
        phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.profiles.set(createdUserId, newProfile);
    }

    const userPayload = {
      id: createdUserId,
      email,
      fullName,
      role: assignedRole,
    };

    const response = NextResponse.json(
      {
        success: true,
        user: userPayload,
        redirectUrl: "/passenger/dashboard",
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "algions_user_session",
      value: JSON.stringify(userPayload),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to register user", 500);
  }
}
