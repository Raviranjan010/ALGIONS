import { NextRequest, NextResponse } from "next/server";
import { UserRole, Profile } from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/database/in-memory-store";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export class AuthError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(code: string, message: string, status: number = 401, details?: unknown) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Standard API error response helper
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Standard API success response helper
 */
export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      ...(typeof data === "object" && data !== null ? data : { data }),
    },
    { status }
  );
}

/**
 * Resolve authenticated user strictly from server-side session.
 * Never trusts caller-supplied headers like `x-user-id` in production.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  // 1. Production / Supabase Auth Mode
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      // Fetch verified profile from database
      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id, email, role, full_name")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // Fallback to passenger if profile not yet inserted
        return {
          id: user.id,
          email: user.email || "",
          role: (user.user_metadata?.role as UserRole) || "passenger",
          fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        };
      }

      return {
        id: profile.id,
        email: profile.email,
        role: profile.role as UserRole,
        fullName: profile.full_name,
      };
    } catch (err) {
      console.error("Error retrieving Supabase session:", err);
      return null;
    }
  }

  // 2. Offline / Local Dev / In-Memory Mock Mode
  // Inspect secure HTTP session cookie
  const sessionCookie = req.cookies.get("algions_user_session");
  if (sessionCookie && sessionCookie.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      if (parsed && parsed.id && parsed.email) {
        const profile = db.profiles.get(parsed.id);
        if (profile) {
          return {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            fullName: profile.full_name,
          };
        }
        return {
          id: parsed.id,
          email: parsed.email,
          role: parsed.role || "passenger",
          fullName: parsed.fullName || parsed.email.split("@")[0],
        };
      }
    } catch {
      // Invalid cookie JSON format
    }
  }

  // Check test header only in test/dev mode
  if (process.env.NODE_ENV !== "production") {
    const testUserId = req.headers.get("x-user-id");
    if (testUserId) {
      const testProfile = db.profiles.get(testUserId);
      if (testProfile) {
        return {
          id: testProfile.id,
          email: testProfile.email,
          role: testProfile.role,
          fullName: testProfile.full_name,
        };
      }
      return {
        id: testUserId,
        email: `${testUserId}@algions.test`,
        role: testUserId.includes("operator") ? "operator" : testUserId.includes("admin") ? "admin" : "passenger",
        fullName: "Test User",
      };
    }
  }

  return null;
}

/**
 * Require valid authenticated user session; otherwise throws 401 UNAUTHORIZED
 */
export async function requireAuth(req: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    throw new AuthError("UNAUTHORIZED", "Authentication required to access this resource", 401);
  }
  return user;
}

/**
 * Require user to possess one of the allowed roles; otherwise throws 403 FORBIDDEN
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(
      "FORBIDDEN",
      `Access denied. Required role: ${allowedRoles.join(" or ")}, but user has role: ${user.role}`,
      403
    );
  }
  return user;
}

/**
 * Require operator ownership: verifies user is an admin or an authorized member of the operator
 */
export async function requireOperatorAccess(
  req: NextRequest,
  operatorId?: string
): Promise<AuthenticatedUser> {
  const user = await requireRole(req, ["operator", "admin"]);
  if (user.role === "admin") {
    return user;
  }

  if (operatorId && isSupabaseConfigured()) {
    const adminClient = createAdminClient();
    const { data: membership } = await adminClient
      .from("operator_members")
      .select("id")
      .eq("operator_id", operatorId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      throw new AuthError(
        "FORBIDDEN",
        "You are not authorized to manage resources for this operator account",
        403
      );
    }
  }

  return user;
}
