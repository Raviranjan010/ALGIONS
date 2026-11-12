import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional().or(z.literal("")),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
});

/**
 * Returns true if real, production-ready Supabase credentials are configured.
 */
export function isSupabaseConfigured(): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const hasPublicConfig = Boolean(
    url &&
    anon &&
    !url.includes("dummy.supabase.co") &&
    !anon.includes("dummy-anon-key") &&
    url.startsWith("https://")
  );

  if (typeof window !== "undefined") {
    return hasPublicConfig;
  }

  // On server, ensure service role key is also valid
  return Boolean(
    hasPublicConfig &&
    serviceKey &&
    !serviceKey.includes("dummy") &&
    serviceKey.length > 20
  );
}

/**
 * Fail fast in production if required database and security credentials are missing.
 */
export function assertProductionEnv(): void {
  if (env.NODE_ENV === "production") {
    if (!isSupabaseConfigured() || !env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.includes("dummy")) {
      throw new Error(
        "FATAL: Production environment requires valid NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY. Silent mock fallback is prohibited in production."
      );
    }
  }
}

