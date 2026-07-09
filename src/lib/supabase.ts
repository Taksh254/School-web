import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

/**
 * Returns true only when real Supabase credentials are configured.
 * The `hk_force_local` localStorage toggle has been removed — there is no
 * localStorage authentication mode in production.
 */
export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey
}

// Initialise with fallback placeholder strings if not configured to prevent
// crashes on startup (e.g. during `next build` when env vars are absent).
export const supabase = createBrowserClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_key"
)
