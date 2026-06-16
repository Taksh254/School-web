import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const isSupabaseConfigured = (): boolean => {
  if (typeof window !== "undefined") {
    if (localStorage.getItem("hk_force_local") === "1") {
      return false
    }
  }
  return !!supabaseUrl && !!supabaseAnonKey
}

// Initialise with fallback placeholder strings if not configured to prevent crashes on startup
export const supabase = createBrowserClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_key"
)
