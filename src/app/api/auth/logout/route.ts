import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });

    // Clear session cookies
    response.cookies.delete("algions_user_session");
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log out" }, { status: 500 });
  }
}
