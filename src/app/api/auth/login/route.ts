import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/database/in-memory-store";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { errorResponse } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: Max 15 login attempts per 5 minutes per IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`login:${clientIp}`, 15, 300_000);
    if (!rateCheck.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        `Too many login attempts. Please retry in ${rateCheck.resetInSeconds} seconds.`,
        429
      );
    }

    // 2. Validate request body
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid login credentials format", 400, parsed.error.format());
    }

    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;

    let userPayload: {
      id: string;
      email: string;
      fullName: string;
      role: "passenger" | "operator" | "admin";
    };

    // 3. Supabase Auth Verification
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
      }

      // Query verified profile from public.profiles
      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", authData.user.id)
        .single();

      const userRole = (profile?.role as any) || (authData.user.user_metadata?.role as any) || "passenger";
      const fullName = profile?.full_name || authData.user.user_metadata?.full_name || email.split("@")[0];

      userPayload = {
        id: authData.user.id,
        email: authData.user.email || email,
        fullName,
        role: userRole,
      };
    } else {
      // 4. Offline / Local Dev Authentication
      const profile = Array.from(db.profiles.values()).find((p) => p.email.toLowerCase() === email);

      // SECURITY INVARIANT: Do NOT auto-create accounts on login.
      if (!profile) {
        return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
      }

      // Verify passwords (demo credentials or development password)
      const validPasswords: Record<string, string> = {
        "passenger@algions.com": "Passenger@123",
        "operator@royalexpress.in": "Operator@123",
        "admin@algions.com": "Admin@123",
      };

      const expectedPassword = validPasswords[email];
      if (expectedPassword && password !== expectedPassword && password !== "Password@123") {
        return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
      }

      userPayload = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
      };
    }

    const redirectUrl =
      userPayload.role === "admin"
        ? "/operator/reports"
        : userPayload.role === "operator"
        ? "/operator/dashboard"
        : "/passenger/dashboard";

    const response = NextResponse.json({
      success: true,
      user: userPayload,
      redirectUrl,
    });

    // Set secure HTTP-only session cookie
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
    return errorResponse("INTERNAL_SERVER_ERROR", error.message || "Failed to log in", 500);
  }
}
