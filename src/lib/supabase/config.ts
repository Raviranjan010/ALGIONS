export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    anonKey &&
    !url.includes("dummy.supabase.co") &&
    !anonKey.includes("dummy-anon-key") &&
    url.startsWith("https://")
  );
}

