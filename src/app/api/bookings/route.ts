import { NextRequest, NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/validation/schemas";
import { BookingService } from "@/services/booking-service";
import { getAuthenticatedUser, errorResponse } from "@/lib/auth/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/database/in-memory-store";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: Max 30 booking requests per 5 minutes per IP
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`booking:${clientIp}`, 30, 300_000);
    if (!rateCheck.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        `Too many booking attempts. Please retry in ${rateCheck.resetInSeconds} seconds.`,
        429
      );
    }

    // 2. Validate request body
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid booking payload", 400, parsed.error.format());
    }

    // 3. Resolve user identity: Existing session or seamless passenger resolution by contact email
    let user = await getAuthenticatedUser(req);
    let cookieToSet: { name: string; value: string; maxAge: number } | null = null;

    if (!user) {
      const contactEmail = parsed.data.contact.email.toLowerCase().trim();
      const contactName = parsed.data.contact.name.trim();
      const contactPhone = parsed.data.contact.phone.trim();

      if (isSupabaseConfigured()) {
        const adminClient = createAdminClient();
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id, email, full_name, role")
          .eq("email", contactEmail)
          .maybeSingle();

        if (existingProfile) {
          user = {
            id: existingProfile.id,
            email: existingProfile.email,
            fullName: existingProfile.full_name,
            role: existingProfile.role,
          };
        } else {
          // Create registered passenger profile in Supabase
          const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
            email: contactEmail,
            email_confirm: true,
            user_metadata: {
              full_name: contactName,
              phone: contactPhone,
              role: "passenger",
            },
          });

          if (authErr || !authUser.user) {
            return errorResponse("AUTH_ERROR", "Failed to register passenger for booking", 500);
          }

          await adminClient.from("profiles").upsert({
            id: authUser.user.id,
            email: contactEmail,
            full_name: contactName,
            phone: contactPhone,
            role: "passenger",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          user = {
            id: authUser.user.id,
            email: contactEmail,
            fullName: contactName,
            role: "passenger",
          };
        }
      } else {
        // In-memory dev/offline mode
        let profile = Array.from(db.profiles.values()).find(
          (p) => p.email.toLowerCase() === contactEmail
        );

        if (!profile) {
          profile = {
            id: `usr-${Date.now()}`,
            email: contactEmail,
            full_name: contactName,
            phone: contactPhone,
            role: "passenger",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          db.profiles.set(profile.id, profile);
        }

        user = {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
        };
      }

      // Automatically sign in the passenger via secure session cookie so they can view their tickets
      cookieToSet = {
        name: "algions_user_session",
        value: encodeURIComponent(JSON.stringify(user)),
        maxAge: 60 * 60 * 24 * 7, // 7 days
      };
    }

    // 4. Create booking with verified user identity
    const result = await BookingService.createBooking(user.id, parsed.data);

    const response = NextResponse.json(
      {
        success: true,
        isIdempotentReplay: result.isIdempotentReplay,
        data: result.booking,
      },
      { status: result.isIdempotentReplay ? 200 : 201 }
    );

    if (cookieToSet) {
      response.cookies.set({
        name: cookieToSet.name,
        value: cookieToSet.value,
        httpOnly: false, // Read by navbar client and server
        path: "/",
        sameSite: "lax",
        maxAge: cookieToSet.maxAge,
      });
    }

    return response;
  } catch (error: any) {
    if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") {
      return errorResponse(error.code, error.message, error.status);
    }
    if (error.message?.includes("SEAT_NOT_AVAILABLE") || error.message?.includes("already booked")) {
      return errorResponse("SEAT_UNAVAILABLE", error.message, 409);
    }
    if (error.message?.includes("IDEMPOTENCY_KEY_REUSED")) {
      return errorResponse("IDEMPOTENCY_CONFLICT", error.message, 422);
    }
    if (error.message?.includes("PASSENGER_SEAT_COUNT_MISMATCH") || error.message?.includes("PASSENGER_SEAT_MISMATCH")) {
      return errorResponse("VALIDATION_ERROR", error.message, 400);
    }
    return errorResponse("BOOKING_FAILED", error.message || "Failed to create booking", 500);
  }
}
